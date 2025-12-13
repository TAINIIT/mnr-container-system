import { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import RetrieveButton from '../../components/common/RetrieveButton';
import {
    Search, Trash2, AlertTriangle, FileText, ClipboardList,
    Wrench, Truck, ClipboardCheck, Package, RefreshCw, CheckCircle
} from 'lucide-react';
import { Droplets } from 'lucide-react';

// Workflow step definitions
const WORKFLOW_STEPS = {
    survey: { label: 'Survey', icon: FileText, order: 1 },
    eor: { label: 'EOR', icon: ClipboardList, order: 2 },
    shunting: { label: 'Shunting', icon: Truck, order: 3 },
    repairOrder: { label: 'Repair Order', icon: Wrench, order: 4 },
    washing: { label: 'Washing', icon: Droplets, order: 5 },
    preinspection: { label: 'Pre-Inspection', icon: ClipboardCheck, order: 6 },
    stacking: { label: 'Stacking', icon: Package, order: 7 }
};

export default function JobMonitoring() {
    const { containers, reloadFromStorage } = useData();
    const { canPerform } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();

    const [transactionIdSearch, setTransactionIdSearch] = useState('');
    const [containerSearch, setContainerSearch] = useState('');
    const [searchMode, setSearchMode] = useState('container'); // 'transaction' or 'container'
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedContainer, setSelectedContainer] = useState(null);

    // Local state for all job data - reloaded from localStorage
    const [localSurveys, setLocalSurveys] = useState([]);
    const [localEors, setLocalEors] = useState([]);
    const [localRepairOrders, setLocalRepairOrders] = useState([]);
    const [localShunting, setLocalShunting] = useState([]);
    const [localWashing, setLocalWashing] = useState([]);
    const [localPreinspections, setLocalPreinspections] = useState([]);
    const [localStacking, setLocalStacking] = useState([]);
    const [localContainers, setLocalContainers] = useState([]);

    // Load all data from localStorage
    const loadData = useCallback(() => {
        setLocalSurveys(JSON.parse(localStorage.getItem('mnr_surveys') || '[]'));
        setLocalEors(JSON.parse(localStorage.getItem('mnr_eors') || '[]'));
        setLocalRepairOrders(JSON.parse(localStorage.getItem('mnr_repair_orders') || '[]'));
        setLocalShunting(JSON.parse(localStorage.getItem('mnr_shunting') || '[]'));
        setLocalWashing(JSON.parse(localStorage.getItem('mnr_washing') || '[]'));
        setLocalPreinspections(JSON.parse(localStorage.getItem('mnr_preinspections') || '[]'));
        setLocalStacking(JSON.parse(localStorage.getItem('mnr_stacking') || '[]'));
        setLocalContainers(JSON.parse(localStorage.getItem('mnr_containers') || '[]'));
    }, []);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Build job list for selected container
    const containerJobs = useMemo(() => {
        if (!selectedContainer) return [];

        const jobs = [];
        const containerId = selectedContainer.id;
        const containerNumber = selectedContainer.containerNumber;

        // Survey jobs - match by containerId OR containerNumber
        localSurveys.filter(s => s.containerId === containerId || s.containerNumber === containerNumber).forEach(s => {
            jobs.push({
                type: 'survey',
                id: s.id,
                transactionId: s.id, // Survey's own ID is the base Transaction ID
                status: s.status,
                createdAt: s.createdAt,
                data: s,
                description: `Survey ${s.status === 'COMPLETED' ? 'Completed' : s.status === 'DRAFT' ? 'Draft' : s.status}`
            });
        });

        // EOR jobs - match by containerId OR containerNumber
        localEors.filter(e => e.containerId === containerId || e.containerNumber === containerNumber).forEach(e => {
            jobs.push({
                type: 'eor',
                id: e.id,
                transactionId: e.surveyId || e.id, // Link to Survey's Transaction ID
                status: e.status,
                createdAt: e.createdAt,
                data: e,
                description: `EOR ${e.status.replace(/_/g, ' ')}`
            });
        });

        // Shunting jobs
        localShunting.filter(s => s.containerId === containerId || s.containerNumber === containerNumber).forEach(s => {
            jobs.push({
                type: 'shunting',
                id: s.id,
                transactionId: s.surveyId || s.id,
                status: s.status,
                createdAt: s.createdAt,
                data: s,
                description: `Shunting ${s.status === 'COMPLETED' ? 'Completed' : s.status === 'IN_PROGRESS' ? 'In Progress' : 'New'}`
            });
        });

        // Repair Order jobs - match by containerId OR containerNumber
        localRepairOrders.filter(r => r.containerId === containerId || r.containerNumber === containerNumber).forEach(r => {
            jobs.push({
                type: 'repairOrder',
                id: r.id,
                transactionId: r.surveyId || r.id,
                status: r.status,
                createdAt: r.createdAt,
                data: r,
                description: `Repair Order ${r.status.replace(/_/g, ' ')}`
            });
        });

        // Washing jobs
        localWashing.filter(w => w.containerId === containerId || w.containerNumber === containerNumber).forEach(w => {
            jobs.push({
                type: 'washing',
                id: w.id,
                transactionId: w.surveyId || w.id,
                status: w.status,
                createdAt: w.createdAt,
                data: w,
                description: `Washing ${w.status === 'COMPLETED' ? 'Completed' : w.status === 'IN_PROGRESS' ? 'In Progress' : w.status}`
            });
        });

        // Pre-Inspection jobs
        localPreinspections.filter(p => p.containerId === containerId || p.containerNumber === containerNumber).forEach(p => {
            jobs.push({
                type: 'preinspection',
                id: p.id,
                transactionId: p.surveyId || p.id,
                status: p.status,
                createdAt: p.createdAt,
                data: p,
                description: `Pre-Inspection ${p.result ? `(${p.result})` : p.status}`
            });
        });

        // Stacking jobs
        localStacking.filter(s => s.containerId === containerId || s.containerNumber === containerNumber).forEach(s => {
            jobs.push({
                type: 'stacking',
                id: s.id,
                transactionId: s.surveyId || s.id,
                status: s.status,
                createdAt: s.createdAt,
                data: s,
                description: `Stacking ${s.status === 'COMPLETED' ? 'Completed' : s.status}`
            });
        });

        // Sort by creation time (newest first)
        return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [selectedContainer, localSurveys, localEors, localRepairOrders, localShunting, localWashing, localPreinspections, localStacking]);

    // Search by Transaction ID - shows only jobs for that exact transaction
    const transactionSearchResults = useMemo(() => {
        if (!transactionIdSearch || transactionIdSearch.length < 3) return [];
        const term = transactionIdSearch.toLowerCase();

        // Collect all matching transactions
        const transactions = [];

        localSurveys.filter(s => s.id?.toLowerCase().includes(term)).forEach(s => {
            transactions.push({
                transactionId: s.id,
                containerNumber: s.containerNumber,
                containerId: s.containerId,
                type: 'Survey'
            });
        });

        // Also check other entities for surveyId
        localEors.filter(e => e.surveyId?.toLowerCase().includes(term) || e.id?.toLowerCase().includes(term)).forEach(e => {
            const tid = e.surveyId || e.id;
            if (!transactions.some(t => t.transactionId === tid)) {
                transactions.push({
                    transactionId: tid,
                    containerNumber: e.containerNumber,
                    containerId: e.containerId,
                    type: 'EOR'
                });
            }
        });

        return transactions.slice(0, 10);
    }, [transactionIdSearch, localSurveys, localEors]);

    // Search by Container Number - shows all transaction IDs for that container
    const containerSearchResults = useMemo(() => {
        if (!containerSearch || containerSearch.length < 3) return [];
        const term = containerSearch.toLowerCase();

        const matchingContainers = localContainers.filter(c =>
            c.containerNumber.toLowerCase().includes(term)
        );

        // For each container, find all its transactions
        return matchingContainers.map(c => {
            const containerTransactions = localSurveys
                .filter(s => s.containerId === c.id || s.containerNumber === c.containerNumber)
                .map(s => s.id);

            return {
                ...c,
                transactions: containerTransactions
            };
        }).slice(0, 10);
    }, [containerSearch, localContainers, localSurveys]);

    // Handle transaction selection
    const selectTransaction = (transactionId, containerId, containerNumber) => {
        setSelectedTransaction(transactionId);
        const container = localContainers.find(c => c.id === containerId || c.containerNumber === containerNumber);
        if (container) {
            setSelectedContainer(container);
        }
    };

    // Calculate container status based on remaining jobs
    const calculateStatusFromJobs = (remainingJobs) => {
        if (remainingJobs.length === 0) return 'STACKING';

        const stackingCompleted = remainingJobs.some(j => j.type === 'stacking' && j.status === 'COMPLETED');
        if (stackingCompleted) return 'AV';

        const stackingExists = remainingJobs.some(j => j.type === 'stacking');
        if (stackingExists) return 'COMPLETED';

        const preinspectionAccepted = remainingJobs.some(j => j.type === 'preinspection' && j.data?.result === 'ACCEPTED');
        if (preinspectionAccepted) return 'COMPLETED';

        const preinspectionExists = remainingJobs.some(j => j.type === 'preinspection');
        if (preinspectionExists) return 'REPAIR';

        const roExists = remainingJobs.some(j => j.type === 'repairOrder');
        if (roExists) return 'REPAIR';

        const shuntingCompleted = remainingJobs.some(j => j.type === 'shunting' && j.status === 'COMPLETED');
        if (shuntingCompleted) return 'AR';

        const eorApproved = remainingJobs.some(j => j.type === 'eor' && (j.status === 'APPROVED' || j.status === 'APPROVED_AUTO'));
        if (eorApproved) return 'AR';

        const eorExists = remainingJobs.some(j => j.type === 'eor');
        if (eorExists) return 'DM';

        const surveyExists = remainingJobs.some(j => j.type === 'survey');
        if (surveyExists) return 'DM';

        return 'STACKING';
    };

    // Delete a single specific job - NO PAGE RELOAD
    const deleteSpecificJob = (job) => {
        if (!canPerform('delete_job')) {
            toast.error('You do not have permission to delete jobs');
            return;
        }

        const containerId = selectedContainer.id;

        // Delete from appropriate storage and update local state
        switch (job.type) {
            case 'survey': {
                const updated = localSurveys.filter(s => s.id !== job.id);
                localStorage.setItem('mnr_surveys', JSON.stringify(updated));
                setLocalSurveys(updated);
                break;
            }
            case 'eor': {
                const updated = localEors.filter(e => e.id !== job.id);
                localStorage.setItem('mnr_eors', JSON.stringify(updated));
                setLocalEors(updated);
                break;
            }
            case 'shunting': {
                const updated = localShunting.filter(s => s.id !== job.id);
                localStorage.setItem('mnr_shunting', JSON.stringify(updated));
                setLocalShunting(updated);
                break;
            }
            case 'repairOrder': {
                const updated = localRepairOrders.filter(r => r.id !== job.id);
                localStorage.setItem('mnr_repair_orders', JSON.stringify(updated));
                setLocalRepairOrders(updated);
                break;
            }
            case 'washing': {
                const updated = localWashing.filter(w => w.id !== job.id);
                localStorage.setItem('mnr_washing', JSON.stringify(updated));
                setLocalWashing(updated);
                break;
            }
            case 'preinspection': {
                const updated = localPreinspections.filter(p => p.id !== job.id);
                localStorage.setItem('mnr_preinspections', JSON.stringify(updated));
                setLocalPreinspections(updated);
                break;
            }
            case 'stacking': {
                const updated = localStacking.filter(s => s.id !== job.id);
                localStorage.setItem('mnr_stacking', JSON.stringify(updated));
                setLocalStacking(updated);
                break;
            }
        }

        // Calculate remaining jobs (without the deleted one)
        const remainingJobs = containerJobs.filter(j => j.id !== job.id);
        const newStatus = calculateStatusFromJobs(remainingJobs);

        // Update container status in localStorage and local state
        const updatedContainers = localContainers.map(c => {
            if (c.id === containerId) {
                return { ...c, status: newStatus };
            }
            return c;
        });
        localStorage.setItem('mnr_containers', JSON.stringify(updatedContainers));
        setLocalContainers(updatedContainers);

        // Update selected container's status for UI
        setSelectedContainer(prev => prev ? { ...prev, status: newStatus } : null);

        toast.success(`Deleted ${job.description}. Container status: ${newStatus}. ${remainingJobs.length} job(s) remaining.`);

        // Sync DataContext React state with localStorage changes
        // This ensures Workflow Guide and other screens see the updated data
        reloadFromStorage();
    };

    const getStepIcon = (type) => {
        const step = WORKFLOW_STEPS[type];
        return step ? step.icon : FileText;
    };

    const getStatusBadgeClass = (status) => {
        if (!status) return 'badge';
        const lower = status.toLowerCase();
        if (lower.includes('completed') || lower.includes('approved') || lower.includes('accepted')) return 'badge badge-completed';
        if (lower.includes('progress') || lower.includes('new') || lower.includes('draft')) return 'badge badge-draft';
        if (lower.includes('reject') || lower.includes('rework')) return 'badge badge-rejected';
        return 'badge';
    };

    // Determine if a job can be deleted (only the latest workflow step can be deleted)
    const canDeleteJob = (job) => {
        if (containerJobs.length === 0) return false;

        // Get the highest workflow order among all jobs
        const maxOrder = Math.max(...containerJobs.map(j => WORKFLOW_STEPS[j.type]?.order || 0));
        const jobOrder = WORKFLOW_STEPS[job.type]?.order || 0;

        // Can only delete jobs at the highest workflow step
        return jobOrder === maxOrder;
    };

    // Get the name of the blocking job (the latest step that must be deleted first)
    const getBlockingJobType = (job) => {
        const maxOrder = Math.max(...containerJobs.map(j => WORKFLOW_STEPS[j.type]?.order || 0));
        const blockingJob = containerJobs.find(j => WORKFLOW_STEPS[j.type]?.order === maxOrder);
        return blockingJob ? WORKFLOW_STEPS[blockingJob.type]?.label : '';
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2>Job Monitoring</h2>
                    <p>Search by Transaction ID or Container Number to view and delete individual jobs</p>
                </div>
                <RetrieveButton screenId="job_monitoring" />
            </div>

            <div className="card">
                <div className="form-group">
                    <label>Search by Transaction ID</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Transaction ID (min 3 chars)..."
                            value={transactionIdSearch}
                            onChange={(e) => setTransactionIdSearch(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                        />
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                            }}
                        />
                    </div>
                </div>

                {/* Transaction ID Search Results */}
                {transactionSearchResults.length > 0 && !selectedContainer && (
                    <div className="mt-4">
                        <h4>Transaction Search Results</h4>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Container Number</th>
                                        <th>Source</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionSearchResults.map(t => (
                                        <tr key={t.transactionId}>
                                            <td><span style={{ fontWeight: 500 }}>{t.transactionId}</span></td>
                                            <td><span className="container-number">{t.containerNumber}</span></td>
                                            <td><span className="badge badge-draft">{t.type}</span></td>
                                            <td>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => selectTransaction(t.transactionId, t.containerId, t.containerNumber)}
                                                >
                                                    View Jobs
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Container Number Search */}
            <div className="card mt-4">
                <div className="form-group">
                    <label>Search by Container Number</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Container Number (min 3 chars)..."
                            value={containerSearch}
                            onChange={(e) => setContainerSearch(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                        />
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--neutral-400)'
                            }}
                        />
                    </div>
                </div>

                {/* Container Search Results */}
                {containerSearchResults.length > 0 && !selectedContainer && (
                    <div className="mt-4">
                        <h4>Container Search Results</h4>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Container Number</th>
                                        <th>Liner</th>
                                        <th>Current Status</th>
                                        <th>Transaction IDs</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {containerSearchResults.map(c => (
                                        <tr key={c.id}>
                                            <td><span className="container-number">{c.containerNumber}</span></td>
                                            <td>{c.liner}</td>
                                            <td>
                                                <span className={`badge badge-${c.status?.toLowerCase()}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td>
                                                {c.transactions.length > 0 ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {c.transactions.map(tid => (
                                                            <span
                                                                key={tid}
                                                                className="badge badge-draft"
                                                                style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                                                                onClick={() => selectTransaction(tid, c.id, c.containerNumber)}
                                                            >
                                                                {tid}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">No transactions</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => setSelectedContainer(c)}
                                                >
                                                    View All Jobs
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {selectedContainer && (
                    <div className="mt-4">
                        {/* Container Status Header */}
                        <div style={{
                            padding: '1rem',
                            background: 'var(--neutral-800)',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="container-number">{selectedContainer.containerNumber}</span>
                                        <span className={`badge badge-${selectedContainer.status?.toLowerCase()}`} style={{ fontSize: '0.9rem' }}>
                                            {selectedContainer.status}
                                        </span>
                                    </h3>
                                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--neutral-400)' }}>
                                        Liner: {selectedContainer.liner} | Size: {selectedContainer.size}
                                    </p>
                                </div>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setSelectedContainer(null)}
                                >
                                    <RefreshCw size={16} /> Clear Selection
                                </button>
                            </div>
                        </div>

                        {/* Workflow Progress Indicator */}
                        <div style={{
                            display: 'flex',
                            gap: '0.25rem',
                            marginBottom: '1rem',
                            flexWrap: 'wrap'
                        }}>
                            {Object.entries(WORKFLOW_STEPS).map(([key, step]) => {
                                const hasJob = containerJobs.some(j => j.type === key);
                                const isCompleted = containerJobs.some(j =>
                                    j.type === key &&
                                    (j.status === 'COMPLETED' || j.status === 'APPROVED' || j.status === 'APPROVED_AUTO')
                                );
                                const Icon = step.icon;
                                return (
                                    <div
                                        key={key}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: hasJob
                                                ? (isCompleted ? 'var(--success-500)' : 'var(--primary-500)')
                                                : 'var(--neutral-700)',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            opacity: hasJob ? 1 : 0.5
                                        }}
                                    >
                                        <Icon size={16} />
                                        <span style={{ fontSize: '0.85rem' }}>{step.label}</span>
                                        {isCompleted && <CheckCircle size={14} />}
                                    </div>
                                );
                            })}
                        </div>

                        <h4>Job History ({containerJobs.length} jobs)</h4>

                        {containerJobs.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={48} />
                                <h3>No jobs found</h3>
                                <p>This container has no workflow jobs. All jobs have been deleted.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Transaction ID</th>
                                            <th>Description</th>
                                            <th>Status</th>
                                            <th>Created At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {containerJobs.map((job) => {
                                            const Icon = getStepIcon(job.type);
                                            return (
                                                <tr key={`${job.type}-${job.id}`}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Icon size={16} />
                                                            {WORKFLOW_STEPS[job.type]?.label}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{job.id}</td>
                                                    <td>{job.description}</td>
                                                    <td>
                                                        <span className={getStatusBadgeClass(job.status)}>
                                                            {job.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>
                                                        {job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'}
                                                    </td>
                                                    <td>
                                                        {canPerform('delete_job') && (
                                                            canDeleteJob(job) ? (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => deleteSpecificJob(job)}
                                                                    title={`Delete this ${WORKFLOW_STEPS[job.type]?.label} job`}
                                                                >
                                                                    <Trash2 size={14} /> Delete
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-ghost btn-sm"
                                                                    disabled
                                                                    title={`Delete ${getBlockingJobType(job)} first`}
                                                                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                                                >
                                                                    <Trash2 size={14} /> Blocked
                                                                </button>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-4" style={{
                            padding: '1rem',
                            background: 'var(--primary-900)',
                            borderRadius: '8px',
                            border: '1px solid var(--primary-500)'
                        }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <AlertTriangle size={18} color="var(--warning-500)" />
                                <strong>Delete Note:</strong>
                            </div>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                                Jobs must be deleted in reverse workflow order. You can only delete the
                                <strong> latest workflow step</strong> first (e.g., delete Repair Order before Shunting,
                                delete Shunting before EOR, delete EOR before Survey).
                                "Blocked" jobs require you to delete the later steps first.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
