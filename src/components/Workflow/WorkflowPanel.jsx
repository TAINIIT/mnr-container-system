import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../../context/WorkflowContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../common/Toast';
import {
    X, CheckCircle2, Circle, ArrowRight, Package, ClipboardList,
    FileText, ThumbsUp, Truck, Wrench, Search, Layers, Droplets, MinusCircle
} from 'lucide-react';
import './WorkflowPanel.css';

export default function WorkflowPanel() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const toast = useToast();
    const { containers, repairOrders, createRepairOrder, eors } = useData();
    const {
        selectedContainerId,
        selectedContainer,
        isPanelOpen,
        workflowSteps,
        currentStep,
        setIsPanelOpen,
        selectContainer,
        clearSelection,
        getNextAction,
        containerEOR
    } = useWorkflow();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef(null);

    // Get containers that need workflow (DM or in-progress)
    const workflowContainers = containers.filter(c =>
        ['DM', 'STACKING', 'AR', 'REPAIR', 'COMPLETED'].includes(c.status)
    );

    // Filter suggestions based on search query - ALWAYS show list
    const filteredContainers = searchQuery.length > 0
        ? workflowContainers.filter(c =>
            c.containerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.liner?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : workflowContainers;

    const handleSelectContainer = (container) => {
        selectContainer(container.id);
        setSearchQuery('');
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        clearSelection();
        inputRef.current?.focus();
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const stepIcons = {
        0: Package,
        1: ClipboardList,
        2: ClipboardList,
        3: FileText,
        4: ThumbsUp,
        5: Truck,
        6: Wrench,
        7: Wrench,
        8: Droplets,   // Washing
        9: Search,     // Pre-Inspection
        10: Layers     // Released
    };

    // Handle next action click - special handling for Start Repair
    const handleNextAction = () => {
        if (!nextAction) return;

        // Special handling for "Start Repair" - auto-create RO if needed
        if (nextAction.label === 'Start Repair' && selectedContainer && containerEOR) {
            // Check if RO already exists for this container
            const existingRO = repairOrders.find(r =>
                r.containerId === selectedContainer.id &&
                !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(r.status)
            );

            if (existingRO) {
                // RO already exists, navigate to it
                toast.info(`Repair Order ${existingRO.id} already exists`);
                navigate(`/repair-orders/${existingRO.id}`);
            } else {
                // Create new RO with Survey's Transaction ID for consistency
                const result = createRepairOrder({
                    eorId: containerEOR.id,
                    surveyId: containerEOR.surveyId, // Use Survey's Transaction ID
                    containerId: selectedContainer.id,
                    containerNumber: selectedContainer.containerNumber,
                    liner: selectedContainer.liner,
                    workItems: containerEOR.repairItems?.map(item => ({
                        repairItemId: item.id,
                        status: 'NEW'
                    })) || []
                }, user.username);

                if (result.success) {
                    toast.success(`Repair Order ${result.ro.id} created!`);
                    navigate(`/repair-orders/${result.ro.id}`);
                } else {
                    toast.error(result.error);
                    navigate('/repair-orders');
                }
            }
        } else {
            // Normal navigation for other actions
            navigate(nextAction.path);
        }
    };

    const nextAction = getNextAction();

    if (!isPanelOpen) return null;

    return (
        <div className="workflow-panel">
            <div className="workflow-header">
                <h3>📋 Workflow Guide</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setIsPanelOpen(false)}>
                    <X size={18} />
                </button>
            </div>

            {/* Container Search */}
            <div className="workflow-selector">
                <label>Search Container</label>
                <div className="workflow-search-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="workflow-search-input"
                        placeholder="Type to filter..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        autoComplete="off"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="search-clear"
                            onClick={handleClearSearch}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Container List - Always Visible */}
            {!selectedContainer && (
                <div className="workflow-container-list">
                    {filteredContainers.length > 0 ? (
                        filteredContainers.map(c => (
                            <div
                                key={c.id}
                                className={`container-list-item ${selectedContainerId === c.id ? 'selected' : ''}`}
                                onClick={() => handleSelectContainer(c)}
                            >
                                <div className="container-list-main">
                                    <Package size={14} />
                                    <span className="container-list-number">{c.containerNumber}</span>
                                    <span className={`container-list-status status-${c.status.toLowerCase()}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <div className="container-list-detail">
                                    {c.liner} • {c.size}ft {c.type}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="container-list-empty">
                            No containers found
                        </div>
                    )}
                </div>
            )}

            {/* Workflow Steps - Show when container selected */}
            {selectedContainer && (
                <div className="workflow-steps">
                    <div className="workflow-container-info">
                        <Package size={18} />
                        <div>
                            <strong>{selectedContainer.containerNumber}</strong>
                            <span>{selectedContainer.liner} • {selectedContainer.size}ft {selectedContainer.type}</span>
                        </div>
                        <button
                            className="btn btn-ghost btn-xs"
                            onClick={handleClearSearch}
                            title="Change container"
                        >
                            Change
                        </button>
                    </div>

                    <div className="steps-list">
                        {workflowSteps.map((step, index) => {
                            const Icon = stepIcons[index] || Circle;
                            const isCompleted = step.status === 'completed';
                            const isCurrent = step.status === 'current';
                            const isSkipped = step.status === 'skipped';

                            return (
                                <div
                                    key={step.id}
                                    className={`step-item ${step.status}`}
                                >
                                    <div className="step-indicator">
                                        {isCompleted ? (
                                            <CheckCircle2 size={20} className="step-icon completed" />
                                        ) : isSkipped ? (
                                            <MinusCircle size={20} className="step-icon skipped" />
                                        ) : isCurrent ? (
                                            <div className="step-icon current">
                                                <Icon size={14} />
                                            </div>
                                        ) : (
                                            <Circle size={20} className="step-icon pending" />
                                        )}
                                        {index < workflowSteps.length - 1 && (
                                            <div className={`step-line ${isCompleted ? 'completed' : isSkipped ? 'skipped' : ''}`} />
                                        )}
                                    </div>
                                    <div className="step-content">
                                        <span className="step-label">
                                            {step.label}
                                            {isSkipped && <span className="step-skipped-badge">Skipped</span>}
                                        </span>
                                        {step.data?.detail && (
                                            <span className="step-detail">{step.data.detail}</span>
                                        )}
                                        {step.data?.id && (
                                            <span className="step-id">{step.data.id}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quick Start */}
            <div className="workflow-footer">
                <button
                    className="btn btn-secondary btn-sm btn-block"
                    onClick={() => navigate('/containers')}
                >
                    View All Containers
                </button>
            </div>
        </div>
    );
}
