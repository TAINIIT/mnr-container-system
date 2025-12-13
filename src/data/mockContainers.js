import { CONTAINER_STATUS } from '../config/constants';

// Common liner codes
const LINERS = ['MSC', 'MSK', 'CMA', 'HPL', 'ONE', 'EVG', 'YML', 'PIL', 'ZIM', 'CSL',
    'HMM', 'WHL', 'TSL', 'EMC', 'APL', 'HAL', 'NKY', 'SUD', 'SAF', 'GCL'];

// Container sizes
const SIZES = ['20GP', '40GP', '40HC', '45HC', '20RF', '40RF'];

// Generate 20 fresh containers with STACKING status
export const mockContainers = [
    {
        id: 'c001',
        containerNumber: 'MSCU1234567',
        sequence: 1,
        size: '40HC',
        liner: 'MSC',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T08:00:00',
        yardLocation: { block: 'A', row: 1, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c002',
        containerNumber: 'MSKU8765432',
        sequence: 1,
        size: '20GP',
        liner: 'MSK',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T08:15:00',
        yardLocation: { block: 'A', row: 2, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c003',
        containerNumber: 'CMAU5551234',
        sequence: 1,
        size: '40GP',
        liner: 'CMA',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T08:30:00',
        yardLocation: { block: 'A', row: 3, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c004',
        containerNumber: 'HLCU9871234',
        sequence: 1,
        size: '40HC',
        liner: 'HPL',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T08:45:00',
        yardLocation: { block: 'A', row: 4, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c005',
        containerNumber: 'OOLU4567890',
        sequence: 1,
        size: '20GP',
        liner: 'ONE',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T09:00:00',
        yardLocation: { block: 'A', row: 5, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c006',
        containerNumber: 'EGHU2223334',
        sequence: 1,
        size: '40GP',
        liner: 'EVG',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T09:15:00',
        yardLocation: { block: 'B', row: 1, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c007',
        containerNumber: 'YMLU6667778',
        sequence: 1,
        size: '45HC',
        liner: 'YML',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T09:30:00',
        yardLocation: { block: 'B', row: 2, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c008',
        containerNumber: 'PCIU1112223',
        sequence: 1,
        size: '20RF',
        liner: 'PIL',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T09:45:00',
        yardLocation: { block: 'B', row: 3, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c009',
        containerNumber: 'ZIMU8889990',
        sequence: 1,
        size: '40RF',
        liner: 'ZIM',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T10:00:00',
        yardLocation: { block: 'B', row: 4, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c010',
        containerNumber: 'CSLU3334445',
        sequence: 1,
        size: '40HC',
        liner: 'CSL',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T10:15:00',
        yardLocation: { block: 'B', row: 5, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c011',
        containerNumber: 'HMMU4445556',
        sequence: 1,
        size: '40GP',
        liner: 'HMM',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T10:30:00',
        yardLocation: { block: 'C', row: 1, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c012',
        containerNumber: 'WHLU5556667',
        sequence: 1,
        size: '20GP',
        liner: 'WHL',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T10:45:00',
        yardLocation: { block: 'C', row: 2, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c013',
        containerNumber: 'TSLU6667778',
        sequence: 1,
        size: '40HC',
        liner: 'TSL',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T11:00:00',
        yardLocation: { block: 'C', row: 3, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c014',
        containerNumber: 'EMCU7778889',
        sequence: 1,
        size: '40GP',
        liner: 'EMC',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T11:15:00',
        yardLocation: { block: 'C', row: 4, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c015',
        containerNumber: 'APLU8889990',
        sequence: 1,
        size: '45HC',
        liner: 'APL',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T11:30:00',
        yardLocation: { block: 'C', row: 5, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c016',
        containerNumber: 'HALU9990001',
        sequence: 1,
        size: '20GP',
        liner: 'HAL',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T11:45:00',
        yardLocation: { block: 'D', row: 1, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c017',
        containerNumber: 'NKYU1112223',
        sequence: 1,
        size: '40HC',
        liner: 'NKY',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T12:00:00',
        yardLocation: { block: 'D', row: 2, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c018',
        containerNumber: 'SUDU2223334',
        sequence: 1,
        size: '40GP',
        liner: 'SUD',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T12:15:00',
        yardLocation: { block: 'D', row: 3, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c019',
        containerNumber: 'SAFU3334445',
        sequence: 1,
        size: '20RF',
        liner: 'SAF',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T12:30:00',
        yardLocation: { block: 'D', row: 4, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    },
    {
        id: 'c020',
        containerNumber: 'GCLU4445556',
        sequence: 1,
        size: '40RF',
        liner: 'GCL',
        status: CONTAINER_STATUS.STACKING,
        gateInDate: '2024-12-07T12:45:00',
        yardLocation: { block: 'D', row: 5, tier: 1 },
        booking: null,
        lastSurveyId: null,
        lastEorId: null
    }
];

// Empty mock data - fresh start
export const mockSurveys = [];
export const mockEORs = [];
export const mockRepairOrders = [];
export const mockAuditLogs = [];
