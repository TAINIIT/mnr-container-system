// Container Status Constants
export const CONTAINER_STATUS = {
    STACKING: 'STACKING', // Stacking - In Storage (not yet surveyed)
    PENDING_WASH: 'PENDING_WASH', // Pending Washing (before survey)
    WASHING: 'WASHING', // Washing In Progress
    AV: 'AV',       // Available
    DM: 'DM',       // Damaged
    AR: 'AR',       // Awaiting Repair
    REPAIR: 'REPAIR', // Repair in Progress
    COMPLETED: 'COMPLETED', // Repair Completed
    GATE_OUT: 'GATE_OUT' // Gate Out
};

export const CONTAINER_STATUS_LABELS = {
    STACKING: 'Stacking',
    PENDING_WASH: 'Pending Wash',
    WASHING: 'Washing',
    AV: 'Available',
    DM: 'Damaged',
    AR: 'Awaiting Repair',
    REPAIR: 'Repair In Progress',
    COMPLETED: 'Completed',
    GATE_OUT: 'Gate Out'
};

// Survey Status
export const SURVEY_STATUS = {
    DRAFT: 'DRAFT',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED',
    AMEND: 'AMEND'
};

export const SURVEY_STATUS_LABELS = {
    DRAFT: 'Draft',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
    AMEND: 'Amend'
};

// Survey Types
export const SURVEY_TYPES = {
    INBOUND: 'INBOUND',
    OUTBOUND: 'OUTBOUND',
    PERIODIC: 'PERIODIC',
    OTHER: 'OTHER'
};

export const SURVEY_TYPE_LABELS = {
    INBOUND: 'Inbound',
    OUTBOUND: 'Outbound',
    PERIODIC: 'Periodic',
    OTHER: 'Other'
};

// Initial Condition
export const INITIAL_CONDITION = {
    DAMAGED: 'DAMAGED',
    NO_DAMAGE: 'NO_DAMAGE'
};

export const INITIAL_CONDITION_LABELS = {
    DAMAGED: 'Có hư hỏng',
    NO_DAMAGE: 'Không hư hỏng'
};

// EOR Status
export const EOR_STATUS = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    APPROVED_AUTO: 'APPROVED_AUTO',
    APPROVED_AMENDED: 'APPROVED_AMENDED',
    REJECTED: 'REJECTED'
};

export const EOR_STATUS_LABELS = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    PENDING: 'Pending Approval',
    APPROVED: 'Approved',
    APPROVED_AUTO: 'Auto-Approved',
    APPROVED_AMENDED: 'Approved with Amendments',
    REJECTED: 'Rejected'
};

// Repair Order Status
export const RO_STATUS = {
    NEW: 'NEW',
    PLANNED: 'PLANNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED'
};

export const RO_STATUS_LABELS = {
    NEW: 'New',
    PLANNED: 'Planned',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CLOSED: 'Closed',
    CANCELLED: 'Cancelled'
};

// Shunting Request Status
export const SHUNTING_STATUS = {
    NEW: 'NEW',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

// Pre-Inspection Status
export const PREINSPECTION_STATUS = {
    PLANNED: 'PLANNED',
    CONFIRMED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

// Pre-Inspection Result
export const PREINSPECTION_RESULT = {
    ACCEPTED: 'ACCEPTED',
    ACCEPTED_REMARKS: 'ACCEPTED_REMARKS',
    REWORK: 'REWORK'
};

// Configuration Thresholds
export const CONFIG = {
    AUTO_APPROVAL_THRESHOLD: 100, // RM
    DEFAULT_CURRENCY: 'RM',
    DATE_FORMAT: 'DD/MM/YYYY',
    DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
    SURVEY_ID_PREFIX: 'SRV',
    EOR_ID_PREFIX: 'EOR',
    RO_ID_PREFIX: 'RO',
    CONTAINERS_PER_PAGE: 200 // Pagination limit
};

// Repair Methods
export const REPAIR_METHODS = {
    REPAIR: 'REPAIR',
    REPLACE: 'REPLACE',
    STRAIGHTEN: 'STRAIGHTEN',
    WELD: 'WELD',
    CLEAN: 'CLEAN'
};

export const REPAIR_METHOD_LABELS = {
    REPAIR: 'Repair',
    REPLACE: 'Replace',
    STRAIGHTEN: 'Straighten',
    WELD: 'Weld',
    CLEAN: 'Clean'
};

// Audit Action Types
export const AUDIT_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    STATUS_CHANGE: 'STATUS_CHANGE',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT',
    SEND: 'SEND'
};

// File Types Allowed
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const FORBIDDEN_FILE_TYPES = ['application/x-msdownload', 'application/x-executable'];
