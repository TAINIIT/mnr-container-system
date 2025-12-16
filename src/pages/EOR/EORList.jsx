import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import RetrieveButton from '../../components/common/RetrieveButton';
import { FileText, Search, Eye, RefreshCw, CheckCircle, XCircle, ChevronLeft, ChevronRight, DollarSign, Clock, CheckSquare, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { EOR_STATUS_LABELS, CONFIG } from '../../config/constants';
import { LINERS } from '../../data/masterCodes';

export default function EORList() {
    const { eors, syncApprovedEORsToAR, updateEOR } = useData();
    const { user, hasScreenPermission, canPerform } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const workflowFilter = searchParams.get('workflow_filter');

    // Tab state
    const [activeTab, setActiveTab] = useState('all');

    // Search and filter state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [linerFilter, setLinerFilter] = useState(() => {
        // Initialize liner filter for external users
        return (user?.userType === 'EXTERNAL' && user?.shippingLineCode) ? user.shippingLineCode : '';
    });

    // Bulk selection state
    const [selectedEORs, setSelectedEORs] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkAction, setBulkAction] = useState('');
    const [bulkNotes, setBulkNotes] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = CONFIG.CONTAINERS_PER_PAGE || 50;

    // Collapsible filters - auto-collapse on mobile
    const [filtersVisible, setFiltersVisible] = useState(() => window.innerWidth > 768);

    // Get EORs based on active tab
    const getTabFilteredEORs = () => {
        switch (activeTab) {
            case 'pending':
                return eors.filter(e => e.status === 'PENDING' || e.status === 'SENT');
            case 'approved':
                return eors.filter(e => e.status === 'APPROVED' || e.status === 'AUTO_APPROVED');
            case 'rejected':
                return eors.filter(e => e.status === 'REJECTED');
            default:
                return eors;
        }
    };

    // Apply additional filters
    const filteredEORs = getTabFilteredEORs().filter(e => {
        // Enforce liner filter for external users
        if (user?.userType === 'EXTERNAL' && user?.shippingLineCode) {
            if (e.liner !== user.shippingLineCode) return false;
        }

        // Special workflow filter from Dashboard
        if (workflowFilter === 'draft_sent') {
            // Show DRAFT or SENT EORs only
            if (e.status !== 'DRAFT' && e.status !== 'SENT') {
                return false;
            }
        } else if (workflowFilter === 'pending_approval') {
            // Show PENDING or SENT EORs only
            if (e.status !== 'PENDING' && e.status !== 'SENT') {
                return false;
            }
        }

        const matchesSearch = !search ||
            e.containerNumber.toLowerCase().includes(search.toLowerCase()) ||
            e.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || e.status === statusFilter;
        const matchesLiner = !linerFilter || e.liner === linerFilter;
        return matchesSearch && matchesStatus && matchesLiner;
    });

    // Pagination
    const totalPages = Math.ceil(filteredEORs.length / itemsPerPage);
    const paginatedEORs = filteredEORs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Tab counts
    const tabCounts = {
        all: eors.length,
        pending: eors.filter(e => e.status === 'PENDING' || e.status === 'SENT').length,
        approved: eors.filter(e => e.status === 'APPROVED' || e.status === 'AUTO_APPROVED').length,
        rejected: eors.filter(e => e.status === 'REJECTED').length
    };

    // Cost summary
    const costSummary = {
        totalValue: eors.reduce((sum, e) => sum + (e.totalCost || 0), 0),
        pendingValue: eors.filter(e => e.status === 'PENDING' || e.status === 'SENT').reduce((sum, e) => sum + (e.totalCost || 0), 0),
        approvedValue: eors.filter(e => e.status === 'APPROVED' || e.status === 'AUTO_APPROVED').reduce((sum, e) => sum + (e.totalCost || 0), 0),
        avgValue: eors.length > 0 ? Math.round(eors.reduce((sum, e) => sum + (e.totalCost || 0), 0) / eors.length) : 0
    };

    // Reset page when filters change
    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setStatusFilter('');
        setCurrentPage(1);
        setSelectedEORs([]);
    };

    const getStatusBadgeClass = (status) => {
        if (status.includes('APPROVED')) return 'badge-approved';
        if (status === 'REJECTED') return 'badge-rejected';
        if (status === 'PENDING' || status === 'SENT') return 'badge-pending';
        return 'badge-draft';
    };

    const handleSyncToAR = () => {
        const updated = syncApprovedEORsToAR();
        if (updated > 0) {
            toast.success(`Synced ${updated} containers to AR status`);
        } else {
            toast.info('All approved EORs are already synced');
        }
    };

    // Toggle single EOR selection
    const handleToggleSelect = (eorId) => {
        setSelectedEORs(prev =>
            prev.includes(eorId)
                ? prev.filter(id => id !== eorId)
                : [...prev, eorId]
        );
    };

    // Toggle all visible EORs
    const handleToggleAll = () => {
        const pendingIds = paginatedEORs
            .filter(e => e.status === 'PENDING' || e.status === 'SENT')
            .map(e => e.id);

        if (pendingIds.every(id => selectedEORs.includes(id))) {
            setSelectedEORs(prev => prev.filter(id => !pendingIds.includes(id)));
        } else {
            setSelectedEORs(prev => [...new Set([...prev, ...pendingIds])]);
        }
    };

    // Open bulk action modal
    const handleBulkAction = (action) => {
        setBulkAction(action);
        setBulkNotes('');
        setShowBulkModal(true);
    };

    // Execute bulk action
    const executeBulkAction = () => {
        const updates = selectedEORs.map(eorId => {
            const newStatus = bulkAction === 'approve' ? 'APPROVED' : 'REJECTED';
            return updateEOR(eorId, {
                status: newStatus,
                approvalNotes: bulkNotes,
                approvedAt: new Date().toISOString(),
                approvedBy: user?.username
            }, user?.id);
        });

        Promise.all(updates).then(() => {
            toast.success(`${selectedEORs.length} EORs ${bulkAction === 'approve' ? 'approved' : 'rejected'}`);
            setSelectedEORs([]);
            setShowBulkModal(false);
            setBulkNotes('');
        });
    };

    return (
        <div className="page-list-layout">
            {/* Fixed Header Area */}
            <div className="page-list-header">
                <div className="page-header">
                    <div>
                        <h2>{t('eor.eorList')}</h2>
                        <p className="text-muted">{t('eor.title')}</p>
                    </div>
                    <div className="flex gap-2">
                        <RetrieveButton screenId="eor_list" />
                        <button className="btn btn-secondary" onClick={handleSyncToAR}>
                            <RefreshCw size={16} /> {t('eor.syncToAR') || 'Sync to AR'}
                        </button>
                    </div>
                </div>

                {/* Cost Summary Dashboard */}
                <div className="cost-summary-row">
                    <div className="cost-card">
                        <DollarSign size={20} />
                        <div className="cost-card-content">
                            <div className="cost-card-value">RM {costSummary.totalValue.toLocaleString()}</div>
                            <div className="cost-card-label">{t('eor.totalValue') || 'Total Value'}</div>
                        </div>
                    </div>
                    <div className="cost-card pending">
                        <Clock size={20} />
                        <div className="cost-card-content">
                            <div className="cost-card-value">RM {costSummary.pendingValue.toLocaleString()}</div>
                            <div className="cost-card-label">{t('eor.pendingAmount') || 'Pending Approval'}</div>
                        </div>
                    </div>
                    <div className="cost-card approved">
                        <CheckCircle size={20} />
                        <div className="cost-card-content">
                            <div className="cost-card-value">RM {costSummary.approvedValue.toLocaleString()}</div>
                            <div className="cost-card-label">{t('eor.approvedAmount') || 'Approved'}</div>
                        </div>
                    </div>
                    <div className="cost-card">
                        <FileText size={20} />
                        <div className="cost-card-content">
                            <div className="cost-card-value">RM {costSummary.avgValue.toLocaleString()}</div>
                            <div className="cost-card-label">{t('eor.avgValue') || 'Average EOR'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between align-center mb-2">
                    {/* Tabs */}
                    <div className="eor-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => handleTabChange('all')}
                        >
                            {t('common.all') || 'All'} <span className="tab-count">{tabCounts.all}</span>
                        </button>
                        <button
                            className={`tab-btn pending ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => handleTabChange('pending')}
                        >
                            {t('eor.pendingApproval') || 'Pending Approval'} <span className="tab-count">{tabCounts.pending}</span>
                        </button>
                        <button
                            className={`tab-btn approved ${activeTab === 'approved' ? 'active' : ''}`}
                            onClick={() => handleTabChange('approved')}
                        >
                            {t('common.approved') || 'Approved'} <span className="tab-count">{tabCounts.approved}</span>
                        </button>
                        <button
                            className={`tab-btn rejected ${activeTab === 'rejected' ? 'active' : ''}`}
                            onClick={() => handleTabChange('rejected')}
                        >
                            {t('common.rejected') || 'Rejected'} <span className="tab-count">{tabCounts.rejected}</span>
                        </button>
                    </div>
                    <button
                        className={`filter-toggle-btn ${!filtersVisible ? 'collapsed' : ''}`}
                        onClick={() => setFiltersVisible(!filtersVisible)}
                        title={filtersVisible ? 'Hide Filters' : 'Show Filters'}
                    >
                        <Filter size={14} />
                        {filtersVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
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
                        {activeTab === 'all' && (
                            <select
                                className="form-input"
                                style={{ width: 200 }}
                                value={statusFilter}
                                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                            >
                                <option value="">{t('common.allStatuses') || 'All Statuses'}</option>
                                {Object.entries(EOR_STATUS_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        )}
                        <select
                            className="form-input"
                            style={{ width: 150 }}
                            value={linerFilter}
                            onChange={(e) => handleFilterChange(setLinerFilter, e.target.value)}
                            disabled={user?.userType === 'EXTERNAL'}
                            title={user?.userType === 'EXTERNAL' ? "Restricted to your shipping line" : "Filter by shipping line"}
                        >
                            <option value="">{t('common.allLiners') || 'All Liners'}</option>
                            {LINERS.map((liner) => (
                                <option key={liner.code} value={liner.code}>{liner.code}</option>
                            ))}
                        </select>

                        {/* Bulk Actions */}
                        {selectedEORs.length > 0 && (
                            <div className="bulk-actions">
                                <span className="selected-count">{selectedEORs.length} {t('common.selected') || 'selected'}</span>
                                <button className="btn btn-success btn-sm" onClick={() => handleBulkAction('approve')}>
                                    <CheckCircle size={14} /> {t('eor.approveSelected') || 'Approve'}
                                </button>
                                <button className="btn btn-error btn-sm" onClick={() => handleBulkAction('reject')}>
                                    <XCircle size={14} /> {t('eor.rejectSelected') || 'Reject'}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedEORs([])}>
                                    {t('common.clearSelection') || 'Clear'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="page-list-content">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                {(activeTab === 'pending' || activeTab === 'all') && (
                                    <th style={{ width: 40 }}>
                                        <input
                                            type="checkbox"
                                            onChange={handleToggleAll}
                                            checked={paginatedEORs.filter(e => e.status === 'PENDING' || e.status === 'SENT').length > 0 &&
                                                paginatedEORs.filter(e => e.status === 'PENDING' || e.status === 'SENT').every(e => selectedEORs.includes(e.id))}
                                        />
                                    </th>
                                )}
                                <th>{t('columns.transactionId')}</th>
                                <th>{t('columns.containerNumber')}</th>
                                <th>{t('columns.liner')}</th>
                                <th>{t('columns.totalCost')}</th>
                                <th>{t('columns.approval')}</th>
                                <th>{t('columns.eorStatus')}</th>
                                <th>{t('columns.createdAt')}</th>
                                <th>{t('columns.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEORs.map((eor) => {
                                const isExternal = user.userType === 'EXTERNAL';
                                const isLinerOwner = isExternal
                                    ? eor.liner === user.shippingLineCode
                                    : true;

                                // External liner owners get automatic approve/reject permission for their own EORs
                                const hasApprovePerm = isExternal
                                    ? isLinerOwner
                                    : (hasScreenPermission('eor_list', 'approve') || hasScreenPermission('eor_detail', 'approve') || canPerform('approve'));
                                const hasRejectPerm = isExternal
                                    ? isLinerOwner
                                    : (hasScreenPermission('eor_list', 'reject') || hasScreenPermission('eor_detail', 'reject') || canPerform('approve'));

                                const canApprove = (eor.status === 'PENDING' || eor.status === 'SENT') && hasApprovePerm;
                                const canReject = (eor.status === 'PENDING' || eor.status === 'SENT') && hasRejectPerm;

                                return (
                                    <tr key={eor.id} onDoubleClick={() => navigate(`/eor/${eor.id}`)} style={{ cursor: 'pointer' }}>
                                        {(activeTab === 'pending' || activeTab === 'all') && (
                                            <td onClick={e => e.stopPropagation()}>
                                                {(eor.status === 'PENDING' || eor.status === 'SENT') && isLinerOwner && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEORs.includes(eor.id)}
                                                        onChange={() => handleToggleSelect(eor.id)}
                                                    />
                                                )}
                                            </td>
                                        )}
                                        <td><span style={{ fontWeight: 500 }}>{eor.surveyId || eor.id}</span></td>
                                        <td><span className="container-number">{eor.containerNumber}</span></td>
                                        <td>{eor.liner}</td>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>RM {eor.totalCost}</span>
                                        </td>
                                        <td>
                                            {eor.autoApproved ? (
                                                <span className="badge badge-av">Auto</span>
                                            ) : eor.status === 'APPROVED' ? (
                                                <span className="badge badge-av">Manual</span>
                                            ) : eor.needApproval ? (
                                                <span className="badge badge-ar">Required</span>
                                            ) : (
                                                <span className="badge badge-draft">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(eor.status)}`}>
                                                {EOR_STATUS_LABELS[eor.status]}
                                            </span>
                                        </td>
                                        <td>{new Date(eor.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                {canApprove && (
                                                    <button
                                                        className="btn btn-success btn-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateEOR(eor.id, {
                                                                status: 'APPROVED',
                                                                approvedAt: new Date().toISOString(),
                                                                approvedBy: user?.username
                                                            }, user?.id);
                                                            toast.success(t('eor.approved') || 'EOR Approved');
                                                        }}
                                                        title={t('eor.approve')}
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                )}
                                                {canReject && (
                                                    <button
                                                        className="btn btn-error btn-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateEOR(eor.id, { status: 'REJECTED' }, user?.id);
                                                            toast.success(t('eor.rejected') || 'EOR Rejected');
                                                        }}
                                                        title={t('eor.reject')}
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                )}
                                                <Link to={`/eor/${eor.id}`} className="btn btn-ghost btn-sm">
                                                    <Eye size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredEORs.length === 0 && (
                    <div className="empty-state">
                        <FileText size={48} />
                        <h3>{t('eor.noEORsFound') || 'No EORs found'}</h3>
                        <p>{t('eor.createFromSurvey') || 'Create an EOR from a completed survey'}</p>
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
                            <span className="pagination-total">
                                ({filteredEORs.length} {t('common.total') || 'total'})
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

            {/* Bulk Action Modal */}
            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{bulkAction === 'approve' ? t('eor.bulkApprove') || 'Bulk Approve' : t('eor.bulkReject') || 'Bulk Reject'}</h3>
                        </div>
                        <div className="modal-body">
                            <p className="mb-4">
                                {bulkAction === 'approve'
                                    ? t('eor.bulkApproveConfirm') || `Are you sure you want to approve ${selectedEORs.length} EOR(s)?`
                                    : t('eor.bulkRejectConfirm') || `Are you sure you want to reject ${selectedEORs.length} EOR(s)?`
                                }
                            </p>
                            <div className="form-group">
                                <label>{t('eor.approvalNotes') || 'Notes (optional)'}</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={bulkNotes}
                                    onChange={(e) => setBulkNotes(e.target.value)}
                                    placeholder={t('eor.enterNotes') || 'Enter any notes for this action...'}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowBulkModal(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className={`btn ${bulkAction === 'approve' ? 'btn-success' : 'btn-error'}`}
                                onClick={executeBulkAction}
                            >
                                {bulkAction === 'approve' ? (
                                    <><CheckCircle size={16} /> {t('eor.approve') || 'Approve'}</>
                                ) : (
                                    <><XCircle size={16} /> {t('eor.reject') || 'Reject'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
