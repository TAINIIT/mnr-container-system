import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import RetrieveButton from '../../components/common/RetrieveButton';
import { Package, Plus, CheckCircle, Truck, ArrowRight, Search, FileText, Mail, MapPin, Download, Printer, ChevronLeft, ChevronRight, BarChart3, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { YARD_BLOCKS, LINERS } from '../../data/masterCodes';

export default function StackingList() {
    const { containers, surveys, updateContainer } = useData();
    const { user } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const workflowFilter = searchParams.get('workflow_filter');

    const [stackingRequests, setStackingRequests] = useState(() => {
        const saved = localStorage.getItem('mnr_stacking');
        return saved ? JSON.parse(saved) : [];
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [targetBlock, setTargetBlock] = useState('');
    const [targetRow, setTargetRow] = useState('');
    const [targetTier, setTargetTier] = useState('');

    // New states for enhanced features
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [linerFilter, setLinerFilter] = useState('');
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [releaseRequest, setReleaseRequest] = useState(null);
    const [showStockReport, setShowStockReport] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Collapsible filters - auto-collapse on mobile
    const [filtersVisible, setFiltersVisible] = useState(() => window.innerWidth > 768);

    // Get pre-inspections to find accepted containers
    const preinspections = JSON.parse(localStorage.getItem('mnr_preinspections') || '[]');
    const acceptedContainerIds = preinspections
        .filter(i => i.result === 'ACCEPTED')
        .map(i => i.containerId);

    // Get container IDs that already have stacking requests (any status)
    const containersWithStackingRequest = stackingRequests.map(s => s.containerId);

    // Containers ready for stacking
    const readyContainers = containers.filter(c =>
        (c.status === 'COMPLETED' || c.status === 'AV') &&
        acceptedContainerIds.includes(c.id) &&
        !containersWithStackingRequest.includes(c.id)
    );

    // Filter stacking requests
    const filteredRequests = stackingRequests.filter(req => {
        // Special workflow filter from Dashboard - show COMPLETED only (released)
        if (workflowFilter === 'completed') {
            if (req.status !== 'COMPLETED') {
                return false;
            }
        }

        const matchesSearch = !search ||
            req.containerNumber.toLowerCase().includes(search.toLowerCase()) ||
            req.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || req.status === statusFilter;
        const matchesLiner = !linerFilter || req.liner === linerFilter;
        return matchesSearch && matchesStatus && matchesLiner;
    });

    // Pagination
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stock report data
    const stockByLiner = LINERS.reduce((acc, liner) => {
        acc[liner.code] = containers.filter(c => c.liner === liner.code && c.status === 'AV').length;
        return acc;
    }, {});

    const stockByBlock = YARD_BLOCKS.filter(b => !b.type || b.type === 'STORAGE').reduce((acc, block) => {
        acc[block.code] = containers.filter(c =>
            c.yardLocation?.block === block.code && c.status === 'AV'
        ).length;
        return acc;
    }, {});

    // Location search results
    const locationResults = locationSearch
        ? containers.filter(c =>
            c.containerNumber.toLowerCase().includes(locationSearch.toLowerCase()) ||
            (c.yardLocation &&
                `${c.yardLocation.block}-${c.yardLocation.row}-${c.yardLocation.tier}`.includes(locationSearch))
        ).slice(0, 10)
        : [];

    const saveRequests = (data) => {
        setStackingRequests(data);
        localStorage.setItem('mnr_stacking', JSON.stringify(data));
    };

    const createRequest = () => {
        if (!selectedContainer || !targetBlock) {
            toast.error('Please select container and target location');
            return;
        }

        const containerSurvey = surveys.find(s => s.containerId === selectedContainer.id && s.status === 'COMPLETED');
        const surveyTransactionId = containerSurvey?.id || selectedContainer.lastSurveyId || null;

        const request = {
            id: `${selectedContainer.containerNumber}-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(2, 14)}`,
            containerId: selectedContainer.id,
            containerNumber: selectedContainer.containerNumber,
            surveyTransactionId,
            liner: selectedContainer.liner,
            fromLocation: selectedContainer.yardLocation,
            targetLocation: {
                block: targetBlock,
                row: parseInt(targetRow) || 1,
                tier: parseInt(targetTier) || 1
            },
            status: 'NEW',
            createdBy: user.username,
            createdAt: new Date().toISOString()
        };

        saveRequests([request, ...stackingRequests]);
        toast.success('Stacking request created!');
        setShowModal(false);
        resetForm();
    };

    const completeStacking = (request) => {
        // Show release modal instead of direct completion
        setReleaseRequest(request);
        setShowReleaseModal(true);
    };

    const generateReleaseDocument = (request) => {
        // Generate release document data
        const releaseDoc = {
            gatePassNumber: `GP-${Date.now().toString().slice(-8)}`,
            containerNumber: request.containerNumber,
            liner: request.liner,
            location: `${request.targetLocation.block}-${request.targetLocation.row}-${request.targetLocation.tier}`,
            releasedAt: new Date().toISOString(),
            releasedBy: user.username,
            surveyTransactionId: request.surveyTransactionId
        };

        // Update request status
        const updated = stackingRequests.map(s =>
            s.id === request.id ? {
                ...s,
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                completedBy: user.username,
                gatePassNumber: releaseDoc.gatePassNumber
            } : s
        );
        saveRequests(updated);

        // Update container status to AV and location
        updateContainer(request.containerId, {
            status: 'AV',
            yardLocation: request.targetLocation,
            releasedAt: new Date().toISOString(),
            gatePassNumber: releaseDoc.gatePassNumber
        }, user.username);

        return releaseDoc;
    };

    const handleCompleteAndRelease = () => {
        if (!releaseRequest) return;

        const releaseDoc = generateReleaseDocument(releaseRequest);
        toast.success(`${releaseRequest.containerNumber} released with Gate Pass: ${releaseDoc.gatePassNumber}`);
        setShowReleaseModal(false);
        setReleaseRequest(null);
    };

    const handleNotifyLiner = () => {
        if (!releaseRequest) return;

        // Simulate sending notification to liner
        const liner = LINERS.find(l => l.code === releaseRequest.liner);
        const releaseDoc = generateReleaseDocument(releaseRequest);

        // In a real system, this would send an email
        console.log(`Notifying ${liner?.name || releaseRequest.liner} about container ${releaseRequest.containerNumber}`);

        toast.success(`Release notification sent to ${liner?.name || releaseRequest.liner} for ${releaseRequest.containerNumber}`);
        setShowReleaseModal(false);
        setReleaseRequest(null);
    };

    const handlePrintGatePass = (gatePassNumber) => {
        // Open print dialog for gate pass
        const printWindow = window.open('', '_blank');
        const request = stackingRequests.find(r => r.gatePassNumber === gatePassNumber);
        if (printWindow && request) {
            printWindow.document.write(`
                <html>
                <head><title>Gate Pass - ${gatePassNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }
                    .details { margin-top: 30px; }
                    .row { display: flex; justify-content: space-between; margin: 10px 0; }
                    .label { font-weight: bold; }
                    .footer { margin-top: 50px; text-align: center; }
                </style>
                </head>
                <body>
                    <div class="header">
                        <h1>CONTAINER RELEASE GATE PASS</h1>
                        <h2>${gatePassNumber}</h2>
                    </div>
                    <div class="details">
                        <div class="row"><span class="label">Container Number:</span><span>${request.containerNumber}</span></div>
                        <div class="row"><span class="label">Liner:</span><span>${request.liner}</span></div>
                        <div class="row"><span class="label">Location:</span><span>${request.targetLocation.block}-${request.targetLocation.row}-${request.targetLocation.tier}</span></div>
                        <div class="row"><span class="label">Released By:</span><span>${request.completedBy}</span></div>
                        <div class="row"><span class="label">Released At:</span><span>${new Date(request.completedAt).toLocaleString()}</span></div>
                    </div>
                    <div class="footer">
                        <p>___________________________</p>
                        <p>Authorized Signature</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const resetForm = () => {
        setSelectedContainer(null);
        setTargetBlock('');
        setTargetRow('');
        setTargetTier('');
    };

    const availableBlocks = YARD_BLOCKS.filter(b => !b.type || b.type === 'STORAGE');

    return (
        <div className="page">
            {/* Sticky Header Section */}
            <div className="page-sticky-header">
                <div className="page-header">
                    <div>
                        <h2>{t('stacking.title')}</h2>
                        <p className="text-muted">{t('stacking.readyToStack')}</p>
                    </div>
                    <div className="header-actions">
                        <RetrieveButton screenId="stacking" />
                        <button className="btn btn-secondary" onClick={() => setShowStockReport(!showStockReport)}>
                            <BarChart3 size={16} /> {t('stacking.stockReport') || 'Stock Report'}
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> {t('stacking.newRequest')}
                        </button>
                    </div>
                </div>

                {/* Location Search */}
                <div className="card mb-3">
                    <div className="location-search">
                        <div className="search-box" style={{ flex: 1 }}>
                            <MapPin size={18} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('stacking.searchLocation') || 'Search container by number or location (e.g., A-1-1)...'}
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                            />
                        </div>
                        {locationResults.length > 0 && (
                            <div className="location-results">
                                {locationResults.map(c => (
                                    <div key={c.id} className="location-result-item">
                                        <span className="container-number">{c.containerNumber}</span>
                                        <span className="location-badge">
                                            <MapPin size={12} />
                                            {c.yardLocation
                                                ? `${c.yardLocation.block}-${c.yardLocation.row}-${c.yardLocation.tier}`
                                                : t('stacking.noLocation') || 'No location'
                                            }
                                        </span>
                                        <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                                        <span className="text-muted">{c.liner}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4">
                    <div className="stat-card">
                        <div className="stat-card-value">{readyContainers.length}</div>
                        <div className="stat-card-label">{t('stacking.readyToStackLabel') || 'Ready to Stack'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value" style={{ color: 'var(--warning-500)' }}>
                            {stackingRequests.filter(s => s.status === 'NEW').length}
                        </div>
                        <div className="stat-card-label">{t('common.pending') || 'Pending'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value" style={{ color: 'var(--primary-500)' }}>
                            {stackingRequests.filter(s => s.status === 'IN_PROGRESS').length}
                        </div>
                        <div className="stat-card-label">{t('common.inProgress') || 'In Progress'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value" style={{ color: 'var(--success-500)' }}>
                            {stackingRequests.filter(s => s.status === 'COMPLETED').length}
                        </div>
                        <div className="stat-card-label">{t('stacking.released') || 'Released'}</div>
                    </div>
                </div>
            </div>

            {/* Ready Containers */}
            {readyContainers.length > 0 && (
                <div className="card mb-4">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>
                        <CheckCircle size={18} style={{ color: 'var(--success-500)' }} /> {t('stacking.readyForStacking') || 'Ready for Stacking'}
                    </h3>
                    <div className="grid grid-cols-4">
                        {readyContainers.slice(0, 8).map(c => (
                            <div key={c.id} className="ready-container-card">
                                <span className="container-number">{c.containerNumber}</span>
                                <span className="text-sm text-muted">{c.liner}</span>
                                <button
                                    className="btn btn-success btn-sm mt-2"
                                    onClick={() => {
                                        setSelectedContainer(c);
                                        setShowModal(true);
                                    }}
                                >
                                    <Package size={14} /> {t('stacking.stackNow') || 'Stack Now'}
                                </button>
                            </div>
                        ))}
                        {readyContainers.length > 8 && (
                            <div className="ready-container-card more-card">
                                <span className="more-count">+{readyContainers.length - 8}</span>
                                <span className="text-muted">{t('common.more') || 'more'}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{t('stacking.stackingRequests') || 'Stacking Requests'}</h3>
                    {/* Mobile Filter Toggle */}
                    <button
                        className={`mobile-filter-toggle ${!filtersVisible ? 'collapsed' : ''}`}
                        onClick={() => setFiltersVisible(!filtersVisible)}
                    >
                        <Filter size={16} />
                        {filtersVisible ? t('common.hideFilters') || 'Hide Filters' : t('common.showFilters') || 'Show Filters'}
                        {filtersVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

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
                                <option value="NEW">{t('stacking.new') || 'New'}</option>
                                <option value="IN_PROGRESS">{t('common.inProgress') || 'In Progress'}</option>
                                <option value="COMPLETED">{t('stacking.released') || 'Released'}</option>
                            </select>
                            <select
                                className="form-input"
                                style={{ width: 130 }}
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

                {filteredRequests.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} />
                        <h3>{t('stacking.noStackingRequests') || 'No stacking requests'}</h3>
                        <p>{t('stacking.createRequests') || 'Create requests to stack accepted containers'}</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('columns.transactionId')}</th>
                                        <th>{t('columns.containerNumber')}</th>
                                        <th>{t('columns.liner')}</th>
                                        <th>{t('columns.source')}</th>
                                        <th>{t('columns.targetLocation')}</th>
                                        <th>{t('columns.stackingStatus')}</th>
                                        <th>{t('columns.gatePass') || 'Gate Pass'}</th>
                                        <th>{t('columns.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRequests.map((req) => (
                                        <tr key={req.id}>
                                            <td style={{ fontWeight: 500 }}>{req.surveyTransactionId || req.id}</td>
                                            <td><span className="container-number">{req.containerNumber}</span></td>
                                            <td>{req.liner}</td>
                                            <td>
                                                {req.fromLocation ?
                                                    `${req.fromLocation.block}-${req.fromLocation.row}-${req.fromLocation.tier}` :
                                                    t('stacking.repairBay') || 'Repair Bay'}
                                            </td>
                                            <td>
                                                <span className="location-badge">
                                                    <MapPin size={12} />
                                                    {req.targetLocation.block}-{req.targetLocation.row}-{req.targetLocation.tier}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${req.status === 'COMPLETED' ? 'av' : req.status.toLowerCase().replace('_', '-')}`}>
                                                    {req.status === 'COMPLETED' ? t('stacking.released') || 'Released' : req.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                {req.gatePassNumber ? (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => handlePrintGatePass(req.gatePassNumber)}
                                                    >
                                                        <Printer size={14} /> {req.gatePassNumber}
                                                    </button>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {req.status !== 'COMPLETED' && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => completeStacking(req)}
                                                    >
                                                        <CheckCircle size={14} /> {t('stacking.completeRelease') || 'Complete & Release'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
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
                        )}
                    </>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('stacking.newStackingRequest') || 'New Stacking Request'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">{t('common.container') || 'Container'}</label>
                                <select
                                    className="form-input"
                                    value={selectedContainer?.id || ''}
                                    onChange={(e) => setSelectedContainer(containers.find(c => c.id === e.target.value))}
                                >
                                    <option value="">{t('stacking.selectContainer') || 'Select container...'}</option>
                                    {readyContainers.map(c => (
                                        <option key={c.id} value={c.id}>{c.containerNumber} - {c.liner}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3" style={{ gap: 'var(--space-3)' }}>
                                <div className="form-group">
                                    <label className="form-label required">{t('stacking.block') || 'Block'}</label>
                                    <select
                                        className="form-input"
                                        value={targetBlock}
                                        onChange={(e) => setTargetBlock(e.target.value)}
                                    >
                                        <option value="">{t('common.select') || 'Select...'}</option>
                                        {availableBlocks.map(b => (
                                            <option key={b.code} value={b.code}>{b.code}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('stacking.row') || 'Row'}</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="1"
                                        max="20"
                                        value={targetRow}
                                        onChange={(e) => setTargetRow(e.target.value)}
                                        placeholder="1-20"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('stacking.tier') || 'Tier'}</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="1"
                                        max="5"
                                        value={targetTier}
                                        onChange={(e) => setTargetTier(e.target.value)}
                                        placeholder="1-5"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button className="btn btn-primary" onClick={createRequest}>
                                <Package size={16} /> {t('stacking.createRequest') || 'Create Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Release Modal */}
            {showReleaseModal && releaseRequest && (
                <div className="modal-overlay" onClick={() => setShowReleaseModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('stacking.releaseContainer') || 'Release Container'}</h3>
                        </div>
                        <div className="modal-body">
                            <div className="release-info">
                                <div className="release-container-number">{releaseRequest.containerNumber}</div>
                                <div className="release-details">
                                    <span><strong>{t('columns.liner') || 'Liner'}:</strong> {releaseRequest.liner}</span>
                                    <span>
                                        <strong>{t('columns.location') || 'Location'}:</strong>
                                        {releaseRequest.targetLocation.block}-{releaseRequest.targetLocation.row}-{releaseRequest.targetLocation.tier}
                                    </span>
                                </div>
                            </div>
                            <p className="text-muted mt-4">
                                {t('stacking.releaseOptions') || 'Choose how you want to release this container:'}
                            </p>
                        </div>
                        <div className="modal-footer release-footer">
                            <button className="btn btn-ghost" onClick={() => setShowReleaseModal(false)}>
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button className="btn btn-secondary" onClick={handleCompleteAndRelease}>
                                <FileText size={16} /> {t('stacking.generateGatePass') || 'Generate Gate Pass'}
                            </button>
                            <button className="btn btn-primary" onClick={handleNotifyLiner}>
                                <Mail size={16} /> {t('stacking.notifyAndRelease') || 'Notify Liner & Release'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Report Modal */}
            {showStockReport && (
                <div className="modal-overlay" onClick={() => setShowStockReport(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <BarChart3 size={20} /> {t('stacking.stockReport') || 'Stock Report'}
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowStockReport(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Stock by Liner */}
                            <div className="stock-section">
                                <h4 className="stock-section-title">{t('stacking.stockByLiner') || 'Available Stock by Liner'}</h4>
                                <div className="stock-grid">
                                    {LINERS.map(liner => (
                                        <div key={liner.code} className="stock-item">
                                            <div className="stock-item-label">{liner.code}</div>
                                            <div className="stock-item-value" style={{ color: stockByLiner[liner.code] > 0 ? 'var(--success-500)' : 'var(--gray-400)' }}>
                                                {stockByLiner[liner.code] || 0}
                                            </div>
                                            <div className="stock-item-sublabel">{t('common.containers') || 'containers'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stock by Block */}
                            <div className="stock-section mt-4">
                                <h4 className="stock-section-title">{t('stacking.stockByBlock') || 'Available Stock by Yard Block'}</h4>
                                <div className="stock-grid">
                                    {YARD_BLOCKS.filter(b => !b.type || b.type === 'STORAGE').map(block => (
                                        <div key={block.code} className="stock-item">
                                            <div className="stock-item-label">
                                                <MapPin size={12} /> {block.code}
                                            </div>
                                            <div className="stock-item-value" style={{ color: stockByBlock[block.code] > 0 ? 'var(--primary-500)' : 'var(--gray-400)' }}>
                                                {stockByBlock[block.code] || 0}
                                            </div>
                                            <div className="stock-item-sublabel">{block.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="stock-summary mt-4">
                                <div className="stock-summary-item">
                                    <span className="stock-summary-label">{t('stacking.totalAvailable') || 'Total Available'}</span>
                                    <span className="stock-summary-value">
                                        {containers.filter(c => c.status === 'AV').length}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => {
                                // Export to CSV
                                const csvContent = [
                                    'Type,Code,Count',
                                    ...LINERS.map(l => `Liner,${l.code},${stockByLiner[l.code] || 0}`),
                                    ...YARD_BLOCKS.filter(b => !b.type || b.type === 'STORAGE').map(b => `Block,${b.code},${stockByBlock[b.code] || 0}`)
                                ].join('\n');
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast.success(t('stacking.reportExported') || 'Stock report exported');
                            }}>
                                <Download size={16} /> {t('common.exportCSV') || 'Export CSV'}
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowStockReport(false)}>
                                {t('common.close') || 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
