// Script to create test data with 2 containers per workflow stage
// 9 stages: Stacking → Washing → Survey → EOR → Approval → Repair → Shunting → QC → Release

const testData = {
    // Containers for different stages
    containers: [
        // Stage 1: STACKING (2 containers)
        { id: 'CTR-001', containerNumber: 'MSKU1234567', liner: 'MSC', size: '40', type: 'HC', status: 'STACKING', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'A', row: '01', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-002', containerNumber: 'MSKU2234567', liner: 'MSC', size: '20', type: 'GP', status: 'STACKING', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'A', row: '02', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },

        // Stage 2: PENDING_WASH (for washing - 2 containers)
        { id: 'CTR-003', containerNumber: 'APLU3334567', liner: 'APL', size: '40', type: 'HC', status: 'PENDING_WASH', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'B', row: '01', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-004', containerNumber: 'APLU4434567', liner: 'APL', size: '20', type: 'GP', status: 'WASHING', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'B', row: '02', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },

        // Stage 3: DM for Survey (2 containers)  
        { id: 'CTR-005', containerNumber: 'HLCU5534567', liner: 'HPL', size: '40', type: 'HC', status: 'DM', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'C', row: '01', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-006', containerNumber: 'HLCU6634567', liner: 'HPL', size: '20', type: 'GP', status: 'DM', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'C', row: '02', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },

        // Stage 5: AR for EOR/Approval (4 containers - 2 for EOR phase, 2 for Approval phase)
        { id: 'CTR-007', containerNumber: 'CMAU7734567', liner: 'CMA', size: '40', type: 'HC', status: 'AR', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'D', row: '01', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-008', containerNumber: 'CMAU8834567', liner: 'CMA', size: '20', type: 'GP', status: 'AR', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'D', row: '02', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-009', containerNumber: 'OOLU9934567', liner: 'ONE', size: '40', type: 'HC', status: 'AR', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'D', row: '03', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-010', containerNumber: 'OOLU0034567', liner: 'ONE', size: '20', type: 'GP', status: 'AR', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'D', row: '04', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },

        // Stage 6: REPAIR (2 containers)
        { id: 'CTR-011', containerNumber: 'YMLU1134567', liner: 'YML', size: '40', type: 'HC', status: 'REPAIR', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'R', row: '01', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-012', containerNumber: 'YMLU1234567', liner: 'YML', size: '20', type: 'GP', status: 'REPAIR', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'R', row: '02', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },

        // Stage 7-9: More containers for Shunting, QC, Release
        { id: 'CTR-013', containerNumber: 'EGHU1334567', liner: 'EVG', size: '40', type: 'HC', status: 'REPAIR', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'R', row: '03', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-014', containerNumber: 'EGHU1434567', liner: 'EVG', size: '20', type: 'GP', status: 'REPAIR', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'R', row: '04', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-015', containerNumber: 'TCLU1534567', liner: 'TSL', size: '40', type: 'HC', status: 'AV', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'S', row: '01', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-016', containerNumber: 'TCLU1634567', liner: 'TSL', size: '20', type: 'GP', status: 'AV', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'S', row: '02', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-017', containerNumber: 'SEGU1734567', liner: 'SAF', size: '40', type: 'HC', status: 'AV', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'S', row: '03', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'CTR-018', containerNumber: 'SEGU1834567', liner: 'SAF', size: '20', type: 'GP', status: 'AV', sequence: 1, gateInDate: new Date().toISOString(), yardLocation: { block: 'S', row: '04', tier: '1' }, createdBy: 'ADMIN', createdAt: new Date().toISOString() }
    ],

    // Stage 2: Washing orders (2 orders - PENDING_SCHEDULE, IN_PROGRESS)
    washingOrders: [
        { id: 'WSH-001', containerId: 'CTR-003', containerNumber: 'APLU3334567', liner: 'APL', status: 'PENDING_SCHEDULE', program: 'STANDARD', createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'WSH-002', containerId: 'CTR-004', containerNumber: 'APLU4434567', liner: 'APL', status: 'IN_PROGRESS', program: 'HEAVY', bay: 'BAY-1', createdBy: 'ADMIN', createdAt: new Date().toISOString(), startedAt: new Date().toISOString() }
    ],

    // Stage 3: Surveys (2 surveys - DRAFT, IN_PROGRESS)
    surveys: [
        { id: 'SRV-001', containerId: 'CTR-005', containerNumber: 'HLCU5534567', liner: 'HPL', surveyType: 'FULL', status: 'DRAFT', initialCondition: 'DAMAGED', createdBy: 'ADMIN', createdAt: new Date().toISOString(), damageItems: [] },
        { id: 'SRV-002', containerId: 'CTR-006', containerNumber: 'HLCU6634567', liner: 'HPL', surveyType: 'PERIODIC', status: 'IN_PROGRESS', initialCondition: 'DAMAGED', createdBy: 'ADMIN', createdAt: new Date().toISOString(), damageItems: [{ id: 'DMG-001', location: 'LEFT_SIDE', component: 'PANEL', damageType: 'DENT', severity: 'MINOR', quantity: 1, repairMethod: 'STRAIGHTEN', estimatedCost: 50 }] }
    ],

    // Stage 4: EORs Draft/Sent (2 EORs - DRAFT status)
    // Stage 5: EORs Pending approval (2 EORs - PENDING status)
    eors: [
        // EOR stage (DRAFT/SENT)
        { id: 'EOR-001', containerId: 'CTR-007', containerNumber: 'CMAU7734567', liner: 'CMA', surveyId: 'SRV-003', status: 'DRAFT', totalCost: 250, items: [{ description: 'Panel repair', cost: 250 }], createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'EOR-002', containerId: 'CTR-008', containerNumber: 'CMAU8834567', liner: 'CMA', surveyId: 'SRV-004', status: 'SENT', totalCost: 180, items: [{ description: 'Dent repair', cost: 180 }], createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        // Approval stage (PENDING)
        { id: 'EOR-003', containerId: 'CTR-009', containerNumber: 'OOLU9934567', liner: 'ONE', surveyId: 'SRV-005', status: 'PENDING', totalCost: 450, items: [{ description: 'Major repair', cost: 450 }], createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'EOR-004', containerId: 'CTR-010', containerNumber: 'OOLU0034567', liner: 'ONE', surveyId: 'SRV-006', status: 'PENDING', totalCost: 320, items: [{ description: 'Corner repair', cost: 320 }], createdBy: 'ADMIN', createdAt: new Date().toISOString() }
    ],

    // Stage 6: Repair Orders (2 orders - NEW, IN_PROGRESS)
    repairOrders: [
        { id: 'RO-001', containerId: 'CTR-011', containerNumber: 'YMLU1134567', liner: 'YML', eorId: 'EOR-005', status: 'NEW', totalCost: 550, createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'RO-002', containerId: 'CTR-012', containerNumber: 'YMLU1234567', liner: 'YML', eorId: 'EOR-006', status: 'IN_PROGRESS', totalCost: 280, team: 'TEAM_A', startedAt: new Date().toISOString(), createdBy: 'ADMIN', createdAt: new Date().toISOString() }
    ],

    // Stage 7: Shunting requests (2 requests - PENDING, DISPATCHED)
    shuntingRequests: [
        { id: 'SHU-001', containerId: 'CTR-013', containerNumber: 'EGHU1334567', liner: 'EVG', fromBlock: 'R-03', toBlock: 'QC-01', status: 'PENDING', priority: 'HIGH', createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'SHU-002', containerId: 'CTR-014', containerNumber: 'EGHU1434567', liner: 'EVG', fromBlock: 'R-04', toBlock: 'QC-02', status: 'DISPATCHED', priority: 'NORMAL', driver: 'DRV-001', createdBy: 'ADMIN', createdAt: new Date().toISOString() }
    ],

    // Stage 8: Pre-Inspections/QC (2 inspections - PENDING result)
    preinspections: [
        { id: 'INS-001', containerId: 'CTR-015', containerNumber: 'TCLU1534567', liner: 'TSL', repairOrderId: 'RO-003', status: 'SCHEDULED', result: 'PENDING', scheduledDate: new Date().toISOString(), createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'INS-002', containerId: 'CTR-016', containerNumber: 'TCLU1634567', liner: 'TSL', repairOrderId: 'RO-004', status: 'SCHEDULED', result: 'PENDING', scheduledDate: new Date().toISOString(), createdBy: 'ADMIN', createdAt: new Date().toISOString() }
    ],

    // Stage 9: Stacking/Release (2 requests - COMPLETED)
    stackingRequests: [
        { id: 'STK-001', containerId: 'CTR-017', containerNumber: 'SEGU1734567', liner: 'SAF', targetLocation: 'S-03-01', status: 'COMPLETED', completedAt: new Date().toISOString(), createdBy: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'STK-002', containerId: 'CTR-018', containerNumber: 'SEGU1834567', liner: 'SAF', targetLocation: 'S-04-01', status: 'COMPLETED', completedAt: new Date().toISOString(), createdBy: 'ADMIN', createdAt: new Date().toISOString() }
    ]
};

// Output as JSON for browser console injection
console.log('=== TEST DATA FOR DASHBOARD ===');
console.log('Copy and paste the following into browser console:\n');
console.log(`
// Clear existing data
localStorage.clear();

// Inject test data
localStorage.setItem('mnr_containers', '${JSON.stringify(testData.containers)}');
localStorage.setItem('mnr_surveys', '${JSON.stringify(testData.surveys)}');
localStorage.setItem('mnr_eors', '${JSON.stringify(testData.eors)}');
localStorage.setItem('mnr_repair_orders', '${JSON.stringify(testData.repairOrders)}');
localStorage.setItem('mnr_washing', '${JSON.stringify(testData.washingOrders)}');
localStorage.setItem('mnr_shunting', '${JSON.stringify(testData.shuntingRequests)}');
localStorage.setItem('mnr_preinspections', '${JSON.stringify(testData.preinspections)}');
localStorage.setItem('mnr_stacking', '${JSON.stringify(testData.stackingRequests)}');

// Reload page
location.reload();
`);

// Also save the script to a file for easy injection
const fs = require('fs');
const script = `
// Clear existing data
localStorage.clear();

// Inject test data
localStorage.setItem('mnr_containers', '${JSON.stringify(testData.containers)}');
localStorage.setItem('mnr_surveys', '${JSON.stringify(testData.surveys)}');
localStorage.setItem('mnr_eors', '${JSON.stringify(testData.eors)}');
localStorage.setItem('mnr_repair_orders', '${JSON.stringify(testData.repairOrders)}');
localStorage.setItem('mnr_washing', '${JSON.stringify(testData.washingOrders)}');
localStorage.setItem('mnr_shunting', '${JSON.stringify(testData.shuntingRequests)}');
localStorage.setItem('mnr_preinspections', '${JSON.stringify(testData.preinspections)}');
localStorage.setItem('mnr_stacking', '${JSON.stringify(testData.stackingRequests)}');

console.log('Test data injected! Containers:', ${testData.containers.length});
console.log('Expected counts: Stacking=2, Washing=2, Survey=2, EOR=2, Approval=2, Repair=2, Shunting=2, QC=2, Release=2');
`;

fs.writeFileSync('inject_test_data.js', script);
console.log('\nAlso saved to inject_test_data.js');
