import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Droplets, Search, Filter, Calendar, Clock, CheckCircle,
    XCircle, AlertTriangle, Play, Eye, FileText, RefreshCw,
    User, MapPin, Truck, ShieldCheck, ShieldX, ChevronDown, ChevronUp
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import RetrieveButton from '../../components/common/RetrieveButton';
import './Washing.css';

const WashingList = () => {
    const navigate = useNavigate();
    const { washingOrders, containers, startWashingOrder, approveWashingOrder, rejectWashingOrder } = useData();
    const { getCodeList } = useConfig();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { addToast: showToast } = useToast();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [bayFilter, setBayFilter] = useState('ALL');
    const [programFilter, setProgramFilter] = useState('ALL');

    // Dashboard toggle state
    const [dashboardVisible, setDashboardVisible] = useState(true);

    // Get master data
    const CLEANING_PROGRAMS = getCodeList('CLEANING_PROGRAMS') || [];
    const WASH_BAYS = getCodeList('WASH_BAYS') || [];

    // Status configuration
    const STATUS_CONFIG = {
        'PENDING_APPROVAL': { label: 'Pending Approval', color: 'warning', icon: Clock },
        'PENDING_SCHEDULE': { label: 'Pending Schedule', color: 'info', icon: Calendar },
        'SCHEDULED': { label: 'Scheduled', color: 'info', icon: Calendar },
        'IN_PROGRESS': { label: 'In Progress', color: 'primary', icon: Play },
        'PENDING_QC': { label: 'Pending QC', color: 'warning', icon: Eye },
        'REWORK': { label: 'Rework Required', color: 'danger', icon: RefreshCw },
        'COMPLETED': { label: 'Completed', color: 'success', icon: CheckCircle },
        'REJECTED': { label: 'Rejected', color: 'danger', icon: XCircle }
    };

    // Filter washing orders
    const filteredOrders = useMemo(() => {
        return washingOrders.filter(wo => {
            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!wo.containerNumber?.toLowerCase().includes(search) &&
                    !wo.liner?.toLowerCase().includes(search) &&
                    !wo.id?.toLowerCase().includes(search)) {
                    return false;
                }
            }
            // Status filter
            if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false;
            // Bay filter
            if (bayFilter !== 'ALL' && wo.assignedBay !== bayFilter) return false;
            // Program filter
            if (programFilter !== 'ALL' && wo.cleaningProgram !== programFilter) return false;
            return true;
        });
    }, [washingOrders, searchTerm, statusFilter, bayFilter, programFilter]);

    // Statistics
    const stats = useMemo(() => ({
        pendingApproval: washingOrders.filter(w => w.status === 'PENDING_APPROVAL').length,
        pendingSchedule: washingOrders.filter(w => w.status === 'PENDING_SCHEDULE').length,
        scheduled: washingOrders.filter(w => w.status === 'SCHEDULED').length,
        inProgress: washingOrders.filter(w => w.status === 'IN_PROGRESS').length,
        pendingQC: washingOrders.filter(w => w.status === 'PENDING_QC').length,
        rework: washingOrders.filter(w => w.status === 'REWORK').length,
        completedToday: washingOrders.filter(w => {
            if (w.status !== 'COMPLETED') return false;
            const today = new Date().toDateString();
            return new Date(w.completedAt).toDateString() === today;
        }).length,
        total: washingOrders.length
    }), [washingOrders]);

    // Get containers ready for washing (after QC pass, need washing)
    const containersReadyForWashing = useMemo(() => {
        return containers.filter(c => {
            // Container should be in eligible status for washing
            // PENDING_WASH = marked for washing at registration, AV = available, COMPLETED = passed repair QC, STACKING = in yard, DM = damaged
            if (!['PENDING_WASH', 'COMPLETED', 'AV', 'STACKING', 'DM'].includes(c.status)) return false;
            // Check if already has active washing order
            const hasActiveWO = washingOrders.some(w =>
                w.containerId === c.id &&
                !['COMPLETED'].includes(w.status)
            );
            return !hasActiveWO;
        });
    }, [containers, washingOrders]);

    const handleStartCleaning = (wo) => {
        startWashingOrder(wo.id, user.username);
        showToast(t('washing.cleaningStarted') || 'Cleaning started', 'success');
    };

    // Handle supervisor approval
    const handleApprove = (wo) => {
        approveWashingOrder(wo.id, user.username);
        showToast(t('washing.orderApproved') || 'Washing order approved', 'success');
    };

    // Handle supervisor rejection
    const handleReject = (wo) => {
        const reason = prompt(t('washing.enterRejectionReason') || 'Enter rejection reason:');
        if (reason) {
            rejectWashingOrder(wo.id, user.username, reason);
            showToast(t('washing.orderRejected') || 'Washing order rejected', 'warning');
        }
    };

    const getProgram = (code) => CLEANING_PROGRAMS.find(p => p.code === code);
    const getBay = (code) => WASH_BAYS.find(b => b.code === code);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="washing-list-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1><Droplets size={24} /> {t('washing.title') || 'Washing Station'}</h1>
                    <p className="text-muted">{t('washing.subtitle') || 'Container cleaning and sanitization management'}</p>
                </div>
                <div className="header-actions">
                    <RetrieveButton screenId="washing" />
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/washing/new')}
                    >
                        <Droplets size={16} /> {t('washing.newWashingOrder') || 'New Washing Order'}
                    </button>
                </div>
            </div>

            {/* Collapsible Stats Dashboard */}
            <div className="card mb-4">
                <div
                    className="card-header"
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-3) var(--space-4)'
                    }}
                    onClick={() => setDashboardVisible(!dashboardVisible)}
                >
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-base)' }}>
                        <Droplets size={16} /> Dashboard
                        <span className="badge badge-secondary" style={{ fontSize: '11px', marginLeft: '8px' }}>
                            {stats.inProgress + stats.pendingApproval + stats.pendingSchedule} active
                        </span>
                    </h4>
                    {dashboardVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {dashboardVisible && (
                    <div className="stats-grid" style={{ padding: 'var(--space-3)', gap: 'var(--space-2)' }}>
                        <div className="stat-card warning" style={{ padding: 'var(--space-2)' }}>
                            <div className="stat-icon" style={{ width: '32px', height: '32px' }}><ShieldCheck size={16} /></div>
                            <div className="stat-info">
                                <span className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{stats.pendingApproval}</span>
                                <span className="stat-label" style={{ fontSize: '11px' }}>{t('washing.pendingApproval') || 'Pending Approval'}</span>
                            </div>
                        </div>
                        <div className="stat-card info" style={{ padding: 'var(--space-2)' }}>
                            <div className="stat-icon" style={{ width: '32px', height: '32px' }}><Clock size={16} /></div>
                            <div className="stat-info">
                                <span className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{stats.pendingSchedule}</span>
                                <span className="stat-label" style={{ fontSize: '11px' }}>{t('washing.pendingSchedule') || 'Pending Schedule'}</span>
                            </div>
                        </div>
                        <div className="stat-card info" style={{ padding: 'var(--space-2)' }}>
                            <div className="stat-icon" style={{ width: '32px', height: '32px' }}><Calendar size={16} /></div>
                            <div className="stat-info">
                                <span className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{stats.scheduled}</span>
                                <span className="stat-label" style={{ fontSize: '11px' }}>{t('washing.scheduled') || 'Scheduled'}</span>
                            </div>
                        </div>
                        <div className="stat-card primary" style={{ padding: 'var(--space-2)' }}>
                            <div className="stat-icon" style={{ width: '32px', height: '32px' }}><Play size={16} /></div>
                            <div className="stat-info">
                                <span className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{stats.inProgress}</span>
                                <span className="stat-label" style={{ fontSize: '11px' }}>{t('washing.inProgress') || 'In Progress'}</span>
                            </div>
                        </div>
                        <div className="stat-card warning" style={{ padding: 'var(--space-2)' }}>
                            <div className="stat-icon" style={{ width: '32px', height: '32px' }}><Eye size={16} /></div>
                            <div className="stat-info">
                                <span className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{stats.pendingQC}</span>
                                <span className="stat-label" style={{ fontSize: '11px' }}>{t('washing.pendingQC') || 'Pending QC'}</span>
                            </div>
                        </div>
                        <div className="stat-card danger" style={{ padding: 'var(--space-2)' }}>
                            <div className="stat-icon" style={{ width: '32px', height: '32px' }}><RefreshCw size={16} /></div>
                            <div className="stat-info">
                                <span className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{stats.rework}</span>
                                <span className="stat-label" style={{ fontSize: '11px' }}>{t('washing.rework') || 'Rework'}</span>
                            </div>
                        </div>
                        <div className="stat-card success" style={{ padding: 'var(--space-2)' }}>
                            <div className="stat-icon" style={{ width: '32px', height: '32px' }}><CheckCircle size={16} /></div>
                            <div className="stat-info">
                                <span className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{stats.completedToday}</span>
                                <span className="stat-label" style={{ fontSize: '11px' }}>{t('washing.completedToday') || 'Completed Today'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder={t('washing.searchPlaceholder') || 'Search container, liner...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={16} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">{t('common.allStatuses') || 'All Statuses'}</option>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                    <select value={bayFilter} onChange={(e) => setBayFilter(e.target.value)}>
                        <option value="ALL">{t('washing.allBays') || 'All Bays'}</option>
                        {WASH_BAYS.filter(b => b.active !== false).map(bay => (
                            <option key={bay.code} value={bay.code}>{bay.name}</option>
                        ))}
                    </select>
                    <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
                        <option value="ALL">{t('washing.allPrograms') || 'All Programs'}</option>
                        {CLEANING_PROGRAMS.filter(p => p.active !== false).map(prog => (
                            <option key={prog.code} value={prog.code}>{prog.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Washing Orders Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('columns.containerNumber') || 'Container'}</th>
                            <th>{t('columns.type') || 'Type'}</th>
                            <th>{t('columns.liner') || 'Liner'}</th>
                            <th>{t('washing.program') || 'Program'}</th>
                            <th>{t('washing.bay') || 'Bay'}</th>
                            <th>{t('common.status') || 'Status'}</th>
                            <th>{t('washing.scheduledAt') || 'Scheduled'}</th>
                            <th>{t('common.actions') || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-state">
                                    <Droplets size={48} />
                                    <p>{t('washing.noOrders') || 'No washing orders found'}</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(wo => {
                                const statusConfig = STATUS_CONFIG[wo.status] || STATUS_CONFIG['PENDING_SCHEDULE'];
                                const StatusIcon = statusConfig.icon;
                                const program = getProgram(wo.cleaningProgram);
                                const bay = getBay(wo.assignedBay);

                                return (
                                    <tr key={wo.id} className={wo.status === 'REWORK' ? 'rework-row' : ''}>
                                        <td>
                                            <div className="container-cell">
                                                <span className="container-number">{wo.containerNumber}</span>
                                                <span className="container-id">{wo.id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`type-badge ${wo.containerType?.toLowerCase()}`}>
                                                {wo.containerType}
                                            </span>
                                        </td>
                                        <td>{wo.liner}</td>
                                        <td>
                                            <span className="program-badge">
                                                {program?.name || wo.cleaningProgram}
                                            </span>
                                        </td>
                                        <td>
                                            {bay ? (
                                                <span className="bay-badge">
                                                    <MapPin size={12} /> {bay.name}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${statusConfig.color}`}>
                                                <StatusIcon size={14} />
                                                {statusConfig.label}
                                                {wo.reworkCount > 0 && (
                                                    <span className="rework-count">#{wo.reworkCount}</span>
                                                )}
                                            </span>
                                        </td>
                                        <td>{formatDate(wo.scheduledAt)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {wo.status === 'PENDING_APPROVAL' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleApprove(wo)}
                                                            title={t('washing.approve') || 'Approve'}
                                                        >
                                                            <ShieldCheck size={14} /> {t('common.approve') || 'Approve'}
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleReject(wo)}
                                                            title={t('washing.reject') || 'Reject'}
                                                        >
                                                            <ShieldX size={14} /> {t('common.reject') || 'Reject'}
                                                        </button>
                                                    </>
                                                )}
                                                {wo.status === 'PENDING_SCHEDULE' && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => navigate(`/washing/schedule/${wo.id}`)}
                                                    >
                                                        <Calendar size={14} /> Schedule
                                                    </button>
                                                )}
                                                {wo.status === 'SCHEDULED' && (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleStartCleaning(wo)}
                                                    >
                                                        <Play size={14} /> Start
                                                    </button>
                                                )}
                                                {wo.status === 'IN_PROGRESS' && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => navigate(`/washing/work/${wo.id}`)}
                                                    >
                                                        <Droplets size={14} /> Work
                                                    </button>
                                                )}
                                                {(wo.status === 'PENDING_QC' || wo.status === 'REWORK') && (
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => navigate(`/washing/qc/${wo.id}`)}
                                                    >
                                                        <Eye size={14} /> QC
                                                    </button>
                                                )}
                                                {wo.status === 'COMPLETED' && wo.certificateNumber && (
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => navigate(`/washing/certificate/${wo.id}`)}
                                                    >
                                                        <FileText size={14} /> Certificate
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => navigate(`/washing/detail/${wo.id}`)}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Ready for Washing Section - Now with search and table view */}
            {containersReadyForWashing.length > 0 && (
                <div className="ready-section">
                    <h3><Truck size={18} /> {t('washing.readyForWashing') || 'Containers Ready for Washing'} ({containersReadyForWashing.length})</h3>

                    {/* Search box for containers */}
                    <div className="search-box" style={{ marginBottom: '16px', maxWidth: '400px' }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder={t('washing.searchContainer') || 'Search container number...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Table view for better handling of many containers */}
                    <div className="data-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('columns.containerNumber')}</th>
                                    <th>{t('columns.type')}</th>
                                    <th>{t('columns.liner')}</th>
                                    <th>{t('columns.containerStatus')}</th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {containersReadyForWashing
                                    .filter(c => !searchTerm || c.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) || c.liner?.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .slice(0, 50) // Show max 50 at a time
                                    .map(c => (
                                        <tr key={c.id}>
                                            <td><span className="container-number">{c.containerNumber}</span></td>
                                            <td><span className={`type-badge ${c.type?.toLowerCase()}`}>{c.type}</span></td>
                                            <td>{c.liner}</td>
                                            <td><span className={`status-badge status-${c.status?.toLowerCase()}`}>{c.status}</span></td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => navigate(`/washing/new?containerId=${c.id}`)}
                                                >
                                                    <Droplets size={14} /> {t('washing.createOrder') || 'Create Order'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {containersReadyForWashing.length > 50 && (
                            <p className="text-muted" style={{ padding: '12px', textAlign: 'center' }}>
                                Showing 50 of {containersReadyForWashing.length} containers. Use search to find specific containers.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WashingList;
