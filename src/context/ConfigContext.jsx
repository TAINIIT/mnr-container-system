import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ConfigContext = createContext(null);

// Default screen definitions
const DEFAULT_SCREENS = [
    { id: 'dashboard', name: 'Dashboard', path: '/', group: 'core' },
    { id: 'container_list', name: 'All Containers', path: '/containers', group: 'container' },
    { id: 'container_register', name: 'Register Container', path: '/containers/register', group: 'container' },
    { id: 'container_ar', name: 'AR Containers', path: '/containers/ar', group: 'container' },
    { id: 'survey_new', name: 'New Survey', path: '/survey/new', group: 'survey' },
    { id: 'survey_list', name: 'Survey List', path: '/surveys', group: 'survey' },
    { id: 'eor_list', name: 'EOR List', path: '/eor', group: 'eor' },
    { id: 'eor_new', name: 'Create EOR', path: '/eor/new', group: 'eor' },
    { id: 'eor_detail', name: 'EOR Detail', path: '/eor/:id', group: 'eor' },
    { id: 'repair_list', name: 'Repair Orders', path: '/repair-orders', group: 'repair' },
    { id: 'shunting', name: 'Shunting', path: '/shunting', group: 'operations' },
    { id: 'inspection', name: 'Pre-Inspection', path: '/pre-inspection', group: 'operations' },
    { id: 'washing', name: 'Washing Station', path: '/washing', group: 'operations' },
    { id: 'stacking', name: 'Stacking & Release', path: '/stacking', group: 'operations' },
    { id: 'job_monitoring', name: 'Job Monitoring', path: '/monitoring/jobs', group: 'monitoring' },
    { id: 'config_codes', name: 'Master Codes', path: '/admin/codes', group: 'admin' },
    { id: 'config_groups', name: 'Permission Groups', path: '/admin/groups', group: 'admin' },
    { id: 'config_users', name: 'User Management', path: '/admin/users', group: 'admin' },
    { id: 'config_settings', name: 'System Settings', path: '/admin/settings', group: 'admin' },
    { id: 'config_homepage', name: 'Home Page Management', path: '/admin/homepage', group: 'admin' },
    { id: 'config_chats', name: 'Chat Management', path: '/admin/chats', group: 'admin' }
];

// Default permission groups
const DEFAULT_GROUPS = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        screens: DEFAULT_SCREENS.map(s => s.id),
        functions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'delete_job']
    },
    {
        id: 'surveyor',
        name: 'Surveyor',
        description: 'Survey and container inspection',
        screens: ['dashboard', 'container_list', 'survey_new', 'survey_list'],
        functions: ['create', 'read', 'update']
    },
    {
        id: 'estimator',
        name: 'Estimator',
        description: 'EOR creation and management',
        screens: ['dashboard', 'container_list', 'survey_list', 'eor_list', 'eor_new', 'eor_detail'],
        functions: ['create', 'read', 'update']
    },
    {
        id: 'operator',
        name: 'Operator',
        description: 'Repair and operations',
        screens: ['dashboard', 'repair_list', 'shunting', 'inspection', 'washing', 'stacking'],
        functions: ['create', 'read', 'update']
    },
    {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access',
        screens: ['dashboard', 'container_list', 'survey_list', 'eor_list', 'repair_list'],
        functions: ['read']
    }
];

// Default master codes for comboboxes
const DEFAULT_CODES = {
    LINERS: [
        { code: 'MSC', name: 'Mediterranean Shipping Company', address: '12-14 Chemin Rieu, Geneva, Switzerland', email: 'mnr@msc.com', active: true },
        { code: 'MSK', name: 'Maersk Line', address: 'Esplanaden 50, Copenhagen, Denmark', email: 'mnr@maersk.com', active: true },
        { code: 'CMA', name: 'CMA CGM', address: '4 Quai d\'Arenc, Marseille, France', email: 'mnr@cma-cgm.com', active: true },
        { code: 'CSL', name: 'COSCO Shipping', address: '628 Minsheng Road, Shanghai, China', email: 'mnr@cosco.com', active: true },
        { code: 'HPL', name: 'Hapag-Lloyd', address: 'Ballindamm 25, Hamburg, Germany', email: 'mnr@hapag-lloyd.com', active: true },
        { code: 'ONE', name: 'Ocean Network Express', address: 'Ocean Gate, Singapore', email: 'mnr@one-line.com', active: true },
        { code: 'EVG', name: 'Evergreen Marine', address: 'No. 166, Sec. 2, Minzu E. Rd., Taipei, Taiwan', email: 'mnr@evergreen.com', active: true },
        { code: 'YML', name: 'Yang Ming Line', address: 'No. 271, Ming De 1st Rd., Keelung, Taiwan', email: 'mnr@yangming.com', active: true },
        { code: 'PIL', name: 'Pacific International Lines', address: '140 Cecil Street, Singapore', email: 'mnr@pilship.com', active: true },
        { code: 'ZIM', name: 'ZIM Integrated Shipping', address: '9 Andrei Sakharov St., Haifa, Israel', email: 'mnr@zim.com', active: true }
    ],
    CONTAINER_SIZES: [
        { code: '20', name: '20 Feet', active: true },
        { code: '40', name: '40 Feet', active: true },
        { code: '45', name: '45 Feet', active: true }
    ],
    CONTAINER_TYPES: [
        { code: 'DRY', name: 'Dry Container', active: true },
        { code: 'REEFER', name: 'Refrigerated', active: true },
        { code: 'TANK', name: 'Tank Container', active: true },
        { code: 'FLAT', name: 'Flat Rack', active: true },
        { code: 'OPEN', name: 'Open Top', active: true }
    ],
    DAMAGE_LOCATIONS: [
        { code: 'FR', name: 'Front', active: true },
        { code: 'FL', name: 'Front Left', active: true },
        { code: 'FRR', name: 'Front Right', active: true },
        { code: 'L', name: 'Left', active: true },
        { code: 'R', name: 'Right', active: true },
        { code: 'B', name: 'Bottom', active: true },
        { code: 'T', name: 'Top', active: true },
        { code: 'RR', name: 'Rear', active: true },
        { code: 'RL', name: 'Rear Left', active: true },
        { code: 'RRR', name: 'Rear Right', active: true },
        { code: 'I', name: 'Interior', active: true }
    ],
    DAMAGE_TYPES: [
        { code: 'D', name: 'Dent', active: true },
        { code: 'H', name: 'Hole', active: true },
        { code: 'C', name: 'Cut', active: true },
        { code: 'B', name: 'Bent', active: true },
        { code: 'R', name: 'Rust', active: true },
        { code: 'CR', name: 'Crack', active: true },
        { code: 'BR', name: 'Broken', active: true },
        { code: 'MS', name: 'Missing', active: true },
        { code: 'WR', name: 'Worn', active: true }
    ],
    COMPONENTS: [
        { code: 'P', name: 'Panel', active: true },
        { code: 'DR', name: 'Door', active: true },
        { code: 'FL', name: 'Floor', active: true },
        { code: 'RF', name: 'Roof', active: true },
        { code: 'CR', name: 'Corner Post', active: true },
        { code: 'BR', name: 'Bottom Rail', active: true },
        { code: 'TR', name: 'Top Rail', active: true },
        { code: 'SR', name: 'Side Rail', active: true },
        { code: 'CS', name: 'Cross Member', active: true },
        { code: 'LK', name: 'Lock', active: true },
        { code: 'HL', name: 'Handle', active: true },
        { code: 'HG', name: 'Hinge', active: true },
        { code: 'GS', name: 'Gasket', active: true }
    ],
    REPAIR_METHODS: [
        { code: 'WLD', name: 'Welding', unitPrice: 25, active: true },
        { code: 'REP', name: 'Replace', unitPrice: 100, active: true },
        { code: 'STR', name: 'Straighten', unitPrice: 30, active: true },
        { code: 'PNT', name: 'Paint', unitPrice: 15, active: true },
        { code: 'CLN', name: 'Clean', unitPrice: 10, active: true },
        { code: 'PTH', name: 'Patch', unitPrice: 50, active: true }
    ],
    SEVERITY_LEVELS: [
        { code: 'L', name: 'Light', multiplier: 1, active: true },
        { code: 'M', name: 'Medium', multiplier: 1.5, active: true },
        { code: 'H', name: 'Heavy', multiplier: 2, active: true },
        { code: 'S', name: 'Severe', multiplier: 3, active: true }
    ],
    SURVEY_TYPES: [
        { code: 'INBOUND', name: 'Inbound Survey', active: true },
        { code: 'OUTBOUND', name: 'Outbound Survey', active: true },
        { code: 'PERIODIC', name: 'Periodic Inspection', active: true },
        { code: 'DAMAGE', name: 'Damage Survey', active: true }
    ],
    CONTAINER_STATUSES: [
        { code: 'STACKING', name: 'Stacking', color: '#8c8c8c', active: true },
        { code: 'PENDING_WASH', name: 'Pending Wash', color: '#13c2c2', active: true },
        { code: 'WASHING', name: 'Washing', color: '#1677ff', active: true },
        { code: 'DM', name: 'Damaged', color: '#ff4d4f', active: true },
        { code: 'AR', name: 'Awaiting Repair', color: '#faad14', active: true },
        { code: 'RP', name: 'In Repair', color: '#1677ff', active: true },
        { code: 'QC', name: 'Quality Check', color: '#722ed1', active: true },
        { code: 'AV', name: 'Available', color: '#52c41a', active: true },
        { code: 'GO', name: 'Gate Out', color: '#8c8c8c', active: true }
    ],
    INITIAL_CONDITIONS: [
        { code: 'DAMAGED', name: 'Damaged (Có hư hỏng)', active: true },
        { code: 'NO_DAMAGE', name: 'No Damage (Không hư hỏng)', active: true }
    ],
    ANNOUNCEMENTS: [
        { id: 'ann_1', title: 'Implementation of new Safety And Security System', content: 'The new Safety and Security System (SNS) will be implemented by 1st December 2025. All users are advised to complete safety training.', createdAt: '2025-12-01T00:00:00Z', createdBy: 'ADMIN', active: true },
        { id: 'ann_2', title: 'Introduction of new Dangerous Cargo declaration system', content: 'A new Dangerous Cargo declaration system has been introduced. Please refer to the updated guidelines for compliance.', createdAt: '2025-11-15T00:00:00Z', createdBy: 'ADMIN', active: true }
    ],
    LINKS: [
        { id: 'link_1', title: 'Lembaga Pelabuhan Johor', url: 'https://www.lpj.gov.my', description: 'Johor Port Authority', createdAt: '2025-01-01T00:00:00Z', createdBy: 'ADMIN', active: true },
        { id: 'link_2', title: 'Kastam Diraja Malaysia', url: 'https://www.customs.gov.my', description: 'Royal Malaysian Customs', createdAt: '2025-01-01T00:00:00Z', createdBy: 'ADMIN', active: true },
        { id: 'link_3', title: 'MAQIS', url: 'https://www.maqis.gov.my', description: 'Malaysian Quarantine and Inspection Services', createdAt: '2025-01-01T00:00:00Z', createdBy: 'ADMIN', active: true },
        { id: 'link_4', title: 'Kementerian Kesihatan Malaysia', url: 'https://www.moh.gov.my', description: 'Ministry of Health Malaysia', createdAt: '2025-01-01T00:00:00Z', createdBy: 'ADMIN', active: true }
    ],
    BENEFITS: [
        { id: 'ben_1', roleType: 'Shipping Agent', content: 'Johor Port Portal will help Shipping Agent in carrying their day-to-day business transaction in simple way and effortlessly', createdAt: '2025-01-01T00:00:00Z', createdBy: 'ADMIN', active: true },
        { id: 'ben_2', roleType: 'Forwarding Agent', content: 'Streamline your forwarding operations with real-time cargo tracking and automated documentation processing', createdAt: '2025-01-01T00:00:00Z', createdBy: 'ADMIN', active: true },
        { id: 'ben_3', roleType: 'Shipper/Consignee', content: 'Access your shipment information anytime, anywhere with comprehensive visibility and control', createdAt: '2025-01-01T00:00:00Z', createdBy: 'ADMIN', active: true }
    ],
    WELCOME_TEXT: [
        { id: 'welcome_1', titleLine: 'SINGLE ACCESS FOR SHIPPING AGENTS, FORWARDING AGENTS AND SHIPPERS / CONSIGNEES.', subtitleLine: 'Manage container operations, track cargo and access Johor Port services from a unified, secure interface.', createdAt: '2025-01-01T00:00:00Z', createdBy: 'ADMIN', active: true }
    ],
    INSPECTION_CHECKLIST: [
        { id: 'structural', code: 'STRUCTURAL', label: 'Structural Integrity', description: 'No dents, holes, or deformation', active: true },
        { id: 'doors', code: 'DOORS', label: 'Door Operation', description: 'Doors open/close properly, seals intact', active: true },
        { id: 'floor', code: 'FLOOR', label: 'Floor Condition', description: 'Floor boards secure, no rot or damage', active: true },
        { id: 'roof', code: 'ROOF', label: 'Roof Condition', description: 'No leaks, patches properly sealed', active: true },
        { id: 'paint', code: 'PAINT', label: 'Paint and Finish', description: 'Even paint coverage, no rust visible', active: true },
        { id: 'placards', code: 'PLACARDS', label: 'Placards and Labels', description: 'All required markings present', active: true },
        { id: 'locking', code: 'LOCKING', label: 'Locking Mechanism', description: 'Lock bars and handles functional', active: true },
        { id: 'cleanliness', code: 'CLEANLINESS', label: 'Cleanliness', description: 'Interior clean, no debris', active: true },
        // Post-Repair Cleaning Checklist (added per workflow redesign)
        { id: 'post_repair_slag', code: 'POST_REPAIR_SLAG', label: 'Welding Slag Removed', description: 'All welding slag and spatter cleaned', category: 'POST_REPAIR_CLEAN', active: true },
        { id: 'post_repair_debris', code: 'POST_REPAIR_DEBRIS', label: 'Debris Swept', description: 'All repair debris and dust removed', category: 'POST_REPAIR_CLEAN', active: true },
        { id: 'post_repair_grease', code: 'POST_REPAIR_GREASE', label: 'Oil/Grease Cleaned', description: 'No oil, grease, or lubricant residue', category: 'POST_REPAIR_CLEAN', active: true },
        { id: 'post_repair_touchup', code: 'POST_REPAIR_TOUCHUP', label: 'Touch-up Paint Applied', description: 'Touch-up paint applied to repaired areas', category: 'POST_REPAIR_CLEAN', active: true }
    ],

    // Washing Station Master Data
    CLEANING_PROGRAMS: [
        {
            code: 'BASIC_WASH',
            name: 'Basic Wash',
            description: 'Standard cleaning for dry containers',
            containerTypes: ['DRY', 'OPEN_TOP', 'FLAT_RACK'],
            estimatedMinutes: 30,
            defaultCost: 50,
            requiresSafetyGear: false,
            active: true
        },
        {
            code: 'HIGH_PRESSURE',
            name: 'High-Pressure Wash',
            description: 'Deep cleaning with high-pressure water for stubborn stains',
            containerTypes: ['DRY', 'OPEN_TOP', 'FLAT_RACK', 'REEFER'],
            estimatedMinutes: 45,
            defaultCost: 80,
            requiresSafetyGear: false,
            active: true
        },
        {
            code: 'CHEMICAL_CLEAN',
            name: 'Chemical Clean',
            description: 'Decontamination for hazardous or chemical residues',
            containerTypes: ['DRY', 'TANK'],
            estimatedMinutes: 90,
            defaultCost: 200,
            requiresSafetyGear: true,
            active: true
        },
        {
            code: 'FOOD_GRADE',
            name: 'Food-Grade Cleaning',
            description: 'Sanitization for food cargo containers',
            containerTypes: ['DRY', 'REEFER'],
            estimatedMinutes: 60,
            defaultCost: 120,
            requiresSafetyGear: false,
            active: true
        },
        {
            code: 'REEFER_DEEP',
            name: 'Reefer Deep Clean',
            description: 'Complete reefer cleaning including vents, gaskets, drains',
            containerTypes: ['REEFER'],
            estimatedMinutes: 120,
            defaultCost: 250,
            requiresSafetyGear: false,
            active: true
        }
    ],

    CLEANING_CHECKLISTS: {
        BASIC_WASH: [
            { id: 'sweep_debris', label: 'Sweep out debris', category: 'INTERIOR', required: true },
            { id: 'wash_floor', label: 'Wash floor', category: 'INTERIOR', required: true },
            { id: 'wash_walls', label: 'Wash walls', category: 'INTERIOR', required: true },
            { id: 'wash_ceiling', label: 'Wash ceiling', category: 'INTERIOR', required: true },
            { id: 'wash_exterior', label: 'Wash exterior', category: 'EXTERIOR', required: true },
            { id: 'dry_interior', label: 'Dry interior', category: 'FINAL', required: true }
        ],
        HIGH_PRESSURE: [
            { id: 'sweep_debris', label: 'Sweep out debris', category: 'INTERIOR', required: true },
            { id: 'hp_floor', label: 'High-pressure wash floor', category: 'INTERIOR', required: true },
            { id: 'hp_walls', label: 'High-pressure wash walls', category: 'INTERIOR', required: true },
            { id: 'hp_ceiling', label: 'High-pressure wash ceiling', category: 'INTERIOR', required: true },
            { id: 'scrub_stains', label: 'Scrub stubborn stains', category: 'INTERIOR', required: true },
            { id: 'wash_exterior', label: 'Wash exterior', category: 'EXTERIOR', required: true },
            { id: 'dry_interior', label: 'Dry interior completely', category: 'FINAL', required: true }
        ],
        CHEMICAL_CLEAN: [
            { id: 'ventilate', label: 'Ventilate container', category: 'SAFETY', required: true },
            { id: 'check_residue', label: 'Identify residue type', category: 'SAFETY', required: true },
            { id: 'apply_neutralizer', label: 'Apply neutralizing agent', category: 'CHEMICAL', required: true },
            { id: 'wait_reaction', label: 'Wait for reaction time', category: 'CHEMICAL', required: true },
            { id: 'hp_wash', label: 'High-pressure wash all surfaces', category: 'INTERIOR', required: true },
            { id: 'rinse_chemical', label: 'Rinse off all chemicals', category: 'INTERIOR', required: true },
            { id: 'test_residue', label: 'Test for residue (pH test)', category: 'FINAL', required: true },
            { id: 'dry_interior', label: 'Dry interior completely', category: 'FINAL', required: true }
        ],
        FOOD_GRADE: [
            { id: 'sweep_debris', label: 'Sweep out all debris', category: 'INTERIOR', required: true },
            { id: 'hp_wash', label: 'High-pressure wash all surfaces', category: 'INTERIOR', required: true },
            { id: 'apply_sanitizer', label: 'Apply food-grade sanitizer', category: 'SANITIZE', required: true },
            { id: 'scrub_surfaces', label: 'Scrub all surfaces', category: 'SANITIZE', required: true },
            { id: 'rinse_sanitizer', label: 'Rinse sanitizer thoroughly', category: 'INTERIOR', required: true },
            { id: 'check_odor', label: 'Check for any odors', category: 'FINAL', required: true },
            { id: 'dry_interior', label: 'Dry interior completely', category: 'FINAL', required: true },
            { id: 'inspect_cleanliness', label: 'Final cleanliness inspection', category: 'FINAL', required: true }
        ],
        REEFER_DEEP: [
            { id: 'sweep_debris', label: 'Sweep out debris', category: 'INTERIOR', required: true },
            { id: 'hp_floor', label: 'High-pressure wash floor', category: 'INTERIOR', required: true },
            { id: 'hp_walls', label: 'High-pressure wash walls', category: 'INTERIOR', required: true },
            { id: 'clean_gaskets', label: 'Clean door gaskets', category: 'REEFER', required: true },
            { id: 'clean_vents', label: 'Clean ventilators/grilles', category: 'REEFER', required: true },
            { id: 'clear_drains', label: 'Clear drain plugs/holes', category: 'REEFER', required: true },
            { id: 'clean_evaporator', label: 'Clean evaporator area', category: 'REEFER', required: true },
            { id: 'clean_tbar', label: 'Clean T-bar floor rails', category: 'REEFER', required: true },
            { id: 'sanitize', label: 'Apply sanitizer', category: 'SANITIZE', required: true },
            { id: 'neutralize_odor', label: 'Neutralize any odors', category: 'FINAL', required: true },
            { id: 'dry_interior', label: 'Dry interior completely', category: 'FINAL', required: true }
        ]
    },

    WASH_BAYS: [
        { code: 'BAY_1', name: 'Wash Bay 1', capacity: 1, specialType: null, active: true },
        { code: 'BAY_2', name: 'Wash Bay 2', capacity: 1, specialType: null, active: true },
        { code: 'BAY_3', name: 'Wash Bay 3', capacity: 1, specialType: null, active: true },
        { code: 'BAY_CHEM', name: 'Chemical Bay', capacity: 1, specialType: 'CHEMICAL', active: true },
        { code: 'BAY_REEFER', name: 'Reefer Bay', capacity: 1, specialType: 'REEFER', active: true }
    ],

    CONTAMINATION_LEVELS: [
        { code: 'LIGHT', name: 'Light Dirt', description: 'Minimal dirt/dust', suggestedProgram: 'BASIC_WASH', safetyAlert: false, active: true },
        { code: 'MODERATE', name: 'Moderate Dirt/Stains', description: 'Visible stains, oil marks', suggestedProgram: 'HIGH_PRESSURE', safetyAlert: false, active: true },
        { code: 'HEAVY', name: 'Heavy Contamination', description: 'Heavy dirt, strong odor', suggestedProgram: 'HIGH_PRESSURE', safetyAlert: false, active: true },
        { code: 'HAZARDOUS', name: 'Hazardous Residue', description: 'Chemical spills, toxic materials', suggestedProgram: 'CHEMICAL_CLEAN', safetyAlert: true, active: true },
        { code: 'FOOD_PREV', name: 'Previous Food Cargo', description: 'Container used for food', suggestedProgram: 'FOOD_GRADE', safetyAlert: false, active: true }
    ],

    // Washing worker teams
    WASHING_TEAMS: [
        { code: 'WASH_TEAM_A', name: 'Washing Team A', members: 3, active: true },
        { code: 'WASH_TEAM_B', name: 'Washing Team B', members: 3, active: true },
        { code: 'WASH_CHEM', name: 'Chemical Specialists', members: 2, active: true }
    ],

    // Interior conditions for washing inspection
    INTERIOR_CONDITIONS: [
        { code: 'DIRT_DEBRIS', name: 'Dirt/Debris', description: 'Dirt or debris present', active: true },
        { code: 'OIL_GREASE', name: 'Oil/Grease', description: 'Oil or grease stains', active: true },
        { code: 'CHEMICAL_RESIDUE', name: 'Chemical Residue', description: 'Chemical residue present', active: true },
        { code: 'ODOR_PRESENT', name: 'Odor Present', description: 'Unpleasant odor detected', active: true },
        { code: 'PEST_SIGNS', name: 'Pest Signs', description: 'Signs of pest activity', active: true },
        { code: 'MOISTURE', name: 'Moisture', description: 'Moisture or dampness', active: true }
    ],

    // Exterior conditions for washing inspection
    EXTERIOR_CONDITIONS: [
        { code: 'DIRTY', name: 'Dirty', description: 'Exterior is dirty', active: true },
        { code: 'STAINED', name: 'Stained', description: 'Visible stains on exterior', active: true },
        { code: 'GRAFFITI', name: 'Graffiti', description: 'Graffiti markings', active: true }
    ],

    // QC Checklist items for washing quality control
    QC_CHECKLIST: [
        { code: 'FLOOR_CLEAN', name: 'Floor is clean and free of debris', description: 'Check floor cleanliness', required: true, active: true },
        { code: 'WALLS_CLEAN', name: 'Walls and ceiling are clean', description: 'Check wall and ceiling cleanliness', required: true, active: true },
        { code: 'NO_ODOR', name: 'No unpleasant odors', description: 'Verify no bad smells', required: true, active: true },
        { code: 'NO_STAINS', name: 'No visible stains or residue', description: 'Check for stains', required: true, active: true },
        { code: 'DOOR_SEALS', name: 'Door seals and gaskets clean', description: 'Inspect door seals', required: true, active: true },
        { code: 'EXTERIOR_CLEAN', name: 'Exterior is clean', description: 'Check exterior cleanliness', required: false, active: true },
        { code: 'INTERIOR_DRY', name: 'Interior is completely dry', description: 'Verify interior is dry', required: true, active: true },
        { code: 'CARGO_READY', name: 'Ready for cargo loading', description: 'Container is cargo-ready', required: true, active: true }
    ],

    // Shunting Drivers
    DRIVERS: [
        { code: 'driver_01', name: 'Ahmad Bin Hassan', phone: '012-3456789', active: true },
        { code: 'driver_02', name: 'Lee Kok Hong', phone: '012-9876543', active: true },
        { code: 'driver_03', name: 'Raju A/L Muthu', phone: '012-5555666', active: true },
        { code: 'driver_04', name: 'Wong Seng Leong', phone: '012-7778889', active: true },
        { code: 'driver_05', name: 'Mohd Faizal Bin Yusof', phone: '013-2223334', active: true },
        { code: 'driver_06', name: 'Tan Wei Ming', phone: '013-4445556', active: true },
        { code: 'driver_07', name: 'Suresh A/L Krishnan', phone: '014-6667778', active: true },
        { code: 'driver_08', name: 'Lim Ah Kow', phone: '014-8889990', active: true },
        { code: 'driver_09', name: 'Azmi Bin Abdullah', phone: '016-1112223', active: true },
        { code: 'driver_10', name: 'Ng Chee Keong', phone: '016-3334445', active: true },
        { code: 'driver_11', name: 'Kumar A/L Raman', phone: '017-5556667', active: true },
        { code: 'driver_12', name: 'Ong Beng Huat', phone: '017-7778880', active: true },
        { code: 'driver_13', name: 'Ismail Bin Osman', phone: '018-1234567', active: true },
        { code: 'driver_14', name: 'Chong Wai Kit', phone: '018-7654321', active: true },
        { code: 'driver_15', name: 'Ganesh A/L Suppiah', phone: '019-9998887', active: true }
    ]
};

// Default users
const DEFAULT_USERS = [
    {
        id: 'user_admin',
        username: 'ADMIN',
        password: '909090',
        fullName: 'Administrator',
        email: 'admin@depot.com',
        groups: ['admin'],
        userType: 'INTERNAL',
        shippingLineCode: null,
        active: true,
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'user_surveyor',
        username: 'SURVEYOR',
        password: '123456',
        fullName: 'Demo Surveyor',
        email: 'surveyor@depot.com',
        groups: ['surveyor'],
        userType: 'INTERNAL',
        shippingLineCode: null,
        active: true,
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'user_estimator',
        username: 'ESTIMATOR',
        password: '123456',
        fullName: 'Demo Estimator',
        email: 'estimator@depot.com',
        groups: ['estimator'],
        userType: 'EXTERNAL',
        shippingLineCode: 'MSC',
        active: true,
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'user_msc',
        username: 'MSC',
        password: '909090',
        fullName: 'MSC Company',
        email: 'msc@msc.com',
        groups: ['viewer'],
        userType: 'EXTERNAL',
        shippingLineCode: 'MSC',
        active: true,
        createdAt: '2024-01-01T00:00:00Z'
    }
];

// Default settings
const DEFAULT_SETTINGS = {
    autoApprovalThreshold: 100, // RM - EORs below this are auto-approved
    defaultCurrency: 'RM',
    containersPerPage: 200
};

export function ConfigProvider({ children }) {
    // Initialize with stored or default values synchronously
    const [screens, setScreens] = useState(() => {
        const saved = localStorage.getItem('mnr_screens');
        return saved ? JSON.parse(saved) : DEFAULT_SCREENS;
    });
    const [groups, setGroups] = useState(() => {
        const saved = localStorage.getItem('mnr_groups');
        return saved ? JSON.parse(saved) : DEFAULT_GROUPS;
    });
    const [codes, setCodes] = useState(() => {
        const saved = localStorage.getItem('mnr_codes');
        return saved ? JSON.parse(saved) : DEFAULT_CODES;
    });
    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('mnr_users');
        return saved ? JSON.parse(saved) : DEFAULT_USERS;
    });
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('mnr_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });
    const [isLoading, setIsLoading] = useState(false);

    // Persist to localStorage
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('mnr_screens', JSON.stringify(screens));
            localStorage.setItem('mnr_groups', JSON.stringify(groups));
            localStorage.setItem('mnr_codes', JSON.stringify(codes));
            localStorage.setItem('mnr_users', JSON.stringify(users));
            localStorage.setItem('mnr_settings', JSON.stringify(settings));
        }
    }, [screens, groups, codes, users, settings, isLoading]);

    // Code operations
    const getCodeList = useCallback((codeType) => {
        const codeList = codes[codeType];
        if (!codeList) return [];
        return codeList.filter(c => c.active);
    }, [codes]);

    const updateCodeList = useCallback((codeType, newList) => {
        setCodes(prev => ({ ...prev, [codeType]: newList }));
    }, []);

    const addCode = useCallback((codeType, newCode) => {
        setCodes(prev => ({
            ...prev,
            [codeType]: [...(prev[codeType] || []), { ...newCode, active: true }]
        }));
    }, []);

    const updateCode = useCallback((codeType, code, updates) => {
        setCodes(prev => ({
            ...prev,
            [codeType]: prev[codeType].map(c =>
                c.code === code ? { ...c, ...updates } : c
            )
        }));
    }, []);

    const deleteCode = useCallback((codeType, code) => {
        setCodes(prev => ({
            ...prev,
            [codeType]: prev[codeType].map(c =>
                c.code === code ? { ...c, active: false } : c
            )
        }));
    }, []);

    // Group operations
    const getGroup = useCallback((groupId) => {
        return groups.find(g => g.id === groupId);
    }, [groups]);

    const createGroup = useCallback((groupData) => {
        const id = `grp_${Date.now()}`;
        const newGroup = { ...groupData, id };
        setGroups(prev => [...prev, newGroup]);
        return newGroup;
    }, []);

    const updateGroup = useCallback((groupId, updates) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, ...updates } : g
        ));
    }, []);

    const deleteGroup = useCallback((groupId) => {
        if (['admin', 'viewer'].includes(groupId)) return false; // Protect core groups
        setGroups(prev => prev.filter(g => g.id !== groupId));
        return true;
    }, []);

    // Settings operations
    const getSetting = useCallback((key) => {
        return settings[key] ?? DEFAULT_SETTINGS[key];
    }, [settings]);

    const updateSetting = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateSettings = useCallback((updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    // User operations
    const getUser = useCallback((userId) => {
        return users.find(u => u.id === userId);
    }, [users]);

    const getUserByUsername = useCallback((username) => {
        return users.find(u => u.username.toUpperCase() === username.toUpperCase());
    }, [users]);

    const createUser = useCallback((userData) => {
        const id = `user_${Date.now()}`;
        const newUser = {
            ...userData,
            id,
            active: true,
            createdAt: new Date().toISOString()
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    }, []);

    const updateUser = useCallback((userId, updates) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u
        ));
    }, []);

    const deactivateUser = useCallback((userId) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, active: false } : u
        ));
    }, []);

    // Update user password
    const updateUserPassword = useCallback((userId, currentPassword, newPassword) => {
        const user = users.find(u => u.id === userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        if (user.password !== currentPassword) {
            return { success: false, error: 'Current password is incorrect' };
        }
        if (newPassword.length < 6) {
            return { success: false, error: 'New password must be at least 6 characters' };
        }

        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, password: newPassword, updatedAt: new Date().toISOString() } : u
        ));

        return { success: true };
    }, [users]);

    // Permission checks
    const getUserPermissions = useCallback((userId) => {
        const user = users.find(u => u.id === userId);
        if (!user || !user.active) return { screens: [], functions: [] };

        const userGroups = groups.filter(g => user.groups.includes(g.id));
        const allowedScreens = new Set();
        const allowedFunctions = new Set();

        userGroups.forEach(g => {
            g.screens.forEach(s => allowedScreens.add(s));
            g.functions.forEach(f => allowedFunctions.add(f));
        });

        return {
            screens: Array.from(allowedScreens),
            functions: Array.from(allowedFunctions)
        };
    }, [users, groups]);

    const canAccessScreen = useCallback((userId, screenId) => {
        const permissions = getUserPermissions(userId);
        return permissions.screens.includes(screenId);
    }, [getUserPermissions]);

    const canPerformFunction = useCallback((userId, func) => {
        const permissions = getUserPermissions(userId);
        return permissions.functions.includes(func);
    }, [getUserPermissions]);

    // Authenticate user
    const authenticateUser = useCallback((username, password) => {
        const user = users.find(u =>
            u.username.toUpperCase() === username.toUpperCase() &&
            u.password === password &&
            u.active
        );
        if (!user) return null;
        return {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            groups: user.groups,
            userType: user.userType,
            shippingLineCode: user.shippingLineCode,
            permissions: getUserPermissions(user.id)
        };
    }, [users, getUserPermissions]);

    // Announcement operations
    const getAnnouncements = useCallback(() => {
        return (codes.ANNOUNCEMENTS || []).filter(a => a.active).sort((a, b) => {
            // Sort by order field first (lower = higher priority), then by createdAt
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [codes]);

    const addAnnouncement = useCallback((announcement) => {
        const newAnn = {
            ...announcement,
            id: `ann_${Date.now()}`,
            createdAt: new Date().toISOString(),
            active: true
        };
        setCodes(prev => ({
            ...prev,
            ANNOUNCEMENTS: [newAnn, ...(prev.ANNOUNCEMENTS || [])]
        }));
        return newAnn;
    }, []);

    const updateAnnouncement = useCallback((id, updates) => {
        setCodes(prev => ({
            ...prev,
            ANNOUNCEMENTS: (prev.ANNOUNCEMENTS || []).map(a =>
                a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
            )
        }));
    }, []);

    const deleteAnnouncement = useCallback((id) => {
        setCodes(prev => ({
            ...prev,
            ANNOUNCEMENTS: (prev.ANNOUNCEMENTS || []).map(a =>
                a.id === id ? { ...a, active: false } : a
            )
        }));
    }, []);

    // Link operations
    const getLinks = useCallback(() => {
        return (codes.LINKS || []).filter(l => l.active).sort((a, b) => {
            // Sort by order field first (lower = higher priority), then by createdAt
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [codes]);

    const addLink = useCallback((link) => {
        const newLink = {
            ...link,
            id: `link_${Date.now()}`,
            createdAt: new Date().toISOString(),
            active: true
        };
        setCodes(prev => ({
            ...prev,
            LINKS: [newLink, ...(prev.LINKS || [])]
        }));
        return newLink;
    }, []);

    const updateLink = useCallback((id, updates) => {
        setCodes(prev => ({
            ...prev,
            LINKS: (prev.LINKS || []).map(l =>
                l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
            )
        }));
    }, []);

    const deleteLink = useCallback((id) => {
        setCodes(prev => ({
            ...prev,
            LINKS: (prev.LINKS || []).map(l =>
                l.id === id ? { ...l, active: false } : l
            )
        }));
    }, []);

    // Benefit operations
    const getBenefits = useCallback(() => {
        return (codes.BENEFITS || []).filter(b => b.active);
    }, [codes]);

    const addBenefit = useCallback((benefit) => {
        const newBenefit = {
            ...benefit,
            id: `ben_${Date.now()}`,
            createdAt: new Date().toISOString(),
            active: true
        };
        setCodes(prev => ({
            ...prev,
            BENEFITS: [newBenefit, ...(prev.BENEFITS || [])]
        }));
        return newBenefit;
    }, []);

    const updateBenefit = useCallback((id, updates) => {
        setCodes(prev => ({
            ...prev,
            BENEFITS: (prev.BENEFITS || []).map(b =>
                b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
            )
        }));
    }, []);

    const deleteBenefit = useCallback((id) => {
        setCodes(prev => ({
            ...prev,
            BENEFITS: (prev.BENEFITS || []).map(b =>
                b.id === id ? { ...b, active: false } : b
            )
        }));
    }, []);

    // Welcome Text operations
    const getWelcomeText = useCallback(() => {
        const activeWelcome = (codes.WELCOME_TEXT || []).find(w => w.active);
        return activeWelcome || { titleLine: '', subtitleLine: '' };
    }, [codes]);

    const updateWelcomeText = useCallback((updates) => {
        setCodes(prev => {
            const welcomeList = prev.WELCOME_TEXT || [];
            if (welcomeList.length === 0) {
                return {
                    ...prev,
                    WELCOME_TEXT: [{ id: 'welcome_1', ...updates, createdAt: new Date().toISOString(), active: true }]
                };
            }
            return {
                ...prev,
                WELCOME_TEXT: welcomeList.map((w, idx) =>
                    idx === 0 ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
                )
            };
        });
    }, []);

    const value = {
        // Data
        screens,
        groups,
        codes,
        users,
        settings,
        isLoading,

        // Code operations
        getCodeList,
        updateCodeList,
        addCode,
        updateCode,
        deleteCode,

        // Group operations
        getGroup,
        createGroup,
        updateGroup,
        deleteGroup,

        // Settings operations
        getSetting,
        updateSetting,
        updateSettings,

        // User operations
        getUser,
        getUserByUsername,
        createUser,
        updateUser,
        deactivateUser,
        updateUserPassword,

        // Permission operations
        getUserPermissions,
        canAccessScreen,
        canPerformFunction,
        authenticateUser,

        // Announcement operations
        getAnnouncements,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,

        // Link operations
        getLinks,
        addLink,
        updateLink,
        deleteLink,

        // Benefit operations
        getBenefits,
        addBenefit,
        updateBenefit,
        deleteBenefit,

        // Welcome Text operations
        getWelcomeText,
        updateWelcomeText,

        // Defaults for reset
        DEFAULT_SCREENS,
        DEFAULT_GROUPS,
        DEFAULT_CODES,
        DEFAULT_USERS,
        DEFAULT_SETTINGS
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
}
