import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, Container, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { CONTAINER_STATUS, CONTAINER_STATUS_LABELS } from '../../config/constants';

export default function ContainerSearch() {
    const { containers, getSurveysByContainer, eors, repairOrders } = useData();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    // Show containers eligible for survey: STACKING or DM status, without active workflow
    const eligibleContainers = containers.filter(c => {
        const surveys = getSurveysByContainer(c.id);

        // Exclude if has any survey that is NOT completed/released
        const hasActiveSurvey = surveys.some(s =>
            s.status !== 'COMPLETED' && s.status !== 'RELEASED'
        );
        if (hasActiveSurvey) return false;

        // Exclude if has active EOR (pending approval)
        const hasActiveEOR = eors.some(e =>
            e.containerId === c.id &&
            !['APPROVED', 'AUTO_APPROVED', 'REJECTED'].includes(e.status)
        );
        if (hasActiveEOR) return false;

        // Exclude if has active Repair Order
        const hasActiveRO = repairOrders.some(r =>
            r.containerId === c.id &&
            !['COMPLETED', 'QC_PASSED'].includes(r.status)
        );
        if (hasActiveRO) return false;

        // Only allow STACKING or DM status containers
        return c.status === CONTAINER_STATUS.DM || c.status === CONTAINER_STATUS.STACKING;
    });

    const filteredContainers = eligibleContainers.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.containerNumber.toLowerCase().includes(q) ||
            (c.booking && c.booking.toLowerCase().includes(q)) ||
            (c.yardLocation && `${c.yardLocation.block}${c.yardLocation.row}`.toLowerCase().includes(q));
    });

    const handleSelect = (containerId) => {
        navigate(`/surveys/new/${containerId}`);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2>Search Container for Survey</h2>
                    <p className="text-muted">Find a container to create a new survey</p>
                </div>
            </div>

            <div className="card">
                <div className="form-group">
                    <label className="form-label required">Container Number</label>
                    <div className="search-box" style={{ maxWidth: 500 }}>
                        <Search size={18} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter container number, booking, or location (e.g., A5)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <p className="form-hint">
                        You can also filter by booking reference or bay/row location
                    </p>
                </div>

                <div className="mt-4">
                    <h4 style={{ marginBottom: 'var(--space-3)' }}>
                        Available Containers ({filteredContainers.length})
                    </h4>

                    {filteredContainers.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                            <Container size={48} />
                            <h3>No eligible containers found</h3>
                            <p>
                                {search ?
                                    'Try a different search term' :
                                    'All containers have completed surveys or are not in STACKING/DM status'}
                            </p>
                        </div>
                    ) : (
                        <div className="container-search-results">
                            {filteredContainers.map((container) => {
                                const surveys = getSurveysByContainer(container.id);
                                const draftSurvey = surveys.find(s => s.status === 'DRAFT');

                                return (
                                    <div
                                        key={container.id}
                                        className="container-search-item"
                                        onClick={() => handleSelect(container.id)}
                                    >
                                        <div className="container-search-main">
                                            <span className="container-number" style={{ fontSize: '1.1rem' }}>
                                                {container.containerNumber}
                                            </span>
                                            <span className="badge badge-dm">
                                                {CONTAINER_STATUS_LABELS[container.status]}
                                            </span>
                                        </div>
                                        <div className="container-search-details">
                                            <span>{container.size}</span>
                                            <span>•</span>
                                            <span>{container.liner}</span>
                                            <span>•</span>
                                            <span>
                                                {container.yardLocation ?
                                                    `${container.yardLocation.block}-${container.yardLocation.row}-${container.yardLocation.tier}` :
                                                    'No location'}
                                            </span>
                                        </div>
                                        {draftSurvey && (
                                            <div className="container-search-warning">
                                                <AlertCircle size={14} />
                                                <span>Has draft survey: {draftSurvey.id}</span>
                                            </div>
                                        )}
                                        <ArrowRight size={20} className="container-search-arrow" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
