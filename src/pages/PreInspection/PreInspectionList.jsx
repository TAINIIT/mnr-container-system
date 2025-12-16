import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import RetrieveButton from '../../components/common/RetrieveButton';
import { ClipboardCheck, Plus, Calendar, CheckCircle, XCircle, AlertTriangle, Search, ChevronLeft, ChevronRight, Camera, RotateCcw, ListChecks, Droplets, RefreshCw, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { LINERS } from '../../data/masterCodes';

export default function PreInspectionList() {
    const { containers, repairOrders, surveys, updateContainer, updateRepairOrder } = useData();
    const { user } = useAuth();
    const { getCodeList } = useConfig();
    const { t } = useLanguage();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const workflowFilter = searchParams.get('workflow_filter');

    // Get configurable inspection checklist from admin settings
    const INSPECTION_CHECKLIST = getCodeList('INSPECTION_CHECKLIST');

    const [inspections, setInspections] = useState(() => {
        const saved = localStorage.getItem('mnr_preinspections');
        return saved ? JSON.parse(saved) : [];
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [scheduledDate, setScheduledDate] = useState('');
    const [inspectorNote, setInspectorNote] = useState('');

    // Search and filter state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [linerFilter, setLinerFilter] = useState('');
    const [resultFilter, setResultFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Collapsible filters - auto-collapse on mobile
    const [filtersVisible, setFiltersVisible] = useState(() => window.innerWidth > 768);

    // Collapsible stats - hidden by default on tablet/mobile (<=1024px)
    const [statsVisible, setStatsVisible] = useState(() => window.innerWidth > 1024);

    // Inspection modal with checklist
    const [showInspectionModal, setShowInspectionModal] = useState(false);
    const [inspectingRecord, setInspectingRecord] = useState(null);
    const [checklistResults, setChecklistResults] = useState({});
    const [inspectionNotes, setInspectionNotes] = useState('');
    const [inspectionPhotos, setInspectionPhotos] = useState([]);

    // NEW: Damage items from survey for verification
    const [surveyDamageItems, setSurveyDamageItems] = useState([]);
    const [damageItemResults, setDamageItemResults] = useState({});

    // Containers ready for pre-inspection (repair completed)
    // Excludes containers that already have an active (non-rework) inspection scheduled
    const completedContainers = containers.filter(c =>
        c.status === 'COMPLETED' &&
        !inspections.some(i => i.containerId === c.id &&
            (i.status === 'PLANNED' || i.status === 'CONFIRMED' || i.status === 'IN_PROGRESS'))
    );

    // Inspections waiting for re-inspection after rework (repair completed again)
    const reworkReadyInspections = inspections.filter(i => {
        const container = containers.find(c => c.id === i.containerId);
        return i.status === 'PENDING_REWORK' && container?.status === 'COMPLETED';
    });

    // Filter inspections
    const filteredInspections = inspections.filter(ins => {
        // Special workflow filter from Dashboard - show pending result only
        if (workflowFilter === 'pending') {
            if (ins.result !== 'PENDING') {
                return false;
            }
        }

        const matchesSearch = !search ||
            ins.containerNumber.toLowerCase().includes(search.toLowerCase()) ||
            ins.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || ins.status === statusFilter;
        const matchesLiner = !linerFilter || ins.liner === linerFilter;
        const matchesResult = !resultFilter || ins.result === resultFilter;
        return matchesSearch && matchesStatus && matchesLiner && matchesResult;
    });

    // Pagination
    const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
    const paginatedInspections = filteredInspections.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Rework tracking statistics
    const reworkStats = {
        totalReworks: inspections.filter(i => i.result === 'REWORK').length,
        reworkByReason: INSPECTION_CHECKLIST.reduce((acc, item) => {
            acc[item.id] = inspections.filter(i =>
                i.failedChecks?.includes(item.id)
            ).length;
            return acc;
        }, {})
    };

    const saveInspections = (data) => {
        setInspections(data);
        localStorage.setItem('mnr_preinspections', JSON.stringify(data));
    };

    const createInspection = () => {
        if (!selectedContainer || !scheduledDate) {
            toast.error('Please select container and scheduled date');
            return;
        }

        const containerSurvey = surveys.find(s => s.containerId === selectedContainer.id && s.status === 'COMPLETED');
        const surveyTransactionId = containerSurvey?.id || selectedContainer.lastSurveyId || null;

        const inspection = {
            id: `${selectedContainer.containerNumber}-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(2, 14)}`,
            containerId: selectedContainer.id,
            containerNumber: selectedContainer.containerNumber,
            surveyTransactionId,
            liner: selectedContainer.liner,
            scheduledDate,
            status: 'PLANNED',
            notes: inspectorNote,
            createdBy: user.username,
            createdAt: new Date().toISOString(),
            reworkCount: containers.find(c => c.id === selectedContainer.id)?.reworkCount || 0
        };

        saveInspections([inspection, ...inspections]);
        toast.success('Pre-inspection scheduled!');
        setShowModal(false);
        setSelectedContainer(null);
        setScheduledDate('');
        setInspectorNote('');
    };

    // Start inspection with checklist
    const startInspection = (inspection) => {
        setInspectingRecord(inspection);
        setChecklistResults(
            INSPECTION_CHECKLIST.reduce((acc, item) => ({ ...acc, [item.id]: null }), {})
        );
        setInspectionNotes('');
        setInspectionPhotos([]);

        // NEW: Find related survey and extract damage items
        const relatedSurvey = surveys.find(s =>
            s.id === inspection.surveyTransactionId ||
            s.containerId === inspection.containerId
        );

        if (relatedSurvey && relatedSurvey.damageItems && relatedSurvey.damageItems.length > 0) {
            setSurveyDamageItems(relatedSurvey.damageItems);
            // Initialize damage item results - all unchecked
            const damageResults = relatedSurvey.damageItems.reduce((acc, item, index) => ({
                ...acc,
                [`damage_${index}`]: null
            }), {});
            setDamageItemResults(damageResults);
        } else {
            setSurveyDamageItems([]);
            setDamageItemResults({});
        }

        setShowInspectionModal(true);
    };

    // Handle checklist item toggle
    const toggleChecklistItem = (itemId, value) => {
        setChecklistResults(prev => ({
            ...prev,
            [itemId]: value
        }));
    };

    // NEW: Handle damage item toggle
    const toggleDamageItem = (itemId, value) => {
        setDamageItemResults(prev => ({
            ...prev,
            [itemId]: value
        }));
    };

    // Complete inspection with checklist results
    const completeInspection = () => {
        // Failed items from general checklist (now optional)
        const failedChecks = Object.entries(checklistResults)
            .filter(([, value]) => value === false)
            .map(([key]) => key);

        // Failed items from damage verification (REQUIRED)
        const failedDamageItems = Object.entries(damageItemResults)
            .filter(([, value]) => value === false)
            .map(([key]) => {
                const index = parseInt(key.replace('damage_', ''));
                return surveyDamageItems[index];
            });

        // Only damage items verification is required for pass
        // General checklist and Post-Repair Cleaning are OPTIONAL
        const allDamageItemsPassed = surveyDamageItems.length === 0 ||
            (Object.values(damageItemResults).every(v => v === true) && failedDamageItems.length === 0);

        // Accept if all damage items passed (checklist items are optional)
        const result = allDamageItemsPassed ? 'ACCEPTED' : 'REWORK';

        const updated = inspections.map(i => {
            if (i.id === inspectingRecord.id) {
                // If REWORK, keep as PENDING_REWORK so same record can be used after repair
                const newStatus = result === 'ACCEPTED' ? 'COMPLETED' : 'PENDING_REWORK';
                return {
                    ...i,
                    status: newStatus,
                    result,
                    checklistResults,
                    failedChecks,
                    // NEW: Store damage verification results
                    damageItemResults,
                    failedDamageItems: failedDamageItems.map(d => ({
                        location: d.location,
                        component: d.component,
                        damageType: d.damageType
                    })),
                    inspectionNotes,
                    photos: inspectionPhotos,
                    lastInspectedAt: new Date().toISOString(),
                    lastInspectedBy: user.username,
                    ...(result === 'ACCEPTED' ? {
                        completedAt: new Date().toISOString(),
                        completedBy: user.username
                    } : {})
                };
            }
            return i;
        });
        saveInspections(updated);

        // Update container status based on result
        if (result === 'ACCEPTED') {
            updateContainer(inspectingRecord.containerId, {
                status: 'AV',
                qcPassedAt: new Date().toISOString(),
                qcPassedBy: user.username
            }, user.id);
            toast.success('Container accepted! Status changed to Available (AV).');
        } else {
            // Increment rework count
            const currentReworkCount = (containers.find(c => c.id === inspectingRecord.containerId)?.reworkCount || 0) + 1;

            updateContainer(inspectingRecord.containerId, {
                status: 'REPAIR',
                reworkRequired: true,
                reworkCount: currentReworkCount,
                reworkNotes: inspectionNotes,
                failedChecks,
                reworkRequestedAt: new Date().toISOString(),
                reworkRequestedBy: user.username
            }, user.id);

            const containerRO = repairOrders.find(ro =>
                ro.containerId === inspectingRecord.containerId &&
                (ro.status === 'COMPLETED' || ro.status === 'QC_PENDING')
            );
            if (containerRO && updateRepairOrder) {
                updateRepairOrder(containerRO.id, {
                    status: 'IN_PROGRESS',
                    reworkRequired: true,
                    reworkCount: currentReworkCount,
                    reworkNotes: inspectionNotes,
                    failedChecks,
                    reworkRequestedAt: new Date().toISOString(),
                    reworkRequestedBy: user.username
                });
            }
            toast.warning(`Rework required (Attempt #${currentReworkCount}). Failed: ${failedChecks.map(id =>
                INSPECTION_CHECKLIST.find(c => c.id === id)?.label
            ).join(', ')}`);
        }

        setShowInspectionModal(false);
        setInspectingRecord(null);
    };

    // Legacy quick result recording
    const recordResult = (id, result, reworkNotes = '') => {
        const inspection = inspections.find(i => i.id === id);

        const updated = inspections.map(i => {
            if (i.id === id) {
                // If REWORK, set PENDING_REWORK so same record is used after repair
                const newStatus = result === 'ACCEPTED' ? 'COMPLETED' : 'PENDING_REWORK';
                return {
                    ...i,
                    status: newStatus,
                    result,
                    reworkNotes,
                    lastInspectedAt: new Date().toISOString(),
                    lastInspectedBy: user.username,
                    ...(result === 'ACCEPTED' ? {
                        completedAt: new Date().toISOString(),
                        completedBy: user.username
                    } : {})
                };
            }
            return i;
        });
        saveInspections(updated);

        if (result === 'ACCEPTED') {
            updateContainer(inspection.containerId, {
                status: 'AV',
                qcPassedAt: new Date().toISOString(),
                qcPassedBy: user.username
            }, user.id);
            toast.success('Container accepted! Status changed to Available (AV).');
        } else if (result === 'REWORK') {
            const currentReworkCount = (containers.find(c => c.id === inspection.containerId)?.reworkCount || 0) + 1;

            updateContainer(inspection.containerId, {
                status: 'REPAIR',
                reworkRequired: true,
                reworkCount: currentReworkCount,
                reworkNotes: reworkNotes,
                reworkRequestedAt: new Date().toISOString(),
                reworkRequestedBy: user.username
            }, user.id);

            const containerRO = repairOrders.find(ro =>
                ro.containerId === inspection.containerId &&
                (ro.status === 'COMPLETED' || ro.status === 'QC_PENDING')
            );
            if (containerRO && updateRepairOrder) {
                updateRepairOrder(containerRO.id, {
                    status: 'IN_PROGRESS',
                    reworkRequired: true,
                    reworkCount: currentReworkCount,
                    reworkNotes: reworkNotes,
                    reworkRequestedAt: new Date().toISOString(),
                    reworkRequestedBy: user.username
                });
                toast.warning(`Rework required (Attempt #${currentReworkCount}). Repair Order reactivated.`);
            } else {
                toast.warning(`Rework required (Attempt #${currentReworkCount}). Container status changed to REPAIR.`);
            }
        }
    };

    const [resultModal, setResultModal] = useState(null);
    const [reworkNotes, setReworkNotes] = useState('');

    const pendingInspections = inspections.filter(i => i.status === 'PLANNED' || i.status === 'IN_PROGRESS');
    const todayInspections = inspections.filter(i => {
        if (i.status === 'COMPLETED') return false;
        const scheduled = new Date(i.scheduledDate).toDateString();
        return scheduled === new Date().toDateString();
    });

    // Sync repair status - fix containers with completed ROs but wrong status
    const syncRepairStatus = () => {
        // Find containers that have completed repair orders but status is not COMPLETED
        const containersToFix = containers.filter(c => {
            const hasCompletedRO = repairOrders.some(ro =>
                ro.containerId === c.id && ro.status === 'COMPLETED'
            );
            return hasCompletedRO && c.status !== 'COMPLETED' && c.status !== 'AV';
        });

        if (containersToFix.length === 0) {
            toast.info('All container statuses are already synced.');
            return;
        }

        // Update each container
        containersToFix.forEach(c => {
            updateContainer(c.id, {
                status: 'COMPLETED',
                repairEndTime: new Date().toISOString(),
                syncedAt: new Date().toISOString()
            }, user?.id);
        });

        toast.success(`Synced ${containersToFix.length} container(s) to COMPLETED status.`);
    };

    return (
        <div className="page-list-layout">
            {/* Fixed Header Area */}
            <div className="page-list-header">
                <div className="page-header">
                    <div>
                        <h2>{t('inspection.title')}</h2>
                        <p className="text-muted">{t('inspection.schedule')}</p>
                    </div>
                    <div className="flex gap-2">
                        <RetrieveButton screenId="pre_inspection" />
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={syncRepairStatus}
                            title="Sync container status from completed repair orders"
                        >
                            <RefreshCw size={16} /> Sync Status
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> {t('inspection.schedule')}
                        </button>
                    </div>
                </div>

                {/* Stats Toggle Button - visible on tablet/mobile */}
                <button
                    className="stats-toggle-btn"
                    onClick={() => setStatsVisible(!statsVisible)}
                >
                    <span>{t('common.stats') || 'Stats'}</span>
                    {statsVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {/* Stats - Collapsible */}
                <div className={`compact-stats-wrapper ${!statsVisible ? 'collapsed' : ''}`}>
                    <div className="grid grid-cols-5 mb-4">
                        <div className="stat-card">
                            <div className="stat-card-value">{inspections.length}</div>
                            <div className="stat-card-label">{t('inspection.total') || 'Total Inspections'}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-value" style={{ color: 'var(--primary-500)' }}>
                                {todayInspections.length}
                            </div>
                            <div className="stat-card-label">{t('inspection.today') || "Today's"}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-value" style={{ color: 'var(--success-500)' }}>
                                {inspections.filter(i => i.result === 'ACCEPTED').length}
                            </div>
                            <div className="stat-card-label">{t('inspection.accepted') || 'Accepted'}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-value" style={{ color: 'var(--warning-500)' }}>
                                {reworkStats.totalReworks}
                            </div>
                            <div className="stat-card-label">{t('inspection.reworkRequired') || 'Rework Required'}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-value" style={{ color: 'var(--error-500)' }}>
                                {containers.filter(c => (c.reworkCount || 0) > 1).length}
                            </div>
                            <div className="stat-card-label">{t('inspection.multipleReworks') || 'Multiple Reworks'}</div>
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
                            style={{ width: 130 }}
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">{t('common.allStatuses') || 'All Statuses'}</option>
                            <option value="PLANNED">{t('inspection.planned') || 'Planned'}</option>
                            <option value="COMPLETED">{t('inspection.completed') || 'Completed'}</option>
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 130 }}
                            value={resultFilter}
                            onChange={(e) => { setResultFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">{t('inspection.allResults') || 'All Results'}</option>
                            <option value="ACCEPTED">{t('inspection.accepted') || 'Accepted'}</option>
                            <option value="REWORK">{t('inspection.rework') || 'Rework'}</option>
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 120 }}
                            value={linerFilter}
                            onChange={(e) => { setLinerFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">{t('common.allLiners') || 'All Liners'}</option>
                            {LINERS.map((liner) => (
                                <option key={liner.code} value={liner.code}>{liner.code}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="page-list-content">
                {/* Rework Analysis */}
                {reworkStats.totalReworks > 0 && (
                    <div className="card mb-4 rework-analysis">
                        <h3 className="card-title mb-4">
                            <RotateCcw size={18} /> {t('inspection.reworkAnalysis') || 'Rework Analysis by Category'}
                        </h3>
                        <div className="rework-bars">
                            {INSPECTION_CHECKLIST.filter(item => reworkStats.reworkByReason[item.id] > 0)
                                .sort((a, b) => reworkStats.reworkByReason[b.id] - reworkStats.reworkByReason[a.id])
                                .map(item => (
                                    <div key={item.id} className="rework-bar-item">
                                        <span className="rework-bar-label">{item.label}</span>
                                        <div className="rework-bar">
                                            <div
                                                className="rework-bar-fill"
                                                style={{
                                                    width: `${Math.min(100, (reworkStats.reworkByReason[item.id] / reworkStats.totalReworks) * 100)}%`
                                                }}
                                            />
                                        </div>
                                        <span className="rework-bar-count">{reworkStats.reworkByReason[item.id]}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {filteredInspections.length === 0 ? (
                    <div className="empty-state">
                        <ClipboardCheck size={48} />
                        <h3>{t('inspection.noInspectionsFound') || 'No inspections scheduled'}</h3>
                        <p>{t('inspection.scheduleInspection') || 'Schedule a pre-inspection for completed repairs'}</p>
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
                                    <th>{t('inspection.scheduledDate')}</th>
                                    <th>{t('inspection.reworkCount') || 'Rework #'}</th>
                                    <th>{t('columns.inspectionStatus')}</th>
                                    <th>{t('columns.result')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedInspections.map((ins) => (
                                    <tr key={ins.id}>
                                        <td>
                                            {/* Show actions if:
                                                1. Status is not COMPLETED and not ACCEPTED (normal flow), OR
                                                2. Result is REWORK (can always re-inspect after rework)
                                            */}
                                            {(() => {
                                                const canReInspect = ins.status !== 'COMPLETED' ||
                                                    ins.status === 'PENDING_REWORK' ||
                                                    ins.result === 'REWORK'; // Allow re-inspect for any REWORK result

                                                return canReInspect ? (
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => startInspection(ins)}
                                                            title={ins.result === 'REWORK' ? 'Re-Inspect after rework' : 'Start Full Inspection'}
                                                        >
                                                            <ListChecks size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => recordResult(ins.id, 'ACCEPTED')}
                                                            title={t('inspection.quickAccept') || 'Quick Accept'}
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => setResultModal(ins)}
                                                            title={t('inspection.quickRework') || 'Quick Rework'}
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    ins.failedChecks?.length > 0 && (
                                                        <span className="failed-checks-tooltip" title={ins.failedChecks.map(id =>
                                                            INSPECTION_CHECKLIST.find(c => c.id === id)?.label
                                                        ).join(', ')}>
                                                            {ins.failedChecks.length} {t('inspection.itemsFailed') || 'items failed'}
                                                        </span>
                                                    )
                                                );
                                            })()}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{ins.surveyTransactionId || ins.id}</td>
                                        <td><span className="container-number">{ins.containerNumber}</span></td>
                                        <td>{ins.liner}</td>
                                        <td>{new Date(ins.scheduledDate).toLocaleDateString()}</td>
                                        <td>
                                            {(ins.reworkCount || 0) > 0 ? (
                                                <span className={`badge ${ins.reworkCount > 1 ? 'badge-dm' : 'badge-ar'}`}>
                                                    #{ins.reworkCount}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${ins.status.toLowerCase()}`}>
                                                {ins.status}
                                            </span>
                                        </td>
                                        <td>
                                            {ins.result ? (
                                                <span className={`badge ${ins.result === 'ACCEPTED' ? 'badge-av' : 'badge-dm'}`}>
                                                    {ins.result}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
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

            {/* Schedule Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('inspection.scheduleInspection') || 'Schedule Pre-Inspection'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">{t('common.container') || 'Container'}</label>
                                <select
                                    className="form-input"
                                    value={selectedContainer?.id || ''}
                                    onChange={(e) => setSelectedContainer(containers.find(c => c.id === e.target.value))}
                                >
                                    <option value="">{t('common.selectContainer') || 'Select container...'}</option>
                                    {completedContainers.map(c => (
                                        <option key={c.id} value={c.id}>{c.containerNumber}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">{t('inspection.scheduledDate') || 'Scheduled Date'}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('common.notes') || 'Notes'}</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={inspectorNote}
                                    onChange={(e) => setInspectorNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button className="btn btn-primary" onClick={createInspection}>
                                <Calendar size={16} /> {t('inspection.schedule') || 'Schedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspection Checklist Modal */}
            {showInspectionModal && inspectingRecord && (
                <div className="modal-overlay" onClick={() => setShowInspectionModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <ListChecks size={20} /> {t('inspection.inspectionChecklist') || 'QC Inspection'}
                            </h3>
                            <div className="modal-container-info">
                                <span className="container-number">{inspectingRecord.containerNumber}</span>
                                <span className="text-muted">{inspectingRecord.liner}</span>
                            </div>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

                            {/* SECTION 1: Damage Items Verification (from Survey) */}
                            {surveyDamageItems.length > 0 && (
                                <div className="inspection-section">
                                    <h4 className="inspection-section-title" style={{
                                        color: 'var(--warning-600)',
                                        borderBottom: '2px solid var(--warning-200)',
                                        paddingBottom: '8px',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <AlertTriangle size={18} />
                                        {t('inspection.damageVerification') || 'Repair Items Verification'} ({surveyDamageItems.length})
                                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--error-500)', fontWeight: 600 }}>
                                            * Required
                                        </span>
                                    </h4>
                                    <p className="text-muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
                                        {t('inspection.damageVerificationDesc') || 'Verify that each repair item has been properly completed.'}
                                    </p>
                                    <div className="repair-tasks-detailed">
                                        {surveyDamageItems.map((item, index) => (
                                            <div key={`damage_${index}`} style={{
                                                background: damageItemResults[`damage_${index}`] === true ? 'var(--success-50)' :
                                                    damageItemResults[`damage_${index}`] === false ? 'var(--error-50)' : 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: 'var(--space-3)',
                                                marginBottom: 'var(--space-2)',
                                                borderLeft: `3px solid ${damageItemResults[`damage_${index}`] === true ? 'var(--success-500)' :
                                                    damageItemResults[`damage_${index}`] === false ? 'var(--error-500)' : 'var(--primary-500)'}`
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                        <span style={{
                                                            background: 'var(--warning-500)',
                                                            color: 'white',
                                                            borderRadius: 'var(--radius-sm)',
                                                            padding: '2px 8px',
                                                            fontSize: 'var(--font-size-xs)',
                                                            fontWeight: 600
                                                        }}>#{index + 1}</span>
                                                        <span style={{ fontWeight: 600 }}>{item.location}</span>
                                                        <span className="badge badge-draft" style={{ fontSize: '10px' }}>{item.repairCode || item.repairMethod || 'Repair'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                        <button
                                                            className={`btn btn-sm ${damageItemResults[`damage_${index}`] === true ? 'btn-success' : 'btn-ghost'}`}
                                                            onClick={() => toggleDamageItem(`damage_${index}`, true)}
                                                        >
                                                            <CheckCircle size={14} /> Passed
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm ${damageItemResults[`damage_${index}`] === false ? 'btn-danger' : 'btn-ghost'}`}
                                                            onClick={() => toggleDamageItem(`damage_${index}`, false)}
                                                        >
                                                            <XCircle size={14} /> Failed
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                                    gap: 'var(--space-2)',
                                                    fontSize: 'var(--font-size-sm)'
                                                }}>
                                                    <div>
                                                        <span style={{ color: 'var(--text-tertiary)' }}>Damage:</span>
                                                        <div style={{ fontWeight: 500 }}>{item.damageType || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'var(--text-tertiary)' }}>Component:</span>
                                                        <div style={{ fontWeight: 500 }}>{item.component || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'var(--text-tertiary)' }}>Severity:</span>
                                                        <div style={{ fontWeight: 500 }}>{item.severity || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'var(--text-tertiary)' }}>Size:</span>
                                                        <div style={{ fontWeight: 500 }}>{item.size || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'var(--text-tertiary)' }}>Cost:</span>
                                                        <div style={{ fontWeight: 500 }}>RM {item.lineTotal || item.estimatedCost || 0}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 2: General Inspection Checklist (7-Point) */}
                            <div className="inspection-section" style={{ marginTop: surveyDamageItems.length > 0 ? '24px' : 0 }}>
                                <h4 className="inspection-section-title" style={{
                                    color: 'var(--primary-600)',
                                    borderBottom: '2px solid var(--primary-200)',
                                    paddingBottom: '8px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <ClipboardCheck size={18} />
                                    {t('inspection.generalChecklist') || 'General Inspection Checklist'}
                                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                                        Optional
                                    </span>
                                </h4>
                                <div className="inspection-checklist">
                                    {INSPECTION_CHECKLIST.filter(item => !item.category).map((item) => (
                                        <div key={item.id} className={`checklist-item ${checklistResults[item.id] === true ? 'passed' :
                                            checklistResults[item.id] === false ? 'failed' : ''
                                            }`}>
                                            <div className="checklist-item-info">
                                                <span className="checklist-item-label">{item.label}</span>
                                                <span className="checklist-item-desc">{item.description}</span>
                                            </div>
                                            <div className="checklist-item-actions">
                                                <button
                                                    className={`btn btn-sm ${checklistResults[item.id] === true ? 'btn-success' : 'btn-ghost'}`}
                                                    onClick={() => toggleChecklistItem(item.id, true)}
                                                >
                                                    <CheckCircle size={16} /> {t('inspection.pass') || 'Pass'}
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${checklistResults[item.id] === false ? 'btn-danger' : 'btn-ghost'}`}
                                                    onClick={() => toggleChecklistItem(item.id, false)}
                                                >
                                                    <XCircle size={16} /> {t('inspection.fail') || 'Fail'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SECTION 3: Post-Repair Cleaning Checklist */}
                            {INSPECTION_CHECKLIST.filter(item => item.category === 'POST_REPAIR_CLEAN').length > 0 && (
                                <div className="inspection-section" style={{ marginTop: '24px' }}>
                                    <h4 className="inspection-section-title" style={{
                                        color: 'var(--secondary-600)',
                                        borderBottom: '2px solid var(--secondary-200)',
                                        paddingBottom: '8px',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <Droplets size={18} />
                                        {t('inspection.postRepairCleaning') || 'Post-Repair Cleaning'}
                                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                                            Optional
                                        </span>
                                    </h4>
                                    <div className="inspection-checklist">
                                        {INSPECTION_CHECKLIST.filter(item => item.category === 'POST_REPAIR_CLEAN').map((item) => (
                                            <div key={item.id} className={`checklist-item ${checklistResults[item.id] === true ? 'passed' :
                                                checklistResults[item.id] === false ? 'failed' : ''
                                                }`}>
                                                <div className="checklist-item-info">
                                                    <span className="checklist-item-label">{item.label}</span>
                                                    <span className="checklist-item-desc">{item.description}</span>
                                                </div>
                                                <div className="checklist-item-actions">
                                                    <button
                                                        className={`btn btn-sm ${checklistResults[item.id] === true ? 'btn-success' : 'btn-ghost'}`}
                                                        onClick={() => toggleChecklistItem(item.id, true)}
                                                    >
                                                        <CheckCircle size={16} /> {t('inspection.pass') || 'Pass'}
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${checklistResults[item.id] === false ? 'btn-danger' : 'btn-ghost'}`}
                                                        onClick={() => toggleChecklistItem(item.id, false)}
                                                    >
                                                        <XCircle size={16} /> {t('inspection.fail') || 'Fail'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="form-group mt-4">
                                <label className="form-label">{t('inspection.inspectorNotes') || 'Inspector Notes'}</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={inspectionNotes}
                                    onChange={(e) => setInspectionNotes(e.target.value)}
                                    placeholder={t('inspection.notesPlaceholder') || 'Add any observations or comments...'}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="inspection-summary">
                                {surveyDamageItems.length > 0 && (
                                    <span className="summary-damage" style={{ marginRight: '12px', color: 'var(--warning-600)' }}>
                                        <AlertTriangle size={14} />
                                        {Object.values(damageItemResults).filter(v => v === true).length}/{surveyDamageItems.length} {t('inspection.repairsVerified') || 'Repairs Verified'}
                                    </span>
                                )}
                                <span className="summary-passed">
                                    <CheckCircle size={14} />
                                    {Object.values(checklistResults).filter(v => v === true).length} {t('inspection.passed') || 'Passed'}
                                </span>
                                <span className="summary-failed">
                                    <XCircle size={14} />
                                    {Object.values(checklistResults).filter(v => v === false).length} {t('inspection.failed') || 'Failed'}
                                </span>
                                <span className="summary-pending">
                                    {Object.values(checklistResults).filter(v => v === null).length +
                                        Object.values(damageItemResults).filter(v => v === null).length} {t('inspection.remaining') || 'Remaining'}
                                </span>
                            </div>
                            <button className="btn btn-secondary" onClick={() => setShowInspectionModal(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={completeInspection}
                                disabled={
                                    // Only require damage items to be verified (optional checklist is not required)
                                    surveyDamageItems.length > 0 && Object.values(damageItemResults).some(v => v === null)
                                }
                            >
                                <ClipboardCheck size={16} /> {t('inspection.completeInspection') || 'Complete Inspection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Rework Modal */}
            {resultModal && (
                <div className="modal-overlay" onClick={() => setResultModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('inspection.recordRework') || 'Record Rework Required'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setResultModal(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">{t('inspection.reworkDetails') || 'Rework Details'}</label>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    placeholder={t('inspection.describeIssues') || 'Describe issues found and required rework...'}
                                    value={reworkNotes}
                                    onChange={(e) => setReworkNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setResultModal(null)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    recordResult(resultModal.id, 'REWORK', reworkNotes);
                                    setResultModal(null);
                                    setReworkNotes('');
                                }}
                            >
                                <AlertTriangle size={16} /> {t('inspection.requireRework') || 'Require Rework'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
