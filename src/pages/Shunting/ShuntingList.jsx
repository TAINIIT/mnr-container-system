import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import RetrieveButton from '../../components/common/RetrieveButton';
import { Truck, Plus, Search, Play, CheckCircle, MapPin, Clock, AlertTriangle, ChevronLeft, ChevronRight, Users, ArrowRight, Flag, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { SHUNTING_STATUS } from '../../config/constants';
import { YARD_BLOCKS, LINERS } from '../../data/masterCodes';

export default function ShuntingList() {
    const { containers, repairOrders, surveys, eors, updateContainer } = useData();
    const { user } = useAuth();
    const { getCodeList } = useConfig();

    // Get drivers from Master Codes
    const DRIVERS = getCodeList('DRIVERS');
    const { t } = useLanguage();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const workflowFilter = searchParams.get('workflow_filter');

    const [shuntingRequests, setShuntingRequests] = useState(() => {
        const saved = localStorage.getItem('mnr_shunting');
        return saved ? JSON.parse(saved) : [];
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [formData, setFormData] = useState({ fromBlock: '', toBlock: '', priority: 'NORMAL', notes: '', driver: '' });

    // Search and filter state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Dispatch modal
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchRequest, setDispatchRequest] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState('');

    // Driver workload visibility toggle
    const [driverWorkloadVisible, setDriverWorkloadVisible] = useState(true);

    // Collapsible stats - hidden by default on tablet/mobile (<=1024px)
    const [statsVisible, setStatsVisible] = useState(() => window.innerWidth > 1024);

    // Collapsible filters - auto-collapse on mobile
    const [filtersVisible, setFiltersVisible] = useState(() => window.innerWidth > 768);

    // Containers that need shunting: have AR status OR have an approved EOR (backup check)
    const eligibleContainers = containers.filter(c => {
        // Already has pending shunting request that's not completed
        const hasPendingShunting = shuntingRequests.some(s =>
            s.containerId === c.id && s.status !== 'COMPLETED'
        );
        if (hasPendingShunting) return false;

        // Check if container status is AR (normal case)
        if (c.status === 'AR') return true;

        // Backup: check if container has an approved EOR (in case status wasn't synced)
        const hasApprovedEOR = eors.some(e =>
            e.containerId === c.id &&
            (e.status === 'APPROVED' || e.status === 'AUTO_APPROVED')
        );

        // Also check: container is in DM status but has approved EOR
        if ((c.status === 'DM' || c.status === 'STACKING') && hasApprovedEOR) {
            return true;
        }

        return false;
    });

    // Filter requests
    const filteredRequests = shuntingRequests.filter(req => {
        // Special workflow filter from Dashboard - show non-COMPLETED only
        if (workflowFilter === 'active') {
            if (req.status === 'COMPLETED') {
                return false;
            }
        }

        const matchesSearch = !search ||
            req.containerNumber.toLowerCase().includes(search.toLowerCase()) ||
            req.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || req.status === statusFilter;
        const matchesPriority = !priorityFilter || req.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Pagination
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats
    const stats = {
        total: shuntingRequests.length,
        new: shuntingRequests.filter(s => s.status === 'NEW').length,
        dispatched: shuntingRequests.filter(s => s.status === 'DISPATCHED').length,
        inProgress: shuntingRequests.filter(s => s.status === 'IN_PROGRESS').length,
        completed: shuntingRequests.filter(s => s.status === 'COMPLETED').length,
        urgent: shuntingRequests.filter(s => s.priority === 'URGENT' && s.status !== 'COMPLETED').length
    };

    // Driver workload
    // Calculate driver workload (active jobs count)
    const driverWorkload = DRIVERS.reduce((acc, driver) => {
        acc[driver.code] = shuntingRequests.filter(s =>
            s.assignedDriver === driver.code && s.status !== 'COMPLETED'
        ).length;
        return acc;
    }, {});

    const saveRequests = (requests) => {
        setShuntingRequests(requests);
        localStorage.setItem('mnr_shunting', JSON.stringify(requests));
    };

    const createRequest = () => {
        if (!selectedContainer || !formData.toBlock) {
            toast.error('Please select container and destination block');
            return;
        }

        const containerSurvey = surveys.find(s => s.containerId === selectedContainer.id && s.status === 'COMPLETED');
        const surveyTransactionId = containerSurvey?.id || selectedContainer.lastSurveyId || null;

        const request = {
            id: `${selectedContainer.containerNumber}-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(2, 14)}`,
            containerId: selectedContainer.id,
            containerNumber: selectedContainer.containerNumber,
            liner: selectedContainer.liner,
            surveyTransactionId,
            fromLocation: selectedContainer.yardLocation,
            toBlock: formData.toBlock,
            priority: formData.priority,
            status: formData.driver ? 'DISPATCHED' : 'NEW',
            assignedDriver: formData.driver || null,
            notes: formData.notes,
            createdBy: user.username,
            createdAt: new Date().toISOString(),
            dispatchedAt: formData.driver ? new Date().toISOString() : null
        };

        saveRequests([request, ...shuntingRequests]);
        toast.success('Shunting request created!');
        setShowModal(false);
        setSelectedContainer(null);
        setFormData({ fromBlock: '', toBlock: '', priority: 'NORMAL', notes: '', driver: '' });
    };

    // Open dispatch modal
    const openDispatchModal = (req) => {
        setDispatchRequest(req);
        setSelectedDriver(req.assignedDriver || '');
        setShowDispatchModal(true);
    };

    // Dispatch request to driver
    const dispatchToDriver = () => {
        if (!selectedDriver) {
            toast.error('Please select a driver');
            return;
        }

        const updated = shuntingRequests.map(s =>
            s.id === dispatchRequest.id ? {
                ...s,
                status: 'DISPATCHED',
                assignedDriver: selectedDriver,
                dispatchedAt: new Date().toISOString(),
                dispatchedBy: user.username
            } : s
        );
        saveRequests(updated);

        const driver = DRIVERS.find(d => d.code === selectedDriver);
        toast.success(`Dispatched to ${driver?.name}`);
        setShowDispatchModal(false);
        setDispatchRequest(null);
    };

    const updateStatus = (id, newStatus) => {
        const request = shuntingRequests.find(s => s.id === id);
        const updated = shuntingRequests.map(s => {
            if (s.id === id) {
                const updateData = {
                    ...s,
                    status: newStatus,
                    [`${newStatus.toLowerCase()}At`]: new Date().toISOString(),
                    [`${newStatus.toLowerCase()}By`]: user.username
                };

                // Calculate and save waitTime when status changes
                if (newStatus === 'IN_PROGRESS' && s.dispatchedAt) {
                    // Wait time from dispatch to start = driver response time
                    updateData.responseTimeMinutes = Math.floor(
                        (Date.now() - new Date(s.dispatchedAt).getTime()) / 60000
                    );
                }

                if (newStatus === 'COMPLETED' && s.createdAt) {
                    // Total wait time from creation to completion
                    updateData.totalWaitTimeMinutes = Math.floor(
                        (Date.now() - new Date(s.createdAt).getTime()) / 60000
                    );
                    // Processing time from start to completion
                    if (s.in_progressAt) {
                        updateData.processingTimeMinutes = Math.floor(
                            (Date.now() - new Date(s.in_progressAt).getTime()) / 60000
                        );
                    }
                }

                return updateData;
            }
            return s;
        });
        saveRequests(updated);

        // If completed, update container to REPAIR status and location
        if (newStatus === 'COMPLETED' && request) {
            updateContainer(request.containerId, {
                status: 'REPAIR',
                yardLocation: { block: request.toBlock, row: 1, tier: 1 },
                shuntedAt: new Date().toISOString()
            }, user.id);
            toast.success(`${request.containerNumber} moved to ${request.toBlock} - Status: REPAIR`);
        } else {
            toast.success(`Request ${newStatus.toLowerCase().replace('_', ' ')}`);
        }
    };

    return (
        <div className="page-list-layout">
            {/* Fixed Header Area */}
            <div className="page-list-header">
                <div className="page-header">
                    <div>
                        <h2>{t('shunting.title')}</h2>
                        <p className="text-muted">{t('shunting.moveContainers') || 'Move containers to repair bays'}</p>
                    </div>
                    <div className="flex gap-2">
                        <RetrieveButton screenId="shunting" />
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> {t('shunting.newRequest')}
                        </button>
                    </div>
                </div>

                {/* Stats Toggle Button - always visible on tablet/mobile */}
                <button
                    className="stats-toggle-btn"
                    onClick={() => setStatsVisible(!statsVisible)}
                >
                    <span>{t('common.stats') || 'Stats'}</span>
                    {statsVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {/* Compact Stats Row - Collapsible */}
                <div className={`compact-stats-wrapper ${!statsVisible ? 'collapsed' : ''}`}>
                    <div className="compact-stats">
                        <div className="compact-stat">
                            <span className="compact-stat-value">{stats.total}</span>
                            <span className="compact-stat-label">{t('shunting.totalRequests') || 'Total'}</span>
                        </div>
                        <div className="compact-stat">
                            <span className="compact-stat-value" style={{ color: 'var(--warning-500)' }}>{stats.new}</span>
                            <span className="compact-stat-label">{t('shunting.pending') || 'Pending'}</span>
                        </div>
                        <div className="compact-stat">
                            <span className="compact-stat-value" style={{ color: 'var(--secondary-500)' }}>{stats.dispatched}</span>
                            <span className="compact-stat-label">{t('shunting.dispatched') || 'Dispatched'}</span>
                        </div>
                        <div className="compact-stat">
                            <span className="compact-stat-value" style={{ color: 'var(--primary-500)' }}>{stats.inProgress}</span>
                            <span className="compact-stat-label">{t('shunting.inProgress') || 'In Progress'}</span>
                        </div>
                        <div className="compact-stat">
                            <span className="compact-stat-value" style={{ color: 'var(--error-500)' }}>{stats.urgent}</span>
                            <span className="compact-stat-label"><AlertTriangle size={12} /> {t('shunting.urgent') || 'Urgent'}</span>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Toggle */}
                <button
                    className={`mobile-filter-toggle ${!filtersVisible ? 'collapsed' : ''}`}
                    onClick={() => setFiltersVisible(!filtersVisible)}
                >
                    <Filter size={16} />
                    {filtersVisible ? t('common.hideFilters') || 'Hide Filters' : t('common.showFilters') || 'Show Filters'}
                    {filtersVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Filters */}
                <div className={`filters-wrapper mobile-collapse-default ${!filtersVisible ? 'collapsed' : ''}`}>
                    <div className="filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('common.search') + '...'}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <select
                            className="form-input"
                            style={{ width: 140 }}
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">{t('common.allStatuses') || 'All Statuses'}</option>
                            <option value="NEW">{t('shunting.new') || 'New'}</option>
                            <option value="DISPATCHED">{t('shunting.dispatched') || 'Dispatched'}</option>
                            <option value="IN_PROGRESS">{t('common.inProgress') || 'In Progress'}</option>
                            <option value="COMPLETED">{t('common.completed') || 'Completed'}</option>
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 130 }}
                            value={priorityFilter}
                            onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">{t('shunting.allPriorities') || 'All Priorities'}</option>
                            <option value="NORMAL">{t('shunting.normal') || 'Normal'}</option>
                            <option value="URGENT">{t('shunting.urgent') || 'Urgent'}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="page-list-content">
                {/* Driver Workload */}
                {stats.new + stats.dispatched + stats.inProgress > 0 && (
                    <div className="card mb-4 driver-workload">
                        <div
                            className="card-header"
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            onClick={() => setDriverWorkloadVisible(!driverWorkloadVisible)}
                        >
                            <h4 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={18} /> {t('shunting.driverWorkload') || 'Driver Workload'}
                            </h4>
                            <button className="btn btn-ghost btn-sm">
                                {driverWorkloadVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>
                        {driverWorkloadVisible && (
                            <div className="driver-grid" style={{ padding: 'var(--space-3)' }}>
                                {DRIVERS.filter(driver => driverWorkload[driver.code] > 0).length === 0 ? (
                                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: 'var(--space-2)' }}>
                                        {t('shunting.noActiveDrivers') || 'No drivers with active jobs'}
                                    </div>
                                ) : (
                                    DRIVERS.filter(driver => driverWorkload[driver.code] > 0).map(driver => (
                                        <div key={driver.code} className="driver-card">
                                            <div className="driver-name">{driver.name}</div>
                                            <div className="driver-tasks">
                                                <span className="task-count">{driverWorkload[driver.code]}</span>
                                                <span className="task-label">{t('driver.activeTasks') || 'active tasks'}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {filteredRequests.length === 0 ? (
                    <div className="empty-state">
                        <Truck size={48} />
                        <h3>{t('shunting.noRequests') || 'No shunting requests'}</h3>
                        <p>{t('shunting.createRequest') || 'Create a request to move containers to repair bays'}</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('columns.actions')}</th>
                                    <th>{t('columns.transactionId')}</th>
                                    <th>{t('columns.containerNumber')}</th>
                                    <th>{t('columns.liner')}</th>
                                    <th>{t('columns.route') || 'Route'}</th>
                                    <th>{t('columns.driver') || 'Driver'}</th>
                                    <th>{t('columns.priority')}</th>
                                    <th>{t('columns.shuntingStatus')}</th>
                                    <th>{t('columns.waitTime') || 'Wait Time'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRequests.map((req) => {
                                    // Calculate wait time
                                    const waitMinutes = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 60000);
                                    const waitDisplay = waitMinutes < 60
                                        ? `${waitMinutes}m`
                                        : `${Math.floor(waitMinutes / 60)}h ${waitMinutes % 60}m`;

                                    return (
                                        <tr key={req.id} className={req.priority === 'URGENT' ? 'urgent-row' : ''}>
                                            <td>
                                                <div className="action-buttons">
                                                    {req.status === 'NEW' && (
                                                        <>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => openDispatchModal(req)}
                                                                title={t('shunting.dispatch') || 'Dispatch'}
                                                            >
                                                                <Truck size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {req.status === 'DISPATCHED' && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => updateStatus(req.id, 'IN_PROGRESS')}
                                                        >
                                                            <Play size={14} />
                                                        </button>
                                                    )}
                                                    {req.status === 'IN_PROGRESS' && (
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => updateStatus(req.id, 'COMPLETED')}
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{req.surveyTransactionId || req.id}</td>
                                            <td><span className="container-number">{req.containerNumber}</span></td>
                                            <td>{req.liner}</td>
                                            <td>
                                                <div className="route-display">
                                                    <span className="from-location">
                                                        {req.fromLocation
                                                            ? `${req.fromLocation.block}-${req.fromLocation.row}-${req.fromLocation.tier}`
                                                            : '-'}
                                                    </span>
                                                    <ArrowRight size={14} />
                                                    <span className="to-location">{req.toBlock}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {req.assignedDriver ? (
                                                    <span className="driver-badge">
                                                        <Users size={12} />
                                                        {DRIVERS.find(d => d.code === req.assignedDriver)?.name}
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => openDispatchModal(req)}
                                                    >
                                                        <Users size={14} />
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${req.priority === 'URGENT' ? 'badge-dm' : 'badge-draft'}`}>
                                                    {req.priority === 'URGENT' && <Flag size={10} />}
                                                    {req.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${req.status.toLowerCase().replace('_', '-')}`}>
                                                    {req.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                {req.status !== 'COMPLETED' && (
                                                    <span className={`wait-time ${waitMinutes > 60 ? 'overdue' : ''}`}>
                                                        <Clock size={12} /> {waitDisplay}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Fixed Footer - Pagination */}
            {totalPages > 1 && (
                <div className="page-list-footer">
                    <div className="pagination">
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} /> {t('common.previous') || 'Previous'}
                        </button>
                        <span className="pagination-info">
                            {t('common.page') || 'Page'} {currentPage} {t('common.of') || 'of'} {totalPages}
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            {t('common.next') || 'Next'} <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('shunting.newShuntingRequest') || 'New Shunting Request'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">{t('common.selectContainer') || 'Select Container'}</label>
                                <select
                                    className="form-input"
                                    value={selectedContainer?.id || ''}
                                    onChange={(e) => setSelectedContainer(containers.find(c => c.id === e.target.value))}
                                >
                                    <option value="">{t('shunting.chooseContainer') || 'Choose container...'}</option>
                                    {eligibleContainers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.containerNumber} - {c.liner} - {c.yardLocation ?
                                                `${c.yardLocation.block}-${c.yardLocation.row}` : 'No location'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">{t('shunting.destinationBlock') || 'Destination Block'}</label>
                                <select
                                    className="form-input"
                                    value={formData.toBlock}
                                    onChange={(e) => setFormData(prev => ({ ...prev, toBlock: e.target.value }))}
                                >
                                    <option value="">{t('shunting.selectBlock') || 'Select block...'}</option>
                                    {YARD_BLOCKS.filter(b => b.type === 'REPAIR').map(b => (
                                        <option key={b.code} value={b.code}>{b.code} - {t('shunting.repairBay') || 'Repair Bay'}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)' }}>
                                <div className="form-group">
                                    <label className="form-label">{t('columns.priority') || 'Priority'}</label>
                                    <select
                                        className="form-input"
                                        value={formData.priority}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                    >
                                        <option value="NORMAL">{t('shunting.normal') || 'Normal'}</option>
                                        <option value="URGENT">{t('shunting.urgent') || 'Urgent'}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('shunting.assignDriver') || 'Assign Driver'}</label>
                                    <select
                                        className="form-input"
                                        value={formData.driver}
                                        onChange={(e) => setFormData(prev => ({ ...prev, driver: e.target.value }))}
                                    >
                                        <option value="">{t('shunting.assignLater') || 'Assign later...'}</option>
                                        {DRIVERS.map(d => (
                                            <option key={d.code} value={d.code}>
                                                {d.name} ({driverWorkload[d.code]} {t('driver.activeTasks') || 'công việc đang làm'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('common.notes') || 'Notes'}</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button className="btn btn-primary" onClick={createRequest}>
                                <Truck size={16} /> {t('shunting.createRequest') || 'Create Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispatch Modal */}
            {showDispatchModal && dispatchRequest && (
                <div className="modal-overlay" onClick={() => setShowDispatchModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('shunting.dispatchToDriver') || 'Dispatch to Driver'}</h3>
                        </div>
                        <div className="modal-body">
                            <div className="dispatch-info mb-4">
                                <div className="container-number">{dispatchRequest.containerNumber}</div>
                                <div className="route-display">
                                    <span>{dispatchRequest.fromLocation
                                        ? `${dispatchRequest.fromLocation.block}-${dispatchRequest.fromLocation.row}`
                                        : '-'}</span>
                                    <ArrowRight size={14} />
                                    <span>{dispatchRequest.toBlock}</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label required">{t('shunting.selectDriver') || 'Select Driver'}</label>
                                <div className="driver-selection">
                                    {DRIVERS.map(driver => (
                                        <button
                                            key={driver.code}
                                            className={`driver-option ${selectedDriver === driver.code ? 'selected' : ''}`}
                                            onClick={() => setSelectedDriver(driver.code)}
                                        >
                                            <span className="driver-name">{driver.name}</span>
                                            <span className="driver-workload">{driverWorkload[driver.code]} {t('driver.activeTasks') || 'công việc đang làm'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDispatchModal(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={dispatchToDriver}
                                disabled={!selectedDriver}
                            >
                                <Truck size={16} /> {t('shunting.dispatch') || 'Dispatch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
