import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { mockContainers, mockSurveys, mockEORs, mockRepairOrders, mockAuditLogs } from '../data/mockContainers';
import { CONFIG, AUDIT_ACTIONS } from '../config/constants';
import FirebaseDataService from '../services/firebaseDataService';
import { DEMO_MODE } from '../config/firebase';

const DataContext = createContext(null);

// Helper to generate old-style IDs (kept for container registration)
const generateId = (prefix) => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${dateStr}-${random}`;
};

// Generate Transaction ID in format: CONTAINERNUMBER-YYMMDDHHMMSS
const generateTransactionId = (containerNumber) => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${containerNumber}-${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Helper to get auto-approval threshold from settings
const getAutoApprovalThreshold = () => {
    try {
        const settings = JSON.parse(localStorage.getItem('mnr_settings') || '{}');
        return settings.autoApprovalThreshold ?? CONFIG.AUTO_APPROVAL_THRESHOLD;
    } catch {
        return CONFIG.AUTO_APPROVAL_THRESHOLD;
    }
};

export function DataProvider({ children }) {
    const [containers, setContainers] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [eors, setEORs] = useState([]);
    const [repairOrders, setRepairOrders] = useState([]);
    const [washingOrders, setWashingOrders] = useState([]);
    const [shunting, setShunting] = useState([]);
    const [preinspections, setPreinspections] = useState([]);
    const [stacking, setStacking] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const unsubscribesRef = useRef([]);

    // Load data from localStorage (for DEMO_MODE fallback)
    const loadDataFromStorage = () => {
        const savedContainers = localStorage.getItem('mnr_containers');
        const savedSurveys = localStorage.getItem('mnr_surveys');
        const savedEORs = localStorage.getItem('mnr_eors');
        const savedROs = localStorage.getItem('mnr_repair_orders');
        const savedWashing = localStorage.getItem('mnr_washing_orders');
        const savedLogs = localStorage.getItem('mnr_audit_logs');

        setContainers(savedContainers ? JSON.parse(savedContainers) : mockContainers);
        setSurveys(savedSurveys ? JSON.parse(savedSurveys) : mockSurveys);
        setEORs(savedEORs ? JSON.parse(savedEORs) : mockEORs);
        setRepairOrders(savedROs ? JSON.parse(savedROs) : mockRepairOrders);
        setWashingOrders(savedWashing ? JSON.parse(savedWashing) : []);
        setAuditLogs(savedLogs ? JSON.parse(savedLogs) : mockAuditLogs);
        setIsLoading(false);
    };

    // Initialize data - Firebase or localStorage
    useEffect(() => {
        if (DEMO_MODE) {
            // Demo mode: use localStorage
            loadDataFromStorage();
        } else {
            // Production: subscribe to Firebase
            console.log('🔥 DataContext: Connecting to Firebase...');

            // Subscribe to containers
            const unsubContainers = FirebaseDataService.subscribe('containers', (data) => {
                console.log('🔥 Containers: Received', data.length, 'items');
                setContainers(data.length > 0 ? data : mockContainers);
            });
            unsubscribesRef.current.push(unsubContainers);

            // Subscribe to surveys
            const unsubSurveys = FirebaseDataService.subscribe('surveys', (data) => {
                console.log('🔥 Surveys: Received', data.length, 'items');
                setSurveys(data.length > 0 ? data : mockSurveys);
            });
            unsubscribesRef.current.push(unsubSurveys);

            // Subscribe to EORs
            const unsubEORs = FirebaseDataService.subscribe('eors', (data) => {
                console.log('🔥 EORs: Received', data.length, 'items');
                setEORs(data.length > 0 ? data : mockEORs);
            });
            unsubscribesRef.current.push(unsubEORs);

            // Subscribe to repair orders
            const unsubROs = FirebaseDataService.subscribe('repairOrders', (data) => {
                console.log('🔥 RepairOrders: Received', data.length, 'items');
                setRepairOrders(data.length > 0 ? data : mockRepairOrders);
            });
            unsubscribesRef.current.push(unsubROs);

            // Subscribe to washing orders
            const unsubWashing = FirebaseDataService.subscribe('washingOrders', (data) => {
                console.log('🔥 WashingOrders: Received', data.length, 'items');
                setWashingOrders(data);
            });
            unsubscribesRef.current.push(unsubWashing);

            // Subscribe to shunting
            const unsubShunting = FirebaseDataService.subscribe('shunting', (data) => {
                console.log('🔥 Shunting: Received', data.length, 'items');
                setShunting(data);
            });
            unsubscribesRef.current.push(unsubShunting);

            // Subscribe to preinspections
            const unsubPreinspections = FirebaseDataService.subscribe('preinspections', (data) => {
                console.log('🔥 Preinspections: Received', data.length, 'items');
                setPreinspections(data);
            });
            unsubscribesRef.current.push(unsubPreinspections);

            // Subscribe to stacking
            const unsubStacking = FirebaseDataService.subscribe('stacking', (data) => {
                console.log('🔥 Stacking: Received', data.length, 'items');
                setStacking(data);
            });
            unsubscribesRef.current.push(unsubStacking);

            // Subscribe to audit logs
            const unsubLogs = FirebaseDataService.subscribe('auditLogs', (data) => {
                console.log('🔥 AuditLogs: Received', data.length, 'items');
                setAuditLogs(data.length > 0 ? data : mockAuditLogs);
            });
            unsubscribesRef.current.push(unsubLogs);

            setIsLoading(false);

            // Cleanup subscriptions
            return () => {
                console.log('🔥 DataContext: Unsubscribing from Firebase...');
                unsubscribesRef.current.forEach(unsub => {
                    if (typeof unsub === 'function') unsub();
                });
            };
        }
    }, []);

    // Reload data from localStorage (called after external modifications like Job Monitoring deletes)
    const reloadFromStorage = () => {
        loadDataFromStorage();
    };

    // Persist data to storage (localStorage for demo, Firebase for production)
    useEffect(() => {
        if (!isLoading) {
            if (DEMO_MODE) {
                // Demo mode: save to localStorage
                try {
                    localStorage.setItem('mnr_containers', JSON.stringify(containers));
                } catch (e) {
                    console.warn('Failed to save containers to localStorage:', e.message);
                }

                try {
                    const surveysToSave = surveys.map(s => ({
                        ...s,
                        images: s.images?.slice(0, 5).map((img, idx) => ({
                            ...img,
                            dataUrl: idx < 3 ? img.dataUrl : '[REMOVED DUE TO SIZE]'
                        })) || []
                    }));
                    localStorage.setItem('mnr_surveys', JSON.stringify(surveysToSave));
                } catch (e) {
                    console.warn('Failed to save surveys to localStorage:', e.message);
                    try {
                        const surveysNoImages = surveys.map(s => ({ ...s, images: [] }));
                        localStorage.setItem('mnr_surveys', JSON.stringify(surveysNoImages));
                    } catch (e2) {
                        console.error('Cannot save surveys at all:', e2.message);
                    }
                }

                try {
                    localStorage.setItem('mnr_eors', JSON.stringify(eors));
                } catch (e) {
                    console.warn('Failed to save EORs to localStorage:', e.message);
                }

                try {
                    localStorage.setItem('mnr_repair_orders', JSON.stringify(repairOrders));
                } catch (e) {
                    console.warn('Failed to save repair orders to localStorage:', e.message);
                }

                try {
                    localStorage.setItem('mnr_washing_orders', JSON.stringify(washingOrders));
                } catch (e) {
                    console.warn('Failed to save washing orders to localStorage:', e.message);
                }

                try {
                    const logsToSave = auditLogs.slice(0, 500);
                    localStorage.setItem('mnr_audit_logs', JSON.stringify(logsToSave));
                } catch (e) {
                    console.warn('Failed to save audit logs to localStorage:', e.message);
                }
            } else {
                // Production: save to Firebase
                // Note: Firebase updates are handled individually in each operation
                // This batch save is for consistency and backup
                FirebaseDataService.saveAll('containers', containers);

                // For surveys, remove large images before saving to Firebase
                const surveysToSave = surveys.map(s => ({
                    ...s,
                    images: s.images?.slice(0, 3).map(img => ({
                        ...img,
                        dataUrl: img.dataUrl?.substring(0, 1000) || '' // Truncate large images
                    })) || []
                }));
                FirebaseDataService.saveAll('surveys', surveysToSave);

                FirebaseDataService.saveAll('eors', eors);
                FirebaseDataService.saveAll('repairOrders', repairOrders);
                FirebaseDataService.saveAll('washingOrders', washingOrders);
                FirebaseDataService.saveAll('shunting', shunting);
                FirebaseDataService.saveAll('preinspections', preinspections);
                FirebaseDataService.saveAll('stacking', stacking);
                FirebaseDataService.saveAll('auditLogs', auditLogs.slice(0, 500));
            }
        }
    }, [containers, surveys, eors, repairOrders, washingOrders, shunting, preinspections, stacking, auditLogs, isLoading]);

    // Add audit log entry
    const addAuditLog = (entityType, entityId, action, userId, details = {}, oldValue = null, newValue = null) => {
        const log = {
            id: `log${Date.now()}`,
            entityType,
            entityId,
            action,
            userId,
            timestamp: new Date().toISOString(),
            details,
            oldValue,
            newValue
        };
        setAuditLogs(prev => [log, ...prev]);
        return log;
    };

    // Container operations
    const getContainer = (id) => containers.find(c => c.id === id);
    const getContainerByNumber = (number) => containers.find(c => c.containerNumber === number);

    const updateContainer = (id, updates, userId) => {
        setContainers(prev => prev.map(c => {
            if (c.id === id) {
                const updated = { ...c, ...updates };
                if (updates.status && updates.status !== c.status) {
                    addAuditLog('CONTAINER', id, AUDIT_ACTIONS.STATUS_CHANGE, userId,
                        { containerNumber: c.containerNumber }, c.status, updates.status);
                }
                return updated;
            }
            return c;
        }));
    };

    const searchContainers = (query) => {
        const q = query.toLowerCase();
        return containers.filter(c =>
            c.containerNumber.toLowerCase().includes(q) ||
            (c.booking && c.booking.toLowerCase().includes(q)) ||
            (c.yardLocation && `${c.yardLocation.block}${c.yardLocation.row}`.toLowerCase().includes(q))
        );
    };

    // Register a new container
    const registerContainer = (containerData, userId) => {
        const id = generateId('CTR');
        const newContainer = {
            id,
            containerNumber: containerData.containerNumber,
            liner: containerData.liner,
            size: containerData.size,
            type: containerData.type,
            status: containerData.status || 'DM',
            sequence: 1,
            gateInDate: new Date().toISOString(),
            yardLocation: { block: 'A', row: '01', tier: '1' },
            createdBy: userId,
            createdAt: new Date().toISOString()
        };
        setContainers(prev => [newContainer, ...prev]);
        addAuditLog('CONTAINER', id, AUDIT_ACTIONS.CREATE, userId, { containerNumber: containerData.containerNumber });
        return newContainer;
    };


    // Survey operations
    const getSurvey = (id) => surveys.find(s => s.id === id);
    const getSurveysByContainer = (containerId) => surveys.filter(s => s.containerId === containerId);

    const createSurvey = (surveyData, userId) => {
        const id = generateTransactionId(surveyData.containerNumber);
        const survey = {
            ...surveyData,
            id,
            status: surveyData.status || 'DRAFT', // Preserve status if already set
            createdBy: userId,
            createdAt: new Date().toISOString(),
            damageItems: surveyData.damageItems || [],
            images: surveyData.images || [],
            attachments: surveyData.attachments || []
        };
        setSurveys(prev => [survey, ...prev]);
        addAuditLog('SURVEY', id, AUDIT_ACTIONS.CREATE, userId, { containerNumber: surveyData.containerNumber });

        // Update container's lastSurveyId if survey is completed
        if (survey.status === 'COMPLETED' && survey.containerId) {
            updateContainer(survey.containerId, { lastSurveyId: id }, userId);
        }

        return survey;
    };

    const updateSurvey = (id, updates, userId) => {
        setSurveys(prev => prev.map(s => {
            if (s.id === id) {
                const updated = { ...s, ...updates, updatedAt: new Date().toISOString(), updatedBy: userId };
                if (updates.status && updates.status !== s.status) {
                    addAuditLog('SURVEY', id, AUDIT_ACTIONS.STATUS_CHANGE, userId, {}, s.status, updates.status);
                } else {
                    addAuditLog('SURVEY', id, AUDIT_ACTIONS.UPDATE, userId, { fields: Object.keys(updates) });
                }
                return updated;
            }
            return s;
        }));
    };

    const completeSurvey = (id, userId) => {
        const survey = getSurvey(id);
        if (!survey) return { success: false, error: 'Survey not found' };

        // Validation
        if (!survey.initialCondition) {
            return { success: false, error: 'Initial condition is required' };
        }
        if (!survey.surveyType) {
            return { success: false, error: 'Survey type is required' };
        }
        if (survey.initialCondition === 'DAMAGED' && (!survey.damageItems || survey.damageItems.length === 0)) {
            return { success: false, error: 'At least one damage item is required when condition is "Damaged"' };
        }

        updateSurvey(id, {
            status: 'COMPLETED',
            completedBy: userId,
            completedAt: new Date().toISOString()
        }, userId);

        // Update container's lastSurveyId
        if (survey.containerId) {
            updateContainer(survey.containerId, { lastSurveyId: id }, userId);
        }

        return { success: true };
    };

    // EOR operations
    const getEOR = (id) => eors.find(e => e.id === id);
    const getEORsByContainer = (containerId) => eors.filter(e => e.containerId === containerId);
    const getEORsBySurvey = (surveyId) => eors.filter(e => e.surveyId === surveyId);

    const createEOR = (eorData, userId) => {
        const id = generateTransactionId(eorData.containerNumber);

        // Calculate total cost
        const totalCost = (eorData.repairItems || []).reduce((sum, item) => sum + (item.lineTotal || 0), 0);

        // Determine if auto-approval applies (using configurable threshold)
        const threshold = getAutoApprovalThreshold();
        const needApproval = totalCost > threshold;
        const autoApproved = !needApproval;

        const eor = {
            ...eorData,
            id,
            version: 1,
            status: autoApproved ? 'APPROVED_AUTO' : 'DRAFT',
            totalCost,
            currency: CONFIG.DEFAULT_CURRENCY,
            needApproval,
            autoApproved,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            repairItems: eorData.repairItems || [],
            images: []
        };

        setEORs(prev => [eor, ...prev]);
        addAuditLog('EOR', id, AUDIT_ACTIONS.CREATE, userId, { totalCost, autoApproved });

        if (autoApproved) {
            addAuditLog('EOR', id, AUDIT_ACTIONS.APPROVE, 'SYSTEM', {
                reason: `Auto-approved: Total ${totalCost} RM <= ${threshold} RM threshold`
            });
            // Auto-approved EOR: Update container to AR status
            if (eorData.containerId) {
                updateContainer(eorData.containerId, {
                    status: 'AR',
                    arStartTime: new Date().toISOString(),
                    lastEorId: id
                }, userId);
            }
        } else {
            // Not auto-approved: just update lastEorId
            if (eorData.containerId) {
                updateContainer(eorData.containerId, { lastEorId: id }, userId);
            }
        }

        return eor;
    };

    const updateEOR = (id, updates, userId) => {
        setEORs(prev => prev.map(e => {
            if (e.id === id) {
                let newTotalCost = e.totalCost;
                if (updates.repairItems) {
                    newTotalCost = updates.repairItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
                }

                const threshold = getAutoApprovalThreshold();
                const needApproval = newTotalCost > threshold;

                const updated = {
                    ...e,
                    ...updates,
                    totalCost: newTotalCost,
                    needApproval,
                    updatedAt: new Date().toISOString(),
                    updatedBy: userId
                };

                addAuditLog('EOR', id, AUDIT_ACTIONS.UPDATE, userId, { fields: Object.keys(updates) });
                return updated;
            }
            return e;
        }));
    };

    const sendEOR = (id, recipient, method, userId) => {
        const eor = getEOR(id);
        if (!eor) return { success: false, error: 'EOR not found' };

        updateEOR(id, {
            status: 'PENDING',
            sentAt: new Date().toISOString(),
            sentBy: userId,
            sentTo: recipient,
            sentMethod: method
        }, userId);

        addAuditLog('EOR', id, AUDIT_ACTIONS.SEND, userId, { recipient, method });
        return { success: true };
    };

    const approveEOR = (id, approvalData, userId) => {
        const eor = getEOR(id);
        const isRejected = approvalData.status === 'REJECTED';

        updateEOR(id, {
            status: approvalData.status || 'APPROVED',
            approvedAt: new Date().toISOString(),
            approvedBy: approvalData.approvedBy || userId,
            approvalNotes: approvalData.notes
        }, userId);

        if (eor && eor.containerId) {
            if (isRejected) {
                // EOR REJECTED: Revert container to DM so user can create new survey
                updateContainer(eor.containerId, {
                    status: 'DM',
                    lastEorId: id,
                    rejectedAt: new Date().toISOString()
                }, userId);
                addAuditLog('EOR', id, AUDIT_ACTIONS.REJECT, userId, approvalData);
            } else {
                // EOR APPROVED: Update container status to AR (Awaiting Repair)
                updateContainer(eor.containerId, {
                    status: 'AR',
                    arStartTime: new Date().toISOString()
                }, userId);
                addAuditLog('EOR', id, AUDIT_ACTIONS.APPROVE, userId, approvalData);
            }
        }

        return { success: true };
    };

    // Repair Order operations
    const getRepairOrder = (id) => repairOrders.find(r => r.id === id);
    const getROsByContainer = (containerId) => repairOrders.filter(r => r.containerId === containerId);

    const createRepairOrder = (roData, userId) => {
        // Check for shunting request - only need to have a shunting request (any status) to create repair order
        const shuntingData = JSON.parse(localStorage.getItem('mnr_shunting') || '[]');
        const hasShuntingRequest = shuntingData.find(s =>
            (s.containerId === roData.containerId || s.containerNumber === roData.containerNumber)
        );

        if (!hasShuntingRequest) {
            return {
                success: false,
                error: `Container ${roData.containerNumber} must have a Shunting request before creating Repair Order`,
                requiresShunting: true
            };
        }

        // Check for existing active RO for the same container
        const existingRO = repairOrders.find(r =>
            r.containerId === roData.containerId &&
            !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(r.status)
        );

        if (existingRO) {
            return {
                success: false,
                error: `Container ${roData.containerNumber} already has an active Repair Order (${existingRO.id})`,
                existingRO
            };
        }

        // Use Survey's Transaction ID as the Repair Order ID for workflow consistency
        // Fall back to generating new ID if surveyId not available
        const id = roData.surveyId || generateTransactionId(roData.containerNumber);
        const ro = {
            ...roData,
            id,
            surveyId: roData.surveyId, // Store surveyId for reference
            status: 'NEW',
            createdBy: userId,
            createdAt: new Date().toISOString(),
            workItems: roData.workItems || []
        };
        setRepairOrders(prev => [ro, ...prev]);
        addAuditLog('REPAIR_ORDER', id, AUDIT_ACTIONS.CREATE, userId, { eorId: roData.eorId });
        return { success: true, ro };
    };

    const updateRepairOrder = (id, updates, userId) => {
        setRepairOrders(prev => prev.map(r => {
            if (r.id === id) {
                const updated = { ...r, ...updates, updatedAt: new Date().toISOString(), updatedBy: userId };
                if (updates.status && updates.status !== r.status) {
                    addAuditLog('REPAIR_ORDER', id, AUDIT_ACTIONS.STATUS_CHANGE, userId, {}, r.status, updates.status);
                }
                return updated;
            }
            return r;
        }));
    };

    // Washing Order operations
    const getWashingOrder = (id) => washingOrders.find(w => w.id === id);
    const getWashingOrdersByContainer = (containerId) => washingOrders.filter(w => w.containerId === containerId);

    const createWashingOrder = (washingData, userId) => {
        const id = `WO-${generateTransactionId(washingData.containerNumber)}`;
        const wo = {
            id,
            containerId: washingData.containerId,
            containerNumber: washingData.containerNumber,
            containerType: washingData.containerType,
            liner: washingData.liner,

            // Initial Inspection
            contaminationLevel: washingData.contaminationLevel,
            interiorCondition: washingData.interiorCondition || [],
            exteriorCondition: washingData.exteriorCondition || [],
            odorPresent: washingData.odorPresent || false,
            pestPresent: washingData.pestPresent || false,
            hazardousResidues: washingData.hazardousResidues || false,
            inspectionNotes: washingData.inspectionNotes || '',
            inspectedBy: userId,
            inspectedAt: new Date().toISOString(),

            // Assignment (to be filled during scheduling)
            cleaningProgram: washingData.cleaningProgram,
            assignedBay: washingData.assignedBay || null,
            assignedWorker: washingData.assignedWorker || null,
            assignedTeam: washingData.assignedTeam || null,
            scheduledAt: washingData.scheduledAt || null,
            safetyNotes: washingData.safetyNotes || '',
            safetyRequirements: washingData.safetyRequirements || [],

            // Execution
            status: 'PENDING_SCHEDULE',
            startedAt: null,
            completedAt: null,
            checklistResults: {},
            workerNotes: '',
            photos: [],
            damagesFound: [],
            elapsedMinutes: 0,

            // QC
            qcInspectedBy: null,
            qcInspectedAt: null,
            qcResult: null,
            qcNotes: '',
            qcChecklistResults: {},
            reworkCount: 0,

            // Certificate
            certificateNumber: null,
            certificateIssuedAt: null,
            cost: washingData.cost || 0,

            // Meta
            createdBy: userId,
            createdAt: new Date().toISOString()
        };

        setWashingOrders(prev => [wo, ...prev]);
        addAuditLog('WASHING_ORDER', id, AUDIT_ACTIONS.CREATE, userId, {
            containerNumber: washingData.containerNumber,
            cleaningProgram: washingData.cleaningProgram
        });

        // Update container status
        if (washingData.containerId) {
            updateContainer(washingData.containerId, { status: 'PENDING_CLEAN' }, userId);
        }

        return wo;
    };

    // Approve washing order (supervisor only)
    const approveWashingOrder = (id, approvedBy) => {
        const wo = getWashingOrder(id);
        if (!wo) return;
        updateWashingOrder(id, {
            status: 'PENDING_SCHEDULE',
            approvedBy,
            approvedAt: new Date().toISOString()
        }, approvedBy);
        addAuditLog('WASHING_ORDER', id, 'APPROVE', approvedBy, { status: 'PENDING_APPROVAL' }, { status: 'PENDING_SCHEDULE' });
    };

    // Reject washing order
    const rejectWashingOrder = (id, rejectedBy, reason) => {
        const wo = getWashingOrder(id);
        if (!wo) return;
        updateWashingOrder(id, {
            status: 'REJECTED',
            rejectedBy,
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason
        }, rejectedBy);
        addAuditLog('WASHING_ORDER', id, 'REJECT', rejectedBy, { status: 'PENDING_APPROVAL' }, { status: 'REJECTED', reason });
    };

    const updateWashingOrder = (id, updates, userId) => {
        setWashingOrders(prev => prev.map(w => {
            if (w.id === id) {
                const updated = { ...w, ...updates, updatedAt: new Date().toISOString(), updatedBy: userId };
                if (updates.status && updates.status !== w.status) {
                    addAuditLog('WASHING_ORDER', id, AUDIT_ACTIONS.STATUS_CHANGE, userId, {}, w.status, updates.status);
                }
                return updated;
            }
            return w;
        }));
    };

    const scheduleWashingOrder = (id, scheduleData, userId) => {
        updateWashingOrder(id, {
            status: 'SCHEDULED',
            assignedBay: scheduleData.assignedBay,
            assignedWorker: scheduleData.assignedWorker,
            assignedTeam: scheduleData.assignedTeam,
            scheduledAt: scheduleData.scheduledAt,
            safetyNotes: scheduleData.safetyNotes,
            safetyRequirements: scheduleData.safetyRequirements || []
        }, userId);

        addAuditLog('WASHING_ORDER', id, 'SCHEDULE', userId, scheduleData);
    };

    const startWashingOrder = (id, userId) => {
        const wo = getWashingOrder(id);
        if (wo && wo.containerId) {
            updateContainer(wo.containerId, { status: 'CLEANING' }, userId);
        }
        updateWashingOrder(id, {
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString()
        }, userId);
    };

    const completeWashingOrder = (id, completionData, userId) => {
        updateWashingOrder(id, {
            status: 'PENDING_QC',
            completedAt: new Date().toISOString(),
            checklistResults: completionData.checklistResults,
            workerNotes: completionData.workerNotes,
            photos: completionData.photos || [],
            damagesFound: completionData.damagesFound || [],
            elapsedMinutes: completionData.elapsedMinutes
        }, userId);
    };

    const qcWashingOrder = (id, qcData, userId) => {
        const wo = getWashingOrder(id);
        const isPassed = qcData.result === 'PASS';

        if (isPassed) {
            // Generate certificate number
            const certNumber = `CLN-${new Date().getFullYear()}-${String(washingOrders.filter(w => w.certificateNumber).length + 1).padStart(6, '0')}`;

            updateWashingOrder(id, {
                status: 'COMPLETED',
                qcInspectedBy: userId,
                qcInspectedAt: new Date().toISOString(),
                qcResult: 'PASS',
                qcNotes: qcData.notes,
                qcChecklistResults: qcData.checklistResults,
                certificateNumber: certNumber,
                certificateIssuedAt: new Date().toISOString()
            }, userId);

            // Update container status
            if (wo && wo.containerId) {
                updateContainer(wo.containerId, { status: 'AVAILABLE' }, userId);
            }

            addAuditLog('WASHING_ORDER', id, 'QC_PASS', userId, { certificateNumber: certNumber });
        } else {
            // QC Failed - needs rework
            updateWashingOrder(id, {
                status: 'REWORK',
                qcInspectedBy: userId,
                qcInspectedAt: new Date().toISOString(),
                qcResult: 'FAIL',
                qcNotes: qcData.notes,
                qcChecklistResults: qcData.checklistResults,
                reworkCount: (wo?.reworkCount || 0) + 1,
                reworkReasons: qcData.reworkReasons || []
            }, userId);

            addAuditLog('WASHING_ORDER', id, 'QC_FAIL', userId, { reasons: qcData.reworkReasons });
        }
    };

    // Statistics
    const getContainerStats = () => {
        const stats = {
            total: containers.length,
            byStatus: {}
        };
        containers.forEach(c => {
            stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
        });
        return stats;
    };

    const getEORStats = () => {
        const pending = eors.filter(e => e.status === 'PENDING' || e.status === 'SENT').length;
        const approved = eors.filter(e => e.status.includes('APPROVED')).length;
        const draft = eors.filter(e => e.status === 'DRAFT').length;
        const totalValue = eors.reduce((sum, e) => sum + (e.totalCost || 0), 0);
        return { pending, approved, draft, totalValue, total: eors.length };
    };


    // Reset data to mock data
    const resetData = () => {
        setContainers(mockContainers);
        setSurveys(mockSurveys);
        setEORs(mockEORs);
        setRepairOrders(mockRepairOrders);
        setWashingOrders([]);
        setAuditLogs(mockAuditLogs);
    };

    // Sync containers with approved EORs to AR status (data migration)
    const syncApprovedEORsToAR = () => {
        const approvedEORs = eors.filter(e =>
            e.status === 'APPROVED' ||
            e.status === 'APPROVED_AUTO' ||
            e.status === 'APPROVED_AMENDED'
        );

        let updated = 0;
        approvedEORs.forEach(eor => {
            // Match by containerId OR containerNumber
            const container = containers.find(c =>
                c.id === eor.containerId ||
                c.containerNumber === eor.containerNumber
            );
            if (container && container.status !== 'AR' && container.status !== 'REPAIR' && container.status !== 'COMPLETED') {
                updateContainer(container.id, {
                    status: 'AR',
                    arStartTime: eor.approvedAt || new Date().toISOString()
                }, 'SYSTEM');
                updated++;
            }
        });

        return updated;
    };

    const value = {
        // Data
        containers,
        surveys,
        eors,
        repairOrders,
        washingOrders,
        shunting,
        preinspections,
        stacking,
        auditLogs,
        isLoading,

        // Container operations
        getContainer,
        getContainerByNumber,
        updateContainer,
        searchContainers,
        registerContainer,

        // Survey operations
        getSurvey,
        getSurveysByContainer,
        createSurvey,
        updateSurvey,
        completeSurvey,

        // EOR operations
        getEOR,
        getEORsByContainer,
        getEORsBySurvey,
        createEOR,
        updateEOR,
        sendEOR,
        approveEOR,

        // Repair Order operations
        getRepairOrder,
        getROsByContainer,
        createRepairOrder,
        updateRepairOrder,

        // Washing Order operations
        getWashingOrder,
        getWashingOrdersByContainer,
        createWashingOrder,
        updateWashingOrder,
        approveWashingOrder,
        rejectWashingOrder,
        scheduleWashingOrder,
        startWashingOrder,
        completeWashingOrder,
        qcWashingOrder,

        // Audit
        addAuditLog,

        // Statistics
        getContainerStats,
        getEORStats,

        // Utils
        resetData,
        generateId,
        generateTransactionId,
        syncApprovedEORsToAR,

        // Reload from localStorage (for cross-component sync)
        reloadFromStorage,

        // Direct state setters (for Job Monitoring sync)
        setSurveys,
        setEORs,
        setRepairOrders,
        setContainers,
        setWashingOrders,
        setShunting,
        setPreinspections,
        setStacking
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
