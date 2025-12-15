import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import RetrieveButton from '../../components/common/RetrieveButton';
import { Wrench, Eye, Search, Play, CheckCircle, Users, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { RO_STATUS_LABELS, CONFIG } from '../../config/constants';
import { LINERS } from '../../data/masterCodes';

// Repair Teams for assignment
const REPAIR_TEAMS = [
    { id: 'team_a', name: 'Team A - Structural' },
    { id: 'team_b', name: 'Team B - Welding' },
    { id: 'team_c', name: 'Team C - Painting' },
    { id: 'team_d', name: 'Team D - General' }
];

export default function RepairOrderList() {
    const { repairOrders, updateRepairOrder, updateContainer } = useData();
    const { t } = useLanguage();
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const workflowFilter = searchParams.get('workflow_filter');

    // Search and filter state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [linerFilter, setLinerFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');

    // Assignment modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRO, setSelectedRO] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = CONFIG.CONTAINERS_PER_PAGE || 50;

    // Filter repair orders
    const filteredROs = repairOrders.filter(ro => {
        // Special workflow filter from Dashboard - show NEW, PENDING, IN_PROGRESS only
        if (workflowFilter === 'active') {
            if (ro.status !== 'NEW' && ro.status !== 'PENDING' && ro.status !== 'IN_PROGRESS') {
                return false;
            }
        }

        const matchesSearch = !search ||
            ro.containerNumber?.toLowerCase().includes(search.toLowerCase()) ||
            ro.id?.toLowerCase().includes(search.toLowerCase()) ||
            ro.surveyId?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || ro.status === statusFilter;
        const matchesLiner = !linerFilter || ro.liner === linerFilter;
        const matchesTeam = !teamFilter || ro.assignedTeam === teamFilter;
        return matchesSearch && matchesStatus && matchesLiner && matchesTeam;
    });

    // Pagination
    const totalPages = Math.ceil(filteredROs.length / itemsPerPage);
    const paginatedROs = filteredROs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1);
    };

    // Start repair action
    const handleStartRepair = (ro) => {
        if (ro.status === 'PENDING') {
            updateRepairOrder(ro.id, {
                status: 'IN_PROGRESS',
                startedAt: new Date().toISOString(),
                startedBy: user?.username
            }, user?.id);
            toast.success(`Repair started for ${ro.containerNumber}`);
        }
    };

    // Complete repair action
    const handleCompleteRepair = (ro) => {
        if (ro.status === 'IN_PROGRESS') {
            updateRepairOrder(ro.id, {
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                completedBy: user?.username
            }, user?.id);

            // Also update container status to COMPLETED so it appears in Pre-Inspection
            if (ro.containerId && updateContainer) {
                updateContainer(ro.containerId, {
                    status: 'COMPLETED',
                    repairEndTime: new Date().toISOString()
                }, user?.id);
            }

            toast.success(`Repair completed for ${ro.containerNumber}. Ready for Pre-Inspection.`);
        }
    };

    // Open assignment modal
    const handleOpenAssignModal = (ro) => {
        setSelectedRO(ro);
        setSelectedTeam(ro.assignedTeam || '');
        setShowAssignModal(true);
    };

    // Save team assignment
    const handleSaveAssignment = () => {
        if (selectedRO && selectedTeam) {
            updateRepairOrder(selectedRO.id, {
                assignedTeam: selectedTeam,
                assignedAt: new Date().toISOString(),
                assignedBy: user?.username
            }, user?.id);
            toast.success(`${selectedRO.containerNumber} assigned to ${REPAIR_TEAMS.find(t => t.id === selectedTeam)?.name}`);
            setShowAssignModal(false);
            setSelectedRO(null);
            setSelectedTeam('');
        }
    };

    // Get progress percentage based on status
    const getProgress = (status) => {
        switch (status) {
            case 'PENDING': return 0;
            case 'IN_PROGRESS': return 50;
            case 'COMPLETED': return 100;
            default: return 0;
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'PENDING': return 'badge-pending';
            case 'IN_PROGRESS': return 'badge-in-progress';
            case 'COMPLETED': return 'badge-completed';
            default: return 'badge-draft';
        }
    };

    return (
        <div className="page-list-layout">
            {/* Fixed Header Area */}
            <div className="page-list-header">
                <div className="page-header">
                    <div>
                        <h2>{t('repairOrder.title')}</h2>
                        <p className="text-muted">{t('repairOrder.roList')}</p>
                    </div>
                    <div className="header-stats">
                        <div className="header-stat">
                            <span className="header-stat-value">{repairOrders.filter(r => r.status === 'PENDING').length}</span>
                            <span className="header-stat-label">{t('common.pending') || 'Pending'}</span>
                        </div>
                        <div className="header-stat">
                            <span className="header-stat-value">{repairOrders.filter(r => r.status === 'IN_PROGRESS').length}</span>
                            <span className="header-stat-label">{t('common.inProgress') || 'In Progress'}</span>
                        </div>
                        <div className="header-stat">
                            <span className="header-stat-value">{repairOrders.filter(r => r.status === 'COMPLETED').length}</span>
                            <span className="header-stat-label">{t('common.completed') || 'Completed'}</span>
                        </div>
                        <RetrieveButton screenId="repair_orders" />
                    </div>
                </div>

                {/* Filters Section */}
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
                        style={{ width: 160 }}
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                    >
                        <option value="">{t('common.allStatuses') || 'All Statuses'}</option>
                        {Object.entries(RO_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        className="form-input"
                        style={{ width: 150 }}
                        value={linerFilter}
                        onChange={(e) => handleFilterChange(setLinerFilter, e.target.value)}
                    >
                        <option value="">{t('common.allLiners') || 'All Liners'}</option>
                        {LINERS.map((liner) => (
                            <option key={liner.code} value={liner.code}>{liner.code}</option>
                        ))}
                    </select>
                    <select
                        className="form-input"
                        style={{ width: 180 }}
                        value={teamFilter}
                        onChange={(e) => handleFilterChange(setTeamFilter, e.target.value)}
                    >
                        <option value="">{t('repairOrder.allTeams') || 'All Teams'}</option>
                        {REPAIR_TEAMS.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="page-list-content">
                {filteredROs.length === 0 ? (
                    <div className="empty-state">
                        <Wrench size={48} />
                        <h3>{t('repairOrder.noRepairOrders') || 'No repair orders'}</h3>
                        <p>{t('repairOrder.noRepairOrdersDesc') || 'Repair orders are created from approved EORs'}</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('columns.transactionId')}</th>
                                    <th>{t('columns.containerNumber')}</th>
                                    <th>{t('columns.liner')}</th>
                                    <th>{t('columns.progress') || 'Progress'}</th>
                                    <th>{t('columns.roStatus')}</th>
                                    <th>{t('columns.assignedTeam')}</th>
                                    <th>{t('columns.createdAt')}</th>
                                    <th>{t('columns.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedROs.map((ro) => (
                                    <tr key={ro.id} onDoubleClick={() => navigate(`/repair-orders/${ro.id}`)} style={{ cursor: 'pointer' }}>
                                        <td><span style={{ fontWeight: 500 }}>{ro.surveyId || ro.id}</span></td>
                                        <td><span className="container-number">{ro.containerNumber}</span></td>
                                        <td>{ro.liner}</td>
                                        <td>
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar"
                                                    style={{
                                                        width: `${getProgress(ro.status)}%`,
                                                        backgroundColor: ro.status === 'COMPLETED' ? 'var(--success-500)' :
                                                            ro.status === 'IN_PROGRESS' ? 'var(--warning-500)' : 'var(--neutral-400)'
                                                    }}
                                                />
                                            </div>
                                            <span className="progress-text">{getProgress(ro.status)}%</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(ro.status)}`}>
                                                {RO_STATUS_LABELS[ro.status]}
                                            </span>
                                        </td>
                                        <td>
                                            {ro.assignedTeam ? (
                                                <span className="team-badge">
                                                    <Users size={12} />
                                                    {REPAIR_TEAMS.find(t => t.id === ro.assignedTeam)?.name || ro.assignedTeam}
                                                </span>
                                            ) : (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); handleOpenAssignModal(ro); }}
                                                >
                                                    <Users size={14} /> {t('repairOrder.assign') || 'Assign'}
                                                </button>
                                            )}
                                        </td>
                                        <td>{new Date(ro.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {ro.status === 'PENDING' && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleStartRepair(ro); }}
                                                        title="Start Repair"
                                                    >
                                                        <Play size={14} /> {t('repairOrder.start') || 'Start'}
                                                    </button>
                                                )}
                                                {ro.status === 'IN_PROGRESS' && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleCompleteRepair(ro); }}
                                                        title="Complete Repair"
                                                    >
                                                        <CheckCircle size={14} /> {t('repairOrder.complete') || 'Complete'}
                                                    </button>
                                                )}
                                                <Link to={`/repair-orders/${ro.id}`} className="btn btn-ghost btn-sm">
                                                    <Eye size={16} /> {t('common.view') || 'View'}
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Fixed Footer - Pagination */}
            {filteredROs.length > 0 && totalPages > 1 && (
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
                            <span className="pagination-total">
                                ({filteredROs.length} {t('common.total') || 'total'})
                            </span>
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

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('repairOrder.assignTeam') || 'Assign Repair Team'}</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted mb-4">
                                {t('repairOrder.assignTeamDesc') || 'Select a team to assign this repair order to:'}
                            </p>
                            <div className="container-info mb-4">
                                <strong>{selectedRO?.containerNumber}</strong>
                                <span className="text-muted"> - {selectedRO?.liner}</span>
                            </div>
                            <div className="form-group">
                                <label>{t('repairOrder.selectTeam') || 'Select Team'}</label>
                                <select
                                    className="form-input"
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                >
                                    <option value="">{t('repairOrder.selectTeamPlaceholder') || '-- Select a team --'}</option>
                                    {REPAIR_TEAMS.map((team) => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveAssignment}
                                disabled={!selectedTeam}
                            >
                                <Users size={16} /> {t('repairOrder.assignTeam') || 'Assign Team'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
