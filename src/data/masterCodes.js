// Location Codes - Container Parts
export const LOCATION_CODES = [
    { code: 'FREN', name: 'Front End' },
    { code: 'REEN', name: 'Rear End' },
    { code: 'LSP', name: 'Left Side Panel' },
    { code: 'RSP', name: 'Right Side Panel' },
    { code: 'ROOF', name: 'Roof' },
    { code: 'FLR', name: 'Floor' },
    { code: 'DOOR', name: 'Door' },
    { code: 'UR', name: 'Under Rail' },
    { code: 'CCR', name: 'Corner Casting' },
    { code: 'CFT', name: 'Corner Fitting' },
    { code: 'FORK', name: 'Forklift Pocket' },
    { code: 'SEAL', name: 'Door Seal' },
    { code: 'LOCK', name: 'Lock Rod' }
];

// Damage Type Codes
export const DAMAGE_CODES = [
    { code: 'DT', name: 'Dent' },
    { code: 'HL', name: 'Hole' },
    { code: 'CR', name: 'Crack' },
    { code: 'BT', name: 'Bent' },
    { code: 'CT', name: 'Cut' },
    { code: 'RS', name: 'Rust' },
    { code: 'MS', name: 'Missing' },
    { code: 'BK', name: 'Broken' },
    { code: 'SC', name: 'Scratched' },
    { code: 'TN', name: 'Torn' },
    { code: 'WT', name: 'Wet' },
    { code: 'DR', name: 'Dirty' },
    { code: 'LP', name: 'Leaking' },
    { code: 'OD', name: 'Odor' }
];

// Repair Action Codes
export const REPAIR_CODES = [
    { code: 'RP', name: 'Repair', laborHours: 1 },
    { code: 'RL', name: 'Replace', laborHours: 2 },
    { code: 'ST', name: 'Straighten', laborHours: 0.5 },
    { code: 'WD', name: 'Weld', laborHours: 1.5 },
    { code: 'PT', name: 'Paint', laborHours: 0.5 },
    { code: 'CL', name: 'Clean', laborHours: 0.25 },
    { code: 'SB', name: 'Sandblast', laborHours: 1 },
    { code: 'PH', name: 'Patch', laborHours: 1.5 }
];

// Component/Part Codes
export const COMPONENT_CODES = [
    { code: 'PNL', name: 'Panel', unitPrice: 45 },
    { code: 'CRN', name: 'Corner Post', unitPrice: 120 },
    { code: 'RAL', name: 'Rail', unitPrice: 80 },
    { code: 'XMB', name: 'Cross Member', unitPrice: 35 },
    { code: 'DPL', name: 'Door Panel', unitPrice: 150 },
    { code: 'DRL', name: 'Door Rail', unitPrice: 60 },
    { code: 'LCK', name: 'Lock Rod', unitPrice: 25 },
    { code: 'HNG', name: 'Hinge', unitPrice: 40 },
    { code: 'GSK', name: 'Gasket', unitPrice: 15 },
    { code: 'PLW', name: 'Plywood', unitPrice: 20 },
    { code: 'ALM', name: 'Aluminum', unitPrice: 55 },
    { code: 'STL', name: 'Steel', unitPrice: 30 }
];

// Severity Levels
export const SEVERITY_LEVELS = [
    { code: 'L', name: 'Light', multiplier: 1 },
    { code: 'M', name: 'Medium', multiplier: 1.5 },
    { code: 'H', name: 'Heavy', multiplier: 2 },
    { code: 'S', name: 'Severe', multiplier: 3 }
];

// Container Sizes
export const CONTAINER_SIZES = [
    { code: '20', name: '20ft' },
    { code: '40', name: '40ft' },
    { code: '45', name: '45ft' }
];

// Container Types
export const CONTAINER_TYPES = [
    { code: 'DRY', name: 'Dry Container' },
    { code: 'REEFER', name: 'Reefer' },
    { code: 'TANK', name: 'Tank Container' },
    { code: 'FLAT', name: 'Flat Rack' },
    { code: 'OPEN', name: 'Open Top' }
];

// Container Size/Type Details
export const CONTAINER_DETAILS = [
    { code: '20GP', name: '20ft General Purpose' },
    { code: '40GP', name: '40ft General Purpose' },
    { code: '40HC', name: '40ft High Cube' },
    { code: '20RF', name: '20ft Reefer' },
    { code: '40RF', name: '40ft Reefer' },
    { code: '45HC', name: '45ft High Cube' },
    { code: '20OT', name: '20ft Open Top' },
    { code: '40OT', name: '40ft Open Top' },
    { code: '20FR', name: '20ft Flat Rack' },
    { code: '40FR', name: '40ft Flat Rack' }
];

// Shipping Lines (Liners)
export const LINERS = [
    { code: 'MSC', name: 'Mediterranean Shipping Company', email: 'mnr@msc.com' },
    { code: 'MSK', name: 'Maersk Line', email: 'mnr@maersk.com' },
    { code: 'CMA', name: 'CMA CGM', email: 'mnr@cma-cgm.com' },
    { code: 'CSL', name: 'COSCO Shipping', email: 'mnr@cosco.com' },
    { code: 'HPL', name: 'Hapag-Lloyd', email: 'mnr@hapag-lloyd.com' },
    { code: 'ONE', name: 'Ocean Network Express', email: 'mnr@one-line.com' },
    { code: 'EVG', name: 'Evergreen Marine', email: 'mnr@evergreen-marine.com' },
    { code: 'YML', name: 'Yang Ming Line', email: 'mnr@yangming.com' },
    { code: 'PIL', name: 'Pacific International Lines', email: 'mnr@pilship.com' },
    { code: 'ZIM', name: 'ZIM Integrated Shipping', email: 'mnr@zim.com' }
];

// Yard Blocks
export const YARD_BLOCKS = [
    { code: 'A', rows: 20, tiers: 5 },
    { code: 'B', rows: 20, tiers: 5 },
    { code: 'C', rows: 15, tiers: 4 },
    { code: 'D', rows: 15, tiers: 4 },
    { code: 'E', rows: 10, tiers: 3 },
    { code: 'R1', rows: 8, tiers: 2, type: 'REPAIR' },
    { code: 'R2', rows: 8, tiers: 2, type: 'REPAIR' },
    { code: 'BUF', rows: 5, tiers: 2, type: 'BUFFER' }
];

// Helper function to get code by value
export const getCodeLabel = (codes, codeValue) => {
    const item = codes.find(c => c.code === codeValue);
    return item ? item.name : codeValue;
};
