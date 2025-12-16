import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import RetrieveButton from '../../components/common/RetrieveButton';
import { Container, Search, Eye, AlertTriangle, ChevronLeft, ChevronRight, Clock, CheckSquare, History, ArrowRight, X, CheckCircle, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { CONTAINER_STATUS_LABELS, CONFIG } from '../../config/constants';
import { LINERS } from '../../data/masterCodes';

export default function ContainerList() {
    const { containers, surveys, eors, repairOrders, shunting, washingOrders, preinspections, stacking, updateContainer } = useData();
    const { user } = useAuth();
    // Helper to get user's shipping line
    const getExternalLiner = () => {
        if (user?.userType === 'EXTERNAL' && user?.shippingLineCode) {
            return user.shippingLineCode;
        }
        return null; // Internal users can see all
    };

    const externalLiner = getExternalLiner();

    // Initialize/Sync status filter
    const [statusFilter, setStatusFilter] = useState('');

    // Initialize liner filter - force external liner if applicable
    const [linerFilter, setLinerFilter] = useState(externalLiner || '');

    // Ensure external users can't clear the filter
    if (externalLiner && linerFilter !== externalLiner) {
        setLinerFilter(externalLiner);
    }

    const { t } = useLanguage();
    const toast = useToast();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Batch selection
    const [selectedContainers, setSelectedContainers] = useState([]);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchStatus, setBatchStatus] = useState('');

    // Timeline modal
    const [showTimeline, setShowTimeline] = useState(null);

    // Collapsible filters
    const [filtersVisible, setFiltersVisible] = useState(true);

    const ITEMS_PER_PAGE = CONFIG.CONTAINERS_PER_PAGE || 200;

    // Get shunting and inspection data
    const shuntingRequests = JSON.parse(localStorage.getItem('mnr_shunting') || '[]');
    const inspections = JSON.parse(localStorage.getItem('mnr_preinspections') || '[]');

    // Helper to check if container has active/incomplete workflow
    const hasActiveWorkflow = (container) => {
        // Check if container has any survey that is NOT completed/released
        const containerSurveys = surveys.filter(s => s.containerId === container.id);
        if (containerSurveys.length > 0) {
            // Has surveys - check if any are still in progress (not COMPLETED or RELEASED)
            const hasIncompleteSurvey = containerSurveys.some(s =>
                s.status !== 'COMPLETED' && s.status !== 'RELEASED'
            );
            if (hasIncompleteSurvey) return true;

            // Also check if there are active EORs or Repair Orders
            const hasActiveEOR = eors.some(e =>
                e.containerId === container.id &&
                !['APPROVED', 'AUTO_APPROVED', 'REJECTED'].includes(e.status)
            );
            if (hasActiveEOR) return true;

            const hasActiveRO = repairOrders.some(r =>
                r.containerId === container.id &&
                !['COMPLETED', 'QC_PASSED'].includes(r.status)
            );
            if (hasActiveRO) return true;
        }
        return false;
    };

    const filteredContainers = containers.filter(c => {
        const matchesSearch = !search ||
            c.containerNumber.toLowerCase().includes(search.toLowerCase()) ||
            (c.booking && c.booking.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesLiner = !linerFilter || c.liner === linerFilter;

        // WORKFLOW RULE: Hide containers with active (incomplete) workflow
        // Container is available if: no surveys, OR all surveys completed AND status is AV/COMPLETED
        const isAvailableForNewWorkflow = !hasActiveWorkflow(c);

        return matchesSearch && matchesStatus && matchesLiner && isAvailableForNewWorkflow;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredContainers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedContainers = filteredContainers.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1);
    };

    // Get container timeline/history
    const getContainerTimeline = (container) => {
        const timeline = [];

        // Gate In
        if (container.gateInDate) {
            timeline.push({
                event: 'Gate In',
                date: container.gateInDate,
                status: 'STACKING',
                icon: 'gate'
            });
        }

        // Survey
        const containerSurveys = surveys.filter(s => s.containerId === container.id);
        containerSurveys.forEach(s => {
            timeline.push({
                event: 'Survey Created',
                date: s.createdAt,
                status: s.status,
                details: `Type: ${s.surveyType}`,
                id: s.id,
                icon: 'survey'
            });
            if (s.status === 'COMPLETED') {
                timeline.push({
                    event: 'Survey Completed',
                    date: s.completedAt || s.updatedAt,
                    status: 'COMPLETED',
                    details: s.initialCondition === 'DAMAGED' ? 'Damage Found' : 'No Damage',
                    icon: 'survey'
                });
            }
        });

        // EOR
        const containerEORs = eors.filter(e => e.containerId === container.id);
        containerEORs.forEach(e => {
            timeline.push({
                event: 'EOR Created',
                date: e.createdAt,
                status: e.status,
                details: `Cost: RM ${e.totalCost}`,
                id: e.id,
                icon: 'eor'
            });
            if (e.status === 'APPROVED' || e.status === 'AUTO_APPROVED') {
                timeline.push({
                    event: e.autoApproved ? 'Auto-Approved' : 'EOR Approved',
                    date: e.approvedAt || e.updatedAt,
                    status: 'APPROVED',
                    icon: 'eor'
                });
            }
        });

        // Shunting
        const containerShunting = shuntingRequests.filter(s => s.containerId === container.id);
        containerShunting.forEach(s => {
            timeline.push({
                event: 'Shunting Request',
                date: s.createdAt,
                status: s.status,
                details: `To: ${s.toBlock}`,
                icon: 'shunting'
            });
            if (s.status === 'COMPLETED') {
                timeline.push({
                    event: 'Shunting Completed',
                    date: s.completedAt,
                    status: 'COMPLETED',
                    icon: 'shunting'
                });
            }
        });

        // Repair Order
        const containerROs = repairOrders.filter(r => r.containerId === container.id);
        containerROs.forEach(r => {
            timeline.push({
                event: 'Repair Order Created',
                date: r.createdAt,
                status: r.status,
                icon: 'repair'
            });
            if (r.status === 'IN_PROGRESS') {
                timeline.push({
                    event: 'Repair Started',
                    date: r.startedAt || r.updatedAt,
                    status: 'IN_PROGRESS',
                    icon: 'repair'
                });
            }
            if (r.status === 'COMPLETED') {
                timeline.push({
                    event: 'Repair Completed',
                    date: r.completedAt,
                    status: 'COMPLETED',
                    icon: 'repair'
                });
            }
        });

        // Pre-Inspection
        const containerInspections = inspections.filter(i => i.containerId === container.id);
        containerInspections.forEach(i => {
            timeline.push({
                event: 'Inspection Scheduled',
                date: i.createdAt,
                status: i.status,
                details: `Scheduled: ${new Date(i.scheduledDate).toLocaleDateString()}`,
                icon: 'inspection'
            });
            if (i.status === 'COMPLETED') {
                timeline.push({
                    event: i.result === 'ACCEPTED' ? 'Inspection Passed' : 'Rework Required',
                    date: i.completedAt,
                    status: i.result,
                    icon: 'inspection'
                });
            }
        });

        // Sort by date
        timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
        return timeline;
    };

    // Toggle container selection
    const toggleSelect = (containerId) => {
        setSelectedContainers(prev =>
            prev.includes(containerId)
                ? prev.filter(id => id !== containerId)
                : [...prev, containerId]
        );
    };

    // Select all visible containers
    const selectAll = () => {
        const visibleIds = paginatedContainers.map(c => c.id);
        if (visibleIds.every(id => selectedContainers.includes(id))) {
            setSelectedContainers(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setSelectedContainers(prev => [...new Set([...prev, ...visibleIds])]);
        }
    };

    // Execute batch status update
    const executeBatchUpdate = () => {
        if (!batchStatus || selectedContainers.length === 0) return;

        selectedContainers.forEach(containerId => {
            updateContainer(containerId, { status: batchStatus }, user?.username || 'SYSTEM');
        });

        toast.success(`Updated ${selectedContainers.length} containers to ${CONTAINER_STATUS_LABELS[batchStatus]}`);
        setSelectedContainers([]);
        setShowBatchModal(false);
        setBatchStatus('');
    };

    // Change STACKING container to DAMAGED
    const handleChangeToDamaged = (containerId, containerNumber) => {
        updateContainer(containerId, { status: 'DM' }, user?.username || 'SYSTEM');
        toast.success(`Container ${containerNumber} changed to Damaged status`);
    };

    const getStatusBadgeClass = (status) => {
        const map = {
            STACKING: 'stacking',
            AV: 'av',
            DM: 'dm',
            AR: 'ar',
            REPAIR: 'repair',
            COMPLETED: 'completed'
        };
        return `badge-${map[status] || 'draft'}`;
    };

    // Get workflow stage indicator - shows CURRENT active step
    const getWorkflowStage = (container) => {
        // If container is AV (Available) or released - no active workflow
        if (container.status === 'AV' || container.status === 'RELEASED') {
            return null;
        }

        // Get stacking data from context or localStorage
        const stackingData = stacking || JSON.parse(localStorage.getItem('mnr_stacking') || '[]');
        const washingData = washingOrders || JSON.parse(localStorage.getItem('mnr_washing') || '[]');
        const preinspectionData = preinspections || JSON.parse(localStorage.getItem('mnr_preinspections') || '[]');

        // Check workflow steps in REVERSE order (latest first)

        // 7. Stacking completed = workflow done
        const completedStacking = stackingData.find(s =>
            (s.containerId === container.id || s.containerNumber === container.containerNumber) &&
            s.status === 'COMPLETED'
        );
        if (completedStacking) return null; // Workflow complete

        // 7. Active Stacking
        const activeStacking = stackingData.find(s =>
            (s.containerId === container.id || s.containerNumber === container.containerNumber) &&
            s.status !== 'COMPLETED'
        );
        if (activeStacking) return { stage: 'Stacking', color: 'var(--info-500)' };

        // 6. Pre-Inspection
        const activePreinspection = preinspectionData.find(p =>
            (p.containerId === container.id || p.containerNumber === container.containerNumber) &&
            !['ACCEPTED', 'COMPLETED'].includes(p.status) && !p.result
        );
        if (activePreinspection) return { stage: 'Pre-Inspection', color: 'var(--purple-500)' };

        // 5. Washing
        const activeWashing = washingData.find(w =>
            (w.containerId === container.id || w.containerNumber === container.containerNumber) &&
            !['COMPLETED', 'QC_PASSED'].includes(w.status)
        );
        if (activeWashing) return { stage: 'Washing', color: 'var(--success-500)' };

        // 4. Repair Order
        const activeRO = repairOrders.find(r =>
            r.containerId === container.id &&
            !['COMPLETED', 'QC_PASSED'].includes(r.status)
        );
        if (activeRO) return { stage: 'Repair', color: 'var(--warning-500)' };

        // 3. Shunting
        const activeShunting = (shunting || []).find(s =>
            (s.containerId === container.id || s.containerNumber === container.containerNumber) &&
            s.status !== 'COMPLETED'
        );
        if (activeShunting) return { stage: 'Shunting', color: 'var(--orange-500)' };

        // 2. EOR pending approval
        const pendingEOR = eors.find(e =>
            e.containerId === container.id &&
            ['PENDING', 'SENT', 'DRAFT'].includes(e.status)
        );
        if (pendingEOR) return { stage: 'EOR Approval', color: 'var(--secondary-500)' };

        // 1. Survey
        const activeSurvey = surveys.find(s =>
            s.containerId === container.id &&
            !['COMPLETED', 'RELEASED'].includes(s.status)
        );
        if (activeSurvey) return { stage: 'Survey', color: 'var(--primary-500)' };

        return null;
    };

    return (
        <div className="page-list-layout">
            {/* Fixed Header Area */}
            <div className="page-list-header">
                <div className="page-header">
                    <div>
                        <h2>{t('nav.containerManagement')}</h2>
                        <p className="text-muted">{t('container.allContainers')}</p>
                    </div>
                    <div className="header-stats">
                        <div className="header-stat">
                            <span className="header-stat-value">{containers.filter(c => c.status === 'STACKING').length}</span>
                            <span className="header-stat-label">Stacking</span>
                        </div>
                        <div className="header-stat">
                            <span className="header-stat-value">{containers.filter(c => c.status === 'DM').length}</span>
                            <span className="header-stat-label">Damaged</span>
                        </div>
                        <div className="header-stat">
                            <span className="header-stat-value">{containers.filter(c => c.status === 'REPAIR').length}</span>
                            <span className="header-stat-label">In Repair</span>
                        </div>
                        <div className="header-stat">
                            <span className="header-stat-value">{containers.filter(c => c.status === 'AV').length}</span>
                            <span className="header-stat-label">Available</span>
                        </div>
                        <RetrieveButton screenId="container_list" />
                        <button
                            className={`filter-toggle-btn ${!filtersVisible ? 'collapsed' : ''}`}
                            onClick={() => setFiltersVisible(!filtersVisible)}
                            title={filtersVisible ? 'Hide Filters' : 'Show Filters'}
                        >
                            <Filter size={14} />
                            {filtersVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>

                <div className={`filters-wrapper ${!filtersVisible ? 'collapsed' : ''}`}>
                    <div className="filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('common.search') + '...'}
                                value={search}
                                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                            />
                        </div>
                        <select
                            className="form-input"
                            style={{ width: 180 }}
                            value={statusFilter}
                            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                        >
                            <option value="">{t('common.allStatuses') || 'All Statuses'}</option>
                            {Object.entries(CONTAINER_STATUS_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 180 }}
                            value={linerFilter}
                            onChange={(e) => handleFilterChange(setLinerFilter, e.target.value)}
                            disabled={!!externalLiner}
                            title={externalLiner ? "Restricted to your shipping line" : ""}
                        >
                            <option value="">{t('common.allLiners') || 'All Liners'}</option>
                            {LINERS.map(l => (
                                <option key={l.code} value={l.code}>{l.code} - {l.name}</option>
                            ))}
                        </select>

                        {/* Batch Actions */}
                        {selectedContainers.length > 0 && (
                            <div className="bulk-actions">
                                <span className="selected-count">{selectedContainers.length} {t('common.selected') || 'selected'}</span>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowBatchModal(true)}
                                >
                                    <CheckSquare size={14} /> {t('container.batchUpdate') || 'Batch Update'}
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setSelectedContainers([])}
                                >
                                    {t('common.clearSelection') || 'Clear'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination Info */}
                <div className="pagination-info">
                    <span>
                        {t('common.showing') || 'Showing'} {filteredContainers.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredContainers.length)} {t('common.of') || 'of'} {filteredContainers.length} {t('common.containers') || 'containers'}
                    </span>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="page-list-content">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>
                                    <input
                                        type="checkbox"
                                        onChange={selectAll}
                                        checked={paginatedContainers.length > 0 && paginatedContainers.every(c => selectedContainers.includes(c.id))}
                                    />
                                </th>
                                <th>{t('columns.actions')}</th>
                                <th>{t('columns.containerNumber')}</th>
                                <th>{t('columns.size')}/{t('columns.type')}</th>
                                <th>{t('columns.liner')}</th>
                                <th>{t('columns.containerStatus')}</th>
                                <th>{t('container.workflowStage') || 'Stage'}</th>
                                <th>{t('columns.location')}</th>
                                <th>{t('columns.gateInDate')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedContainers.map((container) => {
                                const workflowStage = getWorkflowStage(container);
                                return (
                                    <tr key={container.id} onDoubleClick={() => navigate(`/containers/${container.id}`)} style={{ cursor: 'pointer' }}>
                                        <td onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedContainers.includes(container.id)}
                                                onChange={() => toggleSelect(container.id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); setShowTimeline(container); }}
                                                    title={t('container.viewTimeline') || 'View Timeline'}
                                                >
                                                    <History size={16} />
                                                </button>
                                                <Link to={`/containers/${container.id}`} className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>
                                                    <Eye size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="container-number">{container.containerNumber}</span>
                                        </td>
                                        <td>{container.size}</td>
                                        <td>{container.liner}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(container.status)}`}>
                                                {CONTAINER_STATUS_LABELS[container.status]}
                                            </span>
                                        </td>
                                        <td>
                                            {workflowStage ? (
                                                <span className="workflow-stage-badge" style={{ background: workflowStage.color }}>
                                                    {workflowStage.stage}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            {container.yardLocation ?
                                                `${container.yardLocation.block}-${container.yardLocation.row}-${container.yardLocation.tier}` :
                                                '-'}
                                        </td>
                                        <td>{new Date(container.gateInDate).toLocaleDateString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredContainers.length === 0 && (
                    <div className="empty-state">
                        <Container size={48} />
                        <h3>{t('container.noContainersFound') || 'No containers found'}</h3>
                        <p>{t('container.adjustFilters') || 'Try adjusting your search or filters'}</p>
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
                        <div className="pagination-pages">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
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

            {/* Timeline Modal */}
            {showTimeline && (
                <div className="modal-overlay" onClick={() => setShowTimeline(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <History size={20} /> {t('container.containerTimeline') || 'Container Timeline'}
                            </h3>
                            <div className="modal-container-info">
                                <span className="container-number">{showTimeline.containerNumber}</span>
                                <span className="text-muted">{showTimeline.liner}</span>
                                <span className={`badge ${getStatusBadgeClass(showTimeline.status)}`}>
                                    {CONTAINER_STATUS_LABELS[showTimeline.status]}
                                </span>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="container-timeline">
                                {getContainerTimeline(showTimeline).map((event, index) => (
                                    <div key={index} className={`timeline-event ${event.status?.toLowerCase()}`}>
                                        <div className="timeline-event-dot"></div>
                                        <div className="timeline-event-content">
                                            <div className="timeline-event-header">
                                                <strong>{event.event}</strong>
                                                <span className="timeline-event-date">
                                                    {new Date(event.date).toLocaleString()}
                                                </span>
                                            </div>
                                            {event.details && (
                                                <p className="timeline-event-details">{event.details}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {getContainerTimeline(showTimeline).length === 0 && (
                                    <div className="empty-state">
                                        <Clock size={32} />
                                        <p>{t('container.noTimelineEvents') || 'No timeline events yet'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowTimeline(null)}>
                                {t('common.close') || 'Close'}
                            </button>
                            <Link to={`/containers/${showTimeline.id}`} className="btn btn-primary">
                                <Eye size={16} /> {t('container.viewDetails') || 'View Details'}
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Update Modal */}
            {showBatchModal && (
                <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <CheckSquare size={20} /> {t('container.batchStatusUpdate') || 'Batch Status Update'}
                            </h3>
                        </div>
                        <div className="modal-body">
                            <p className="mb-4">
                                {t('container.batchUpdateConfirm') || 'Update status for'} <strong>{selectedContainers.length}</strong> {t('common.containers') || 'containers'}:
                            </p>
                            <div className="form-group">
                                <label className="form-label required">{t('container.newStatus') || 'New Status'}</label>
                                <select
                                    className="form-input"
                                    value={batchStatus}
                                    onChange={(e) => setBatchStatus(e.target.value)}
                                >
                                    <option value="">{t('common.select') || 'Select status...'}</option>
                                    {Object.entries(CONTAINER_STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowBatchModal(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={executeBatchUpdate}
                                disabled={!batchStatus}
                            >
                                <CheckCircle size={16} /> {t('container.updateContainers') || 'Update Containers'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
