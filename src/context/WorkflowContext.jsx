import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from './DataContext';

const WorkflowContext = createContext(null);

// Workflow steps definition
const WORKFLOW_STEPS = [
    { id: 'registered', label: 'Registered', description: 'Container added to system' },
    { id: 'survey_created', label: 'Survey Created', description: 'Damage survey started' },
    { id: 'survey_completed', label: 'Survey Completed', description: 'Survey finished with damage items' },
    { id: 'eor_created', label: 'EOR Created', description: 'Estimate of Repair created' },
    { id: 'eor_approved', label: 'EOR Approved', description: 'Liner approved the estimate' },
    { id: 'shunted', label: 'Shunted to Repair', description: 'Moved to repair bay' },
    { id: 'repair_started', label: 'Repair Started', description: 'Repair work in progress' },
    { id: 'repair_completed', label: 'Repair Completed', description: 'Repair work finished' },
    { id: 'washing', label: 'Washing', description: 'Container cleaning and sanitization' },
    { id: 'inspection_passed', label: 'Pre-Inspection Passed', description: 'Quality check passed' },
    { id: 'released', label: 'Released', description: 'Container available for use' }
];

export function WorkflowProvider({ children }) {
    const { containers, surveys, eors } = useData();
    const [selectedContainerId, setSelectedContainerId] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false); // Hidden by default until user opens
    const [refreshKey, setRefreshKey] = useState(0); // Force re-evaluation trigger

    // Get selected container data
    const selectedContainer = useMemo(() => {
        if (!selectedContainerId) return null;
        return containers.find(c => c.id === selectedContainerId);
    }, [selectedContainerId, containers]);

    // Get related survey
    const containerSurvey = useMemo(() => {
        if (!selectedContainer) return null;
        return surveys.find(s =>
            s.containerId === selectedContainer.id ||
            s.containerNumber === selectedContainer.containerNumber
        );
    }, [selectedContainer, surveys]);

    // Get related EOR
    const containerEOR = useMemo(() => {
        if (!selectedContainer) return null;
        return eors.find(e =>
            e.containerId === selectedContainer.id ||
            e.containerNumber === selectedContainer.containerNumber
        );
    }, [selectedContainer, eors]);

    // Calculate current step based on container state
    // This is a useMemo that re-evaluates when selectedContainer changes
    // It reads from localStorage directly to get the latest shunting/preinspection data
    const currentStep = useMemo(() => {
        if (!selectedContainer) return -1;

        const status = selectedContainer.status;

        // Check status to determine step
        if (status === 'AV') return 10; // Released
        if (status === 'COMPLETED') {
            // Check if pre-inspection passed
            const preinspections = JSON.parse(localStorage.getItem('mnr_preinspections') || '[]');
            const passed = preinspections.find(i =>
                i.containerId === selectedContainer.id && i.result === 'ACCEPTED'
            );
            if (passed) return 9; // Inspection passed

            // Check if washing completed
            const washingOrders = JSON.parse(localStorage.getItem('mnr_washing') || '[]');
            const washed = washingOrders.find(w =>
                w.containerId === selectedContainer.id && w.status === 'COMPLETED'
            );
            if (washed) return 8; // Washing completed

            return 7; // Repair completed
        }
        if (status === 'REPAIR') return 6; // Repair in progress
        if (status === 'AR') {
            // Check if shunted - read directly from localStorage for freshest data
            const shunting = JSON.parse(localStorage.getItem('mnr_shunting') || '[]');
            const shunted = shunting.find(s =>
                (s.containerId === selectedContainer.id ||
                    s.containerNumber === selectedContainer.containerNumber) &&
                s.status === 'COMPLETED'
            );
            if (shunted) return 5; // Shunted
            return 4; // EOR approved (AR status means approved)
        }

        // Check EOR status
        if (containerEOR) {
            if (containerEOR.status?.includes('APPROVED')) return 4;
            if (containerEOR.status === 'SENT' || containerEOR.status === 'PENDING') return 3;
            if (containerEOR.status === 'DRAFT') return 3;
        }

        // Check survey status
        if (containerSurvey) {
            if (containerSurvey.status === 'COMPLETED') return 2;
            if (containerSurvey.status === 'DRAFT') return 1;
        }

        // Container just registered
        if (status === 'DM' || status === 'STACKING') return 0;

        return 0;
    }, [selectedContainer, containerSurvey, containerEOR, refreshKey]); // refreshKey forces re-evaluation

    // Get step data with completion status
    const workflowSteps = useMemo(() => {
        // Get washing orders from localStorage
        const washingOrders = JSON.parse(localStorage.getItem('mnr_washing') || '[]');
        const containerWashing = selectedContainer ? washingOrders.find(w =>
            w.containerId === selectedContainer.id && w.status === 'COMPLETED'
        ) : null;

        // Washing step index is 8 (after repair_completed)
        const WASHING_STEP_INDEX = 8;

        return WORKFLOW_STEPS.map((step, index) => {
            let stepStatus;

            // Special handling for Washing step (index 8)
            if (index === WASHING_STEP_INDEX) {
                if (containerWashing) {
                    // Container has completed washing
                    stepStatus = currentStep > index ? 'completed' :
                        currentStep === index ? 'current' : 'pending';
                } else if (currentStep > index) {
                    // Container skipped washing (no washing order but passed inspection)
                    stepStatus = 'skipped';
                } else if (currentStep === index) {
                    stepStatus = 'current';
                } else {
                    stepStatus = 'pending';
                }
            } else {
                // Normal step status logic
                stepStatus = index < currentStep ? 'completed' :
                    index === currentStep ? 'current' : 'pending';
            }

            return {
                ...step,
                index,
                status: stepStatus,
                data: getStepData(index, containerWashing)
            };
        });

        function getStepData(stepIndex, washingData) {
            switch (stepIndex) {
                case 0: // Registered
                    return selectedContainer ? {
                        date: selectedContainer.gateInDate,
                        detail: `Status: ${selectedContainer.status}`
                    } : null;
                case 1: // Survey created
                case 2: // Survey completed
                    return containerSurvey ? {
                        id: containerSurvey.id,
                        detail: containerSurvey.status
                    } : null;
                case 3: // EOR created
                case 4: // EOR approved
                    return containerEOR ? {
                        id: containerEOR.id,
                        detail: `RM ${containerEOR.totalCost} - ${containerEOR.status}`
                    } : null;
                case 8: // Washing
                    return washingData ? {
                        id: washingData.id,
                        detail: washingData.status
                    } : null;
                default:
                    return null;
            }
        }
    }, [currentStep, selectedContainer, containerSurvey, containerEOR]);

    // Get next action
    const getNextAction = useCallback(() => {
        if (!selectedContainer) return null;

        switch (currentStep) {
            case 0: // Registered - need to create survey
                return {
                    label: 'Create Survey',
                    path: `/surveys/new/${selectedContainer.id}`,
                    icon: 'clipboard'
                };
            case 1: // Survey created - need to complete
                return {
                    label: 'Complete Survey',
                    path: `/surveys/${containerSurvey?.id}`,
                    icon: 'check'
                };
            case 2: // Survey completed - need EOR
                return {
                    label: 'Create EOR',
                    path: `/eor/new?containerId=${selectedContainer.id}`,
                    icon: 'file-text'
                };
            case 3: // EOR created - need approval
                return {
                    label: 'View EOR',
                    path: `/eor/${containerEOR?.id}`,
                    icon: 'eye'
                };
            case 4: // Approved - need shunting
                return {
                    label: 'Create Shunting',
                    path: '/shunting',
                    icon: 'truck'
                };
            case 5: // Shunted - start repair (go to Repair Orders to start)
                return {
                    label: 'Start Repair',
                    path: '/repair-orders',
                    icon: 'tool'
                };
            case 7: // Repair complete - need washing
                return {
                    label: 'Start Washing',
                    path: '/washing',
                    icon: 'droplet'
                };
            case 8: // Washing complete - need inspection
                return {
                    label: 'Schedule Inspection',
                    path: '/pre-inspection',
                    icon: 'search'
                };
            case 9: // Inspection passed - need stacking
                return {
                    label: 'Stack & Release',
                    path: '/stacking',
                    icon: 'layers'
                };
            default:
                return null;
        }
    }, [currentStep, selectedContainer, containerSurvey, containerEOR]);

    // Select container for workflow
    const selectContainer = useCallback((containerId) => {
        setSelectedContainerId(containerId);
        setRefreshKey(prev => prev + 1); // Force re-evaluation of workflow steps
        setIsPanelOpen(true);
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedContainerId(null);
    }, []);

    // Toggle panel
    const togglePanel = useCallback(() => {
        setIsPanelOpen(prev => !prev);
    }, []);

    const value = {
        // State
        selectedContainerId,
        selectedContainer,
        isPanelOpen,
        currentStep,
        workflowSteps,
        containerSurvey,
        containerEOR,

        // Actions
        selectContainer,
        clearSelection,
        togglePanel,
        setIsPanelOpen,
        getNextAction,

        // Constants
        WORKFLOW_STEPS
    };

    return (
        <WorkflowContext.Provider value={value}>
            {children}
        </WorkflowContext.Provider>
    );
}

export function useWorkflow() {
    const context = useContext(WorkflowContext);
    if (!context) {
        throw new Error('useWorkflow must be used within a WorkflowProvider');
    }
    return context;
}
