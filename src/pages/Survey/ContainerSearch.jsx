import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, Container, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { CONTAINER_STATUS, CONTAINER_STATUS_LABELS } from '../../config/constants';

export default function ContainerSearch() {
    const { containers, getSurveysByContainer } = useData();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    // Only show containers that are eligible for survey (gate-in, not yet surveyed as completed)
    const eligibleContainers = containers.filter(c => {
        const surveys = getSurveysByContainer(c.id);
        const hasCompletedSurvey = surveys.some(s => s.status === 'COMPLETED' && s.sequence === c.sequence);
        return c.status === CONTAINER_STATUS.DM && !hasCompletedSurvey;
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
                                    'All containers have completed surveys or are not in DM status'}
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
