import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import {
    Container,
    ClipboardList,
    FileText,
    Wrench,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowRight,
    Layers,
    Search,
    Truck,
    ClipboardCheck,
    Package,
    Bell,
    Activity,
    TrendingUp,
    Droplets
} from 'lucide-react';
import { CONTAINER_STATUS, CONTAINER_STATUS_LABELS } from '../config/constants';
import RepairCycleChart from '../components/Charts/RepairCycleChart';
import './Dashboard.css';

export default function Dashboard() {
    const { containers, surveys, eors, repairOrders, getContainerStats, getEORStats, auditLogs, reloadFromStorage } = useData();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Use state for localStorage data so it refreshes
    const [shuntingRequests, setShuntingRequests] = useState([]);
    const [inspections, setInspections] = useState([]);
    const [stackingRequests, setStackingRequests] = useState([]);
    const [washingOrders, setWashingOrders] = useState([]);

    // Refresh localStorage data when component mounts or becomes visible
    useEffect(() => {
        const refreshData = () => {
            // Refresh localStorage-only data (DataContext data is already reactive)
            setShuntingRequests(JSON.parse(localStorage.getItem('mnr_shunting') || '[]'));
            setInspections(JSON.parse(localStorage.getItem('mnr_preinspections') || '[]'));
            setStackingRequests(JSON.parse(localStorage.getItem('mnr_stacking') || '[]'));
            setWashingOrders(JSON.parse(localStorage.getItem('mnr_washing') || '[]'));
        };

        // Initial load
        refreshData();

        // Poll for updates every 2 seconds for real-time dashboard  
        const pollInterval = setInterval(refreshData, 2000);

        // Also refresh when tab becomes visible or window gains focus
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshData();
                reloadFromStorage(); // Reload DataContext when tab regains focus
            }
        };
        const handleFocus = () => {
            refreshData();
            reloadFromStorage(); // Reload DataContext when window gains focus
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(pollInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const containerStats = getContainerStats();
    const eorStats = getEORStats();


    // Calculate workflow stage counts
    const workflowStages = [
        {
            id: 'stacking',
            label: t('workflow.stacking') || 'Stacking',
            icon: Package,
            count: containers.filter(c => c.status === 'STACKING').length,
            color: 'var(--neutral-500)',
            path: '/containers?status=STACKING'
        },
        {
            id: 'washing',
            label: t('workflow.washing') || 'Washing',
            icon: Droplets,
            count: washingOrders.filter(w => w.status !== 'COMPLETED').length,
            color: 'var(--info-500)',
            path: '/washing'
        },
        {
            id: 'survey',
            label: t('workflow.survey') || 'Survey',
            icon: ClipboardList,
            count: surveys.filter(s => s.status === 'DRAFT' || s.status === 'IN_PROGRESS').length,
            color: 'var(--primary-500)',
            path: '/surveys?workflow_filter=active'
        },
        {
            id: 'eor',
            label: t('workflow.eor') || 'EOR',
            icon: FileText,
            count: eors.filter(e => e.status === 'DRAFT' || e.status === 'SENT').length,
            color: 'var(--warning-500)',
            path: '/eor?workflow_filter=draft_sent'
        },
        {
            id: 'approval',
            label: t('workflow.approval') || 'Approval',
            icon: CheckCircle,
            count: eors.filter(e => e.status === 'PENDING' || e.status === 'SENT').length,
            color: 'var(--secondary-500)',
            path: '/eor?workflow_filter=pending_approval'
        },
        {
            id: 'repair',
            label: t('workflow.repair') || 'Repair',
            icon: Wrench,
            count: repairOrders.filter(r => r.status === 'NEW' || r.status === 'PENDING' || r.status === 'IN_PROGRESS').length,
            color: 'var(--error-500)',
            path: '/repair-orders?workflow_filter=active'
        },
        {
            id: 'shunting',
            label: t('workflow.shunting') || 'Shunting',
            icon: Truck,
            count: shuntingRequests.filter(s => s.status !== 'COMPLETED').length,
            color: 'var(--info-500)',
            path: '/shunting?workflow_filter=active'
        },
        {
            id: 'qc',
            label: t('workflow.qc') || 'QC',
            icon: ClipboardCheck,
            count: inspections.filter(i => i.result === 'PENDING').length,
            color: 'var(--accent-500)',
            path: '/pre-inspection?workflow_filter=pending'
        },
        {
            id: 'release',
            label: t('workflow.release') || 'Release',
            icon: Package,
            count: stackingRequests.filter(s => s.status === 'COMPLETED').length,
            color: 'var(--success-500)',
            path: '/stacking?workflow_filter=completed'
        }
    ];

    // Calculate pending actions
    const pendingActions = [
        {
            id: 'pending_surveys',
            label: t('pending.surveysToComplete') || 'Surveys to Complete',
            count: surveys.filter(s => s.status === 'IN_PROGRESS').length,
            icon: ClipboardList,
            path: '/surveys?status=IN_PROGRESS',
            priority: 'high'
        },
        {
            id: 'pending_approvals',
            label: t('pending.approvalsNeeded') || 'Approvals Needed',
            count: eors.filter(e => e.status === 'PENDING' || e.status === 'SENT').length,
            icon: CheckCircle,
            path: '/eor?status=PENDING',
            priority: 'high'
        },
        {
            id: 'pending_repairs',
            label: t('pending.repairsInProgress') || 'Repairs in Progress',
            count: repairOrders.filter(r => r.status === 'IN_PROGRESS').length,
            icon: Wrench,
            path: '/repair-orders',
            priority: 'medium'
        },
        {
            id: 'pending_inspections',
            label: t('pending.inspectionsPending') || 'Inspections Pending',
            count: inspections.filter(i => i.result === 'PENDING').length,
            icon: ClipboardCheck,
            path: '/pre-inspection',
            priority: 'medium'
        }
    ].filter(a => a.count > 0);

    // Get recent activity from audit logs or create from recent changes
    const recentActivity = [
        ...surveys.slice(0, 3).map(s => ({
            type: 'survey',
            icon: ClipboardList,
            text: `Survey created for ${s.containerNumber}`,
            time: s.createdAt,
            path: `/surveys/${s.id}`
        })),
        ...eors.slice(0, 3).map(e => ({
            type: 'eor',
            icon: FileText,
            text: `EOR ${e.status.toLowerCase()} - ${e.containerNumber}`,
            time: e.updatedAt || e.createdAt,
            path: `/eor/${e.id}`
        })),
        ...repairOrders.slice(0, 2).map(r => ({
            type: 'repair',
            icon: Wrench,
            text: `Repair order ${r.status.toLowerCase().replace('_', ' ')} - ${r.containerNumber}`,
            time: r.createdAt,
            path: `/repair-orders/${r.id}`
        }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

    // Quick search handler
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/containers?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const statCards = [
        {
            icon: Container,
            label: t('dashboard.totalContainers') || 'Total Containers',
            value: containerStats.total,
            color: 'var(--primary-500)',
            bg: 'rgba(22, 119, 255, 0.1)'
        },
        {
            icon: AlertTriangle,
            label: t('dashboard.damaged') || 'Damaged (DM)',
            value: containerStats.byStatus?.DM || 0,
            color: 'var(--warning-500)',
            bg: 'rgba(250, 173, 20, 0.1)'
        },
        {
            icon: Clock,
            label: t('dashboard.awaitingRepair') || 'Awaiting Repair (AR)',
            value: containerStats.byStatus?.AR || 0,
            color: 'var(--error-500)',
            bg: 'rgba(255, 77, 79, 0.1)'
        },
        {
            icon: CheckCircle,
            label: t('dashboard.available') || 'Available (AV)',
            value: containerStats.byStatus?.AV || 0,
            color: 'var(--success-500)',
            bg: 'rgba(82, 196, 26, 0.1)'
        }
    ];

    const eorCards = [
        {
            label: t('eor.draft') || 'Draft',
            value: eorStats.draft,
            status: 'draft'
        },
        {
            label: t('eor.pending') || 'Pending',
            value: eorStats.pending,
            status: 'pending'
        },
        {
            label: t('eor.approved') || 'Approved',
            value: eorStats.approved,
            status: 'approved'
        },
        {
            label: t('dashboard.totalValue') || 'Total Value',
            value: `RM ${eorStats.totalValue.toLocaleString()}`,
            status: 'value'
        }
    ];

    const recentSurveys = surveys.slice(0, 5);
    const recentEORs = eors.slice(0, 5);

    const quickActions = [
        { icon: ClipboardList, label: t('nav.newSurvey') || 'New Survey', to: '/surveys/search', color: 'var(--primary-500)' },
        { icon: FileText, label: t('nav.eorList') || 'Create EOR', to: '/eor', color: 'var(--secondary-500)' },
        { icon: Container, label: t('nav.arContainers') || 'AR List', to: '/containers/ar', color: 'var(--warning-500)' },
        { icon: Wrench, label: t('nav.repairOrders') || 'Repairs', to: '/repair-orders', color: 'var(--success-500)' }
    ];

    return (
        <div className="dashboard">
            {/* Quick Search Bar */}
            <div className="dashboard-search-bar">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-wrapper">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder={t('dashboard.searchContainers') || 'Search containers by number, liner, or size...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <button type="submit" className="btn btn-primary btn-sm">
                            {t('common.search') || 'Search'}
                        </button>
                    </div>
                </form>
            </div>

            {/* KPI Stats Row */}
            <div className="stats-row">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="stat-card">
                            <div className="stat-card-icon" style={{ background: stat.bg }}>
                                <Icon size={24} style={{ color: stat.color }} />
                            </div>
                            <div className="stat-card-content">
                                <div className="stat-card-value">{stat.value}</div>
                                <div className="stat-card-label">{stat.label}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Workflow Progress Tracker */}
            <div className="card workflow-tracker-card">
                <div className="card-header">
                    <h3 className="card-title">
                        <TrendingUp size={18} />
                        {t('dashboard.workflowTracker') || 'Workflow Progress Tracker'}
                    </h3>
                </div>
                <div className="workflow-tracker">
                    {workflowStages.map((stage, index) => {
                        const Icon = stage.icon;
                        return (
                            <Link to={stage.path} key={stage.id} className="workflow-stage">
                                <div className="workflow-stage-icon" style={{ background: `${stage.color}15`, color: stage.color }}>
                                    <Icon size={20} />
                                </div>
                                <div className="workflow-stage-content">
                                    <div className="workflow-stage-count">{stage.count}</div>
                                    <div className="workflow-stage-label">{stage.label}</div>
                                </div>
                                {index < workflowStages.length - 1 && (
                                    <div className="workflow-connector">
                                        <ArrowRight size={14} />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Pending Actions + Recent Activity Row */}
            <div className="dashboard-grid">
                {/* Pending Actions Widget */}
                <div className="card pending-actions-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Bell size={18} />
                            {t('dashboard.pendingActions') || 'Pending Actions'}
                        </h3>
                        {pendingActions.length > 0 && (
                            <span className="pending-badge">{pendingActions.reduce((sum, a) => sum + a.count, 0)}</span>
                        )}
                    </div>
                    <div className="pending-actions-list">
                        {pendingActions.length === 0 ? (
                            <div className="empty-state">
                                <CheckCircle size={32} />
                                <p>{t('dashboard.noPendingActions') || 'No pending actions'}</p>
                            </div>
                        ) : (
                            pendingActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link to={action.path} key={action.id} className={`pending-action-item priority-${action.priority}`}>
                                        <div className="pending-action-icon">
                                            <Icon size={18} />
                                        </div>
                                        <div className="pending-action-content">
                                            <span className="pending-action-label">{action.label}</span>
                                            <span className="pending-action-count">{action.count}</span>
                                        </div>
                                        <ArrowRight size={14} className="pending-action-arrow" />
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="card activity-feed-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Activity size={18} />
                            {t('dashboard.recentActivity') || 'Recent Activity'}
                        </h3>
                    </div>
                    <div className="activity-feed">
                        {recentActivity.length === 0 ? (
                            <div className="empty-state">
                                <Activity size={32} />
                                <p>{t('dashboard.noRecentActivity') || 'No recent activity'}</p>
                            </div>
                        ) : (
                            recentActivity.map((activity, index) => {
                                const Icon = activity.icon;
                                return (
                                    <Link to={activity.path} key={index} className="activity-item">
                                        <div className={`activity-icon activity-${activity.type}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="activity-content">
                                            <span className="activity-text">{activity.text}</span>
                                            <span className="activity-time">
                                                {new Date(activity.time).toLocaleString()}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* EOR Overview + Quick Actions Row */}
            <div className="dashboard-grid">
                {/* EOR Overview */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <FileText size={18} />
                            {t('dashboard.eorOverview') || 'EOR Overview'}
                        </h3>
                        <button onClick={() => navigate('/eor')} className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                            {t('common.viewAll') || 'View All'} <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="eor-summary">
                        {eorCards.map((card, index) => (
                            <div key={index} className={`eor-stat eor-stat-${card.status}`}>
                                <div className="eor-stat-value">{card.value}</div>
                                <div className="eor-stat-label">{card.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Layers size={18} />
                            {t('dashboard.quickActions') || 'Quick Actions'}
                        </h3>
                    </div>
                    <div className="quick-actions-compact">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Link key={index} to={action.to} className="quick-action-item">
                                    <div className="quick-action-icon-sm" style={{ background: `${action.color}15`, color: action.color }}>
                                        <Icon size={18} />
                                    </div>
                                    <span>{action.label}</span>
                                    <ArrowRight size={14} className="quick-action-arrow" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Activity Row */}
            <div className="dashboard-grid">
                {/* Recent Surveys */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <ClipboardList size={18} />
                            {t('dashboard.recentSurveys') || 'Recent Surveys'}
                        </h3>
                        <Link to="/surveys" className="btn btn-ghost btn-sm">
                            {t('common.viewAll') || 'View All'} <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="recent-list">
                        {recentSurveys.length === 0 ? (
                            <div className="empty-state">
                                <ClipboardList size={32} />
                                <p>{t('dashboard.noSurveysYet') || 'No surveys yet'}</p>
                            </div>
                        ) : (
                            recentSurveys.map((survey) => (
                                <Link key={survey.id} to={`/surveys/${survey.id}`} className="recent-item">
                                    <div className="recent-item-main">
                                        <span className="container-number">{survey.containerNumber}</span>
                                        <span className={`badge badge-${survey.status.toLowerCase()}`}>
                                            {survey.status}
                                        </span>
                                    </div>
                                    <div className="recent-item-sub">
                                        {survey.id} • {new Date(survey.createdAt).toLocaleDateString()}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent EORs */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <FileText size={18} />
                            {t('dashboard.recentEORs') || 'Recent EORs'}
                        </h3>
                        <Link to="/eor" className="btn btn-ghost btn-sm">
                            {t('common.viewAll') || 'View All'} <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="recent-list">
                        {recentEORs.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={32} />
                                <p>{t('dashboard.noEORsYet') || 'No EORs yet'}</p>
                            </div>
                        ) : (
                            recentEORs.map((eor) => (
                                <Link key={eor.id} to={`/eor/${eor.id}`} className="recent-item">
                                    <div className="recent-item-main">
                                        <span className="container-number">{eor.containerNumber}</span>
                                        <span className={`badge badge-${eor.status.toLowerCase().replace('_', '-')}`}>
                                            {eor.autoApproved ? 'Auto' : eor.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="recent-item-sub">
                                        {eor.id} • RM {eor.totalCost}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
