import { useState, useMemo } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import {
    Users, Plus, Trash2, Save, X, Search, Shield, Check, ChevronRight, AlertTriangle,
    Copy, Eye, Grid, BarChart3, Zap, Maximize2, Minimize2
} from 'lucide-react';
import './Admin.css';
import { PermissionItem } from './PermissionItem';

// Granular permissions per screen
const PERMISSION_TYPES = [
    { key: 'use', label: 'Use' },
    { key: 'retrieve', label: 'Retrieve' },
    { key: 'clear', label: 'Clear' },
    { key: 'create', label: 'Create' },
    { key: 'save', label: 'Save' },
    { key: 'delete', label: 'Delete' },
    { key: 'approve', label: 'Approve' },
    { key: 'reject', label: 'Reject' },
    { key: 'download', label: 'Download' },
    { key: 'preview', label: 'Preview' },
    { key: 'print', label: 'Print' },
    { key: 'history', label: 'History' }
];

// Quick permission templates
const PERMISSION_TEMPLATES = [
    { id: 'readonly', name: 'Read Only', desc: 'View and retrieve only', perms: ['use', 'retrieve', 'preview'] },
    { id: 'standard', name: 'Standard User', desc: 'Basic CRUD operations', perms: ['use', 'retrieve', 'create', 'save', 'preview'] },
    { id: 'full', name: 'Full Access', desc: 'All permissions except delete', perms: ['use', 'retrieve', 'clear', 'create', 'save', 'download', 'preview', 'print', 'history'] },
    { id: 'admin', name: 'Administrator', desc: 'All permissions', perms: ['use', 'retrieve', 'clear', 'create', 'save', 'delete', 'download', 'preview', 'print', 'history'] }
];

export default function PermissionGroups() {
    const { screens, groups, createGroup, updateGroup, deleteGroup } = useConfig();
    const { t } = useLanguage();
    const toast = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [activeTab, setActiveTab] = useState('screens');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [viewMode, setViewMode] = useState('matrix'); // 'matrix' or 'summary'
    const [newGroup, setNewGroup] = useState({
        name: '',
        code: '',
        description: '',
        level: 1,
        usage: true,
        grant: true,
        screens: [],
        screenPermissions: {},
        functions: []
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const TABS = [
        { id: 'screens', label: t('admin.screens') || 'Screens', icon: Grid },
        { id: 'overview', label: t('admin.overview') || 'Overview', icon: BarChart3 },
        { id: 'functions', label: t('admin.functions') || 'Functions', icon: Zap },
        { id: 'settings', label: t('common.settings') || 'Settings', icon: null }
    ];

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group screens by category
    const screenCategories = {
        core: { label: 'Core', screens: screens.filter(s => s.group === 'core') },
        container: { label: 'Container', screens: screens.filter(s => s.group === 'container') },
        survey: { label: 'Survey', screens: screens.filter(s => s.group === 'survey') },
        eor: { label: 'EOR', screens: screens.filter(s => s.group === 'eor') },
        repair: { label: 'Repair', screens: screens.filter(s => s.group === 'repair') },
        operations: { label: 'Operations', screens: screens.filter(s => s.group === 'operations') },
        admin: { label: 'Admin', screens: screens.filter(s => s.group === 'admin') }
    };

    // Calculate permission statistics for overview
    const permissionStats = useMemo(() => {
        if (!selectedGroup?.screenPermissions) return null;

        const perms = selectedGroup.screenPermissions;
        const screenCounts = {};
        let totalEnabled = 0;
        let totalPossible = screens.length * PERMISSION_TYPES.length;

        Object.entries(perms).forEach(([screenId, screenPerms]) => {
            const enabledCount = Object.values(screenPerms).filter(Boolean).length;
            screenCounts[screenId] = enabledCount;
            totalEnabled += enabledCount;
        });

        // Count by permission type
        const permTypeCounts = {};
        PERMISSION_TYPES.forEach(pt => {
            permTypeCounts[pt.key] = Object.values(perms).filter(sp => sp[pt.key]).length;
        });

        return {
            totalScreens: screens.length,
            activeScreens: Object.keys(perms).filter(sid => perms[sid]?.use).length,
            totalEnabled,
            totalPossible,
            percentage: Math.round((totalEnabled / totalPossible) * 100),
            screenCounts,
            permTypeCounts
        };
    }, [selectedGroup?.screenPermissions, screens]);

    const handleSelectGroup = (group) => {
        // Initialize screenPermissions if not exists
        if (!group.screenPermissions) {
            group.screenPermissions = {};
            group.screens.forEach(screenId => {
                group.screenPermissions[screenId] = {
                    use: true,
                    retrieve: true,
                    create: group.functions?.includes('create') || false,
                    save: group.functions?.includes('update') || false,
                    delete: group.functions?.includes('delete') || false,
                    download: group.functions?.includes('export') || false,
                    preview: true,
                    print: true,
                    history: true,
                    clear: true
                };
            });
        }
        setSelectedGroup({ ...group });
        setActiveTab('screens');
        // On mobile, auto-close sidebar when selecting
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleSaveNew = () => {
        if (!newGroup.name) {
            toast.error(t('admin.nameRequired') || 'Group name is required');
            return;
        }
        if (!newGroup.code) {
            toast.error(t('admin.codeRequired') || 'Group code is required');
            return;
        }
        const created = createGroup({
            ...newGroup,
            id: newGroup.code.toLowerCase().replace(/\s+/g, '_')
        });
        setNewGroup({ name: '', code: '', description: '', level: 1, usage: true, grant: true, screens: [], screenPermissions: {}, functions: [] });
        setIsAddingNew(false);
        toast.success(t('admin.groupCreated') || 'Group created successfully');
        handleSelectGroup(created);
    };

    const handleSaveGroup = () => {
        if (!selectedGroup) return;
        updateGroup(selectedGroup.id, {
            ...selectedGroup,
            screens: Object.keys(selectedGroup.screenPermissions || {}).filter(
                screenId => selectedGroup.screenPermissions[screenId]?.use
            )
        });
        toast.success(t('admin.groupSaved') || 'Group saved successfully');
    };

    const toggleScreenPermission = (screenId, permKey) => {
        if (!selectedGroup || selectedGroup.id === 'admin') return;

        setSelectedGroup(prev => {
            const perms = { ...prev.screenPermissions };
            if (!perms[screenId]) {
                perms[screenId] = {};
            }
            perms[screenId] = { ...perms[screenId], [permKey]: !perms[screenId][permKey] };

            // If toggling 'use' off, disable all other permissions for this screen
            if (permKey === 'use' && !perms[screenId].use) {
                PERMISSION_TYPES.forEach(p => {
                    perms[screenId][p.key] = false;
                });
            }
            // If toggling any permission on, enable 'use'
            if (permKey !== 'use' && perms[screenId][permKey]) {
                perms[screenId].use = true;
            }

            return { ...prev, screenPermissions: perms };
        });
    };

    const toggleAllScreenPerms = (screenId, enable) => {
        if (!selectedGroup || selectedGroup.id === 'admin') return;
        setSelectedGroup(prev => {
            const perms = { ...prev.screenPermissions };
            perms[screenId] = {};
            PERMISSION_TYPES.forEach(p => {
                perms[screenId][p.key] = enable;
            });
            return { ...prev, screenPermissions: perms };
        });
    };

    // Apply template to all screens
    const applyTemplate = (template) => {
        if (!selectedGroup || selectedGroup.id === 'admin') return;

        setSelectedGroup(prev => {
            const perms = {};
            screens.forEach(screen => {
                perms[screen.id] = {};
                PERMISSION_TYPES.forEach(p => {
                    perms[screen.id][p.key] = template.perms.includes(p.key);
                });
            });
            return { ...prev, screenPermissions: perms };
        });
        toast.info(`Applied "${template.name}" template to all screens`);
    };

    // Duplicate a group
    const duplicateGroup = (group) => {
        const newName = `${group.name} (Copy)`;
        const newCode = `${group.code || group.id}_COPY`;
        const created = createGroup({
            ...group,
            id: newCode.toLowerCase().replace(/\s+/g, '_'),
            name: newName,
            code: newCode
        });
        toast.success(t('admin.groupDuplicated') || 'Group duplicated');
        handleSelectGroup(created);
    };

    const handleDelete = (groupId) => {
        if (['admin', 'viewer'].includes(groupId)) {
            toast.error(t('admin.cannotDeleteCore') || 'Cannot delete core groups');
            return;
        }
        setDeleteConfirm(groupId);
    };

    const confirmDelete = () => {
        if (deleteConfirm) {
            deleteGroup(deleteConfirm);
            if (selectedGroup?.id === deleteConfirm) {
                setSelectedGroup(null);
            }
            toast.success(t('admin.groupDeleted') || 'Group deleted successfully');
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2><Shield size={24} /> {t('nav.permissionGroups')}</h2>
                    <p className="text-muted">{t('admin.permissionGroupsDesc') || 'Configure granular permissions for each group'}</p>
                </div>
                <div className="header-stats">
                    <div className="header-stat">
                        <span className="header-stat-value">{groups.length}</span>
                        <span className="header-stat-label">{t('admin.groups') || 'Groups'}</span>
                    </div>
                </div>
            </div>

            <div className={`master-detail-layout ${!isSidebarOpen ? 'expanded' : ''}`}>
                {/* Master List */}
                {isSidebarOpen && (
                    <div className="master-panel">
                        <div className="master-toolbar">
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder={t('common.search') || 'Search...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => setIsAddingNew(true)}>
                                <Plus size={14} />
                            </button>
                        </div>

                        <div className="master-list">
                            {filteredGroups.map(group => (
                                <div
                                    key={group.id}
                                    className={`master-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                                    onClick={() => handleSelectGroup(group)}
                                >
                                    <div className="master-item-content">
                                        <div className="master-item-title">
                                            <Users size={16} />
                                            <span>{group.name}</span>
                                            {['admin', 'viewer'].includes(group.id) && (
                                                <span className="badge badge-primary" style={{ marginLeft: '4px', fontSize: '9px' }}>Core</span>
                                            )}
                                        </div>
                                        <div className="master-item-subtitle">{group.description}</div>
                                        <div className="master-item-meta">
                                            <span>{group.screens?.length || 0} {t('admin.screens') || 'screens'}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="master-item-arrow" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detail Panel */}
                <div className="detail-panel">
                    {isAddingNew ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3>{t('admin.newGroup') || 'New Permission Group'}</h3>
                                <div className="detail-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => setIsAddingNew(false)}>
                                        <X size={14} /> {t('common.cancel') || 'Cancel'}
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={handleSaveNew}>
                                        <Save size={14} /> {t('common.create') || 'Create'}
                                    </button>
                                </div>
                            </div>
                            <div className="detail-body">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label required">{t('admin.groupCode')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newGroup.code}
                                            onChange={(e) => setNewGroup(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                            placeholder="e.g., SUPERVISOR"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">{t('admin.groupName')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newGroup.name}
                                            onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Supervisor"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('admin.description')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newGroup.description}
                                            onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Group description"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('admin.groupLevel')}</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={newGroup.level}
                                            onChange={(e) => setNewGroup(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                                            min="1"
                                            max="10"
                                        />
                                    </div>
                                </div>

                                {/* Quick Start Templates */}
                                <div className="mt-6">
                                    <h4 className="mb-3">{t('admin.quickTemplates') || 'Quick Start Templates'}</h4>
                                    <div className="template-grid">
                                        {PERMISSION_TEMPLATES.map(template => (
                                            <div
                                                key={template.id}
                                                className="template-card"
                                                onClick={() => {
                                                    const perms = {};
                                                    screens.forEach(screen => {
                                                        perms[screen.id] = {};
                                                        PERMISSION_TYPES.forEach(p => {
                                                            perms[screen.id][p.key] = template.perms.includes(p.key);
                                                        });
                                                    });
                                                    setNewGroup(prev => ({
                                                        ...prev,
                                                        screenPermissions: perms,
                                                        screens: screens.map(s => s.id)
                                                    }));
                                                    toast.info(`Selected "${template.name}" template`);
                                                }}
                                            >
                                                <div className="template-name">{template.name}</div>
                                                <div className="template-desc">{template.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : selectedGroup ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <div className="flex items-center gap-4">
                                    <button
                                        className="sidebar-toggle-btn"
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        title={isSidebarOpen ? "Maximize View (Hide Group List)" : "Restore View (Show Group List)"}
                                    >
                                        {isSidebarOpen ? (
                                            <>
                                                <Maximize2 size={16} />
                                                <span>{t('admin.hideGroups') || 'Hide Groups'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Minimize2 size={16} />
                                                <span>{t('admin.showGroups') || 'Show Groups'}</span>
                                            </>
                                        )}
                                    </button>
                                    <div className="border-l h-8 border-gray-300 mx-2"></div>
                                    <div>
                                        <h3 className="m-0 flex items-center gap-2">
                                            {selectedGroup.name}
                                            {['admin', 'viewer'].includes(selectedGroup.id) && (
                                                <span className="badge badge-primary text-xs">Core</span>
                                            )}
                                        </h3>
                                        <p className="text-muted text-xs m-0 mt-1">{selectedGroup.description}</p>
                                    </div>
                                </div>
                                <div className="detail-actions">
                                    {!['admin'].includes(selectedGroup.id) && (
                                        <>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => duplicateGroup(selectedGroup)}
                                                title={t('admin.duplicate') || 'Duplicate'}
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(selectedGroup.id)}>
                                                <Trash2 size={16} /> {t('common.delete') || 'Delete'}
                                            </button>
                                            <button className="btn btn-primary btn-sm" onClick={handleSaveGroup}>
                                                <Save size={16} /> {t('common.save') || 'Save'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="detail-tabs">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.icon && <tab.icon size={14} />}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Detail Body */}
                            <div className="detail-body">
                                {activeTab === 'screens' && (
                                    <>
                                        {/* Quick Template Bar */}
                                        {selectedGroup.id !== 'admin' && (
                                            <div className="template-bar mb-4">
                                                <span className="template-bar-label">{t('admin.applyTemplate') || 'Apply template'}:</span>
                                                {PERMISSION_TEMPLATES.map(template => (
                                                    <button
                                                        key={template.id}
                                                        className="btn btn-ghost btn-xs"
                                                        onClick={() => applyTemplate(template)}
                                                        title={template.desc}
                                                    >
                                                        {template.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className="permission-summary-card mb-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center text-sm border border-blue-100">
                                            <div className="flex gap-4">
                                                <span className="text-blue-800 font-medium">
                                                    {t('admin.activeScreens') || 'Active Screens'}:
                                                    <span className="ml-1 font-bold">{permissionStats?.activeScreens || 0}</span>
                                                    <span className="mx-1 text-blue-400">/</span>
                                                    {screens.length}
                                                </span>
                                                <span className="text-blue-800 font-medium">
                                                    {t('admin.completion') || 'Completion'}:
                                                    <span className="ml-1 font-bold">{permissionStats?.percentage || 0}%</span>
                                                </span>
                                            </div>
                                            <div className="text-xs text-blue-600 italic">
                                                * Scroll down to see all screens
                                            </div>
                                        </div>

                                        {/* Modern Access Level List */}
                                        <div className="permission-list-container">
                                            {Object.entries(screenCategories).map(([key, category]) => {
                                                if (category.screens.length === 0) return null;
                                                return (
                                                    <div key={key} className="category-section">
                                                        <div className="category-header">
                                                            <span>{category.label}</span>
                                                        </div>
                                                        <div className="category-screens">
                                                            {category.screens.map(screen => (
                                                                <PermissionItem
                                                                    key={screen.id}
                                                                    screen={screen}
                                                                    selectedGroup={selectedGroup}
                                                                    setSelectedGroup={setSelectedGroup}
                                                                    toggleScreenPermission={toggleScreenPermission}
                                                                    PERMISSION_TEMPLATES={PERMISSION_TEMPLATES}
                                                                    PERMISSION_TYPES={PERMISSION_TYPES}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {activeTab === 'overview' && (
                                    <div className="overview-stats">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* ... existing stats ... */}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'functions' && (
                                    <div className="function-permissions">
                                        <p className="text-muted mb-4">{t('admin.legacyFunctions') || 'Legacy function-based permissions (for compatibility)'}</p>
                                        <div className="function-grid">
                                            {['create', 'read', 'update', 'delete', 'approve', 'export'].map(func => (
                                                <label key={func} className="function-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGroup.functions?.includes(func)}
                                                        onChange={() => {
                                                            const newFuncs = selectedGroup.functions?.includes(func)
                                                                ? selectedGroup.functions.filter(f => f !== func)
                                                                : [...(selectedGroup.functions || []), func];
                                                            setSelectedGroup(prev => ({ ...prev, functions: newFuncs }));
                                                        }}
                                                        disabled={selectedGroup.id === 'admin'}
                                                    />
                                                    <span>{func.charAt(0).toUpperCase() + func.slice(1)}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="group-settings">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label">{t('admin.groupName')}</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={selectedGroup.name}
                                                    onChange={(e) => setSelectedGroup(prev => ({ ...prev, name: e.target.value }))}
                                                    disabled={['admin', 'viewer'].includes(selectedGroup.id)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{t('admin.description')}</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={selectedGroup.description || ''}
                                                    onChange={(e) => setSelectedGroup(prev => ({ ...prev, description: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{t('admin.groupLevel')}</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={selectedGroup.level || 1}
                                                    onChange={(e) => setSelectedGroup(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                                                    min="1"
                                                    max="10"
                                                    disabled={['admin'].includes(selectedGroup.id)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="detail-empty">
                            <Shield size={48} />
                            <h4>{t('admin.selectGroup') || 'Select a Group'}</h4>
                            <p>{t('admin.selectGroupDesc') || 'Choose a permission group from the list to view and edit its settings'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                deleteConfirm && (
                    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--error-600)' }}>
                                    <AlertTriangle size={20} /> {t('admin.deleteGroup') || 'Delete Group'}
                                </h3>
                                <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p>{t('admin.deleteGroupConfirm') || 'Are you sure you want to delete the group'} <strong>"{groups.find(g => g.id === deleteConfirm)?.name}"</strong>?</p>
                                <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
                                    {t('admin.deleteGroupWarning') || 'This action cannot be undone. Users assigned to this group will lose these permissions.'}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel') || 'Cancel'}</button>
                                <button className="btn btn-danger" onClick={confirmDelete}>
                                    <Trash2 size={14} /> {t('admin.deleteGroup') || 'Delete Group'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
