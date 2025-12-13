import { useState, useRef } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import {
    Settings, Plus, Edit2, Trash2, Save, X, Search,
    ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
    Download, Upload, Copy, CheckCircle
} from 'lucide-react';
import './Admin.css';

const CODE_TYPES = [
    // Container & Survey
    { key: 'LINERS', label: 'Liners / Shipping Lines', category: 'CONTAINER' },
    { key: 'CONTAINER_SIZES', label: 'Container Sizes', category: 'CONTAINER' },
    { key: 'CONTAINER_TYPES', label: 'Container Types', category: 'CONTAINER' },
    { key: 'CONTAINER_STATUSES', label: 'Container Statuses', category: 'CONTAINER' },
    { key: 'INITIAL_CONDITIONS', label: 'Initial Conditions', category: 'SURVEY' },
    { key: 'SURVEY_TYPES', label: 'Survey Types', category: 'SURVEY' },
    // Damage & Repair
    { key: 'DAMAGE_LOCATIONS', label: 'Damage Locations', category: 'REPAIR' },
    { key: 'DAMAGE_TYPES', label: 'Damage Types', category: 'REPAIR' },
    { key: 'COMPONENTS', label: 'Container Components', category: 'REPAIR' },
    { key: 'REPAIR_METHODS', label: 'Repair Methods', category: 'REPAIR' },
    { key: 'SEVERITY_LEVELS', label: 'Severity Levels', category: 'REPAIR' },
    { key: 'INSPECTION_CHECKLIST', label: 'Inspection Checklist', category: 'REPAIR' },
    // Washing Station
    { key: 'WASH_BAYS', label: 'Washing Bays', category: 'WASHING' },
    { key: 'CLEANING_PROGRAMS', label: 'Cleaning Programs', category: 'WASHING' },
    { key: 'WASHING_TEAMS', label: 'Washing Teams', category: 'WASHING' },
    { key: 'CONTAMINATION_LEVELS', label: 'Contamination Levels', category: 'WASHING' },
    { key: 'INTERIOR_CONDITIONS', label: 'Interior Conditions', category: 'WASHING' },
    { key: 'EXTERIOR_CONDITIONS', label: 'Exterior Conditions', category: 'WASHING' },
    { key: 'QC_CHECKLIST', label: 'QC Checklist Items', category: 'WASHING' },
    // Operations
    { key: 'DRIVERS', label: 'Shunting Drivers', category: 'OPERATIONS' }
];

export default function MasterCodes() {
    const { codes, updateCodeList, addCode, updateCode, deleteCode } = useConfig();
    const { t } = useLanguage();
    const toast = useToast();
    const fileInputRef = useRef(null);

    const [activeType, setActiveType] = useState('LINERS');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCode, setEditingCode] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newCode, setNewCode] = useState({ code: '', name: '', active: true });
    const [showInactive, setShowInactive] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState('');

    const currentCodes = codes[activeType] || [];
    const filteredCodes = currentCodes.filter(c => {
        const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesActive = showInactive || c.active !== false;
        return matchesSearch && matchesActive;
    });

    // Statistics
    const stats = {
        total: currentCodes.length,
        active: currentCodes.filter(c => c.active !== false).length,
        inactive: currentCodes.filter(c => c.active === false).length
    };

    const handleSaveNew = () => {
        if (!newCode.code || !newCode.name) {
            toast.error(t('admin.codeNameRequired') || 'Code and Name are required');
            return;
        }
        if (currentCodes.some(c => c.code === newCode.code)) {
            toast.error(t('admin.codeExists') || 'Code already exists');
            return;
        }
        addCode(activeType, newCode);
        setNewCode({ code: '', name: '', active: true });
        setIsAddingNew(false);
        toast.success(t('admin.codeAdded') || 'Code added successfully');
    };

    const handleUpdate = (code, field, value) => {
        updateCode(activeType, code, { [field]: value });
        toast.success(t('admin.codeUpdated') || 'Code updated');
    };

    const handleToggleActive = (code, currentActive) => {
        updateCode(activeType, code, { active: !currentActive });
        toast.info(`Code ${!currentActive ? t('admin.activated') || 'activated' : t('admin.deactivated') || 'deactivated'}`);
    };

    const handleDelete = (code) => {
        if (confirm(t('admin.confirmDeactivate') || 'Deactivate this code?')) {
            deleteCode(activeType, code);
            toast.success(t('admin.codeDeactivated') || 'Code deactivated');
        }
    };

    // Export codes as JSON
    const handleExport = () => {
        const exportData = {
            type: activeType,
            codes: currentCodes,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeType.toLowerCase()}_codes.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('admin.exportSuccess') || 'Codes exported successfully');
    };

    // Import codes from JSON
    const handleImport = () => {
        try {
            const data = JSON.parse(importData);
            if (!data.codes || !Array.isArray(data.codes)) {
                toast.error(t('admin.invalidFormat') || 'Invalid import format');
                return;
            }

            let imported = 0;
            let skipped = 0;

            data.codes.forEach(code => {
                if (code.code && code.name) {
                    if (!currentCodes.some(c => c.code === code.code)) {
                        addCode(activeType, { ...code, active: true });
                        imported++;
                    } else {
                        skipped++;
                    }
                }
            });

            toast.success(`${t('admin.imported') || 'Imported'}: ${imported}, ${t('admin.skipped') || 'Skipped'}: ${skipped}`);
            setShowImportModal(false);
            setImportData('');
        } catch (e) {
            toast.error(t('admin.invalidJSON') || 'Invalid JSON format');
        }
    };

    // Copy code to clipboard
    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.info(t('admin.copied') || 'Code copied to clipboard');
    };

    // Get extra fields based on code type
    const getExtraFields = () => {
        switch (activeType) {
            case 'LINERS':
                return ['email', 'address'];
            case 'REPAIR_METHODS':
                return ['unitPrice'];
            case 'SEVERITY_LEVELS':
                return ['multiplier'];
            case 'CONTAINER_STATUSES':
                return ['color'];
            case 'INSPECTION_CHECKLIST':
                return ['label', 'description'];
            // Washing types
            case 'WASH_BAYS':
                return ['capacity', 'specialType'];
            case 'CLEANING_PROGRAMS':
                return ['duration', 'defaultCost'];
            case 'WASHING_TEAMS':
                return ['members'];
            case 'CONTAMINATION_LEVELS':
                return ['suggestedProgram', 'safetyAlert'];
            case 'INTERIOR_CONDITIONS':
            case 'EXTERIOR_CONDITIONS':
                return ['description'];
            case 'QC_CHECKLIST':
                return ['description', 'required'];
            // Operations
            case 'DRIVERS':
                return ['phone'];
            default:
                return [];
        }
    };

    const extraFields = getExtraFields();

    return (
        <div className="admin-page-layout">
            {/* Fixed Header */}
            <div className="admin-page-header">
                <div className="page-header">
                    <div>
                        <h2><Settings size={24} /> {t('nav.masterCodes') || 'Master Codes Configuration'}</h2>
                        <p className="text-muted">{t('admin.masterCodesDesc') || 'Manage dropdown values and system codes'}</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-ghost" onClick={handleExport}>
                            <Download size={16} /> {t('common.export') || 'Export'}
                        </button>
                        <button className="btn btn-ghost" onClick={() => setShowImportModal(true)}>
                            <Upload size={16} /> {t('common.import') || 'Import'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="admin-layout">
                {/* Sidebar - Code Types */}
                <div className="admin-sidebar">
                    <h4>{t('admin.codeTypes') || 'Code Types'}</h4>
                    <ul className="code-type-list">
                        {CODE_TYPES.map(type => (
                            <li
                                key={type.key}
                                className={activeType === type.key ? 'active' : ''}
                                onClick={() => {
                                    setActiveType(type.key);
                                    setSearchQuery('');
                                    setIsAddingNew(false);
                                }}
                            >
                                {activeType === type.key ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                {type.label}
                                <span className="code-count">{(codes[type.key] || []).filter(c => c.active !== false).length}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Content */}
                <div className="admin-content">
                    {/* Stats Bar */}
                    <div className="code-stats-bar mb-4">
                        <div className="code-stat">
                            <span className="code-stat-value">{stats.total}</span>
                            <span className="code-stat-label">{t('admin.totalCodes') || 'Total'}</span>
                        </div>
                        <div className="code-stat active">
                            <span className="code-stat-value">{stats.active}</span>
                            <span className="code-stat-label">{t('common.active') || 'Active'}</span>
                        </div>
                        <div className="code-stat inactive">
                            <span className="code-stat-value">{stats.inactive}</span>
                            <span className="code-stat-label">{t('common.inactive') || 'Inactive'}</span>
                        </div>
                    </div>

                    <div className="admin-toolbar">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder={t('admin.searchCodes') || 'Search codes...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                            />
                            {t('admin.showInactive') || 'Show Inactive'}
                        </label>
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsAddingNew(true)}
                        >
                            <Plus size={16} /> {t('admin.addCode') || 'Add Code'}
                        </button>
                    </div>

                    <div className="card">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('admin.code') || 'Code'}</th>
                                        <th>{t('admin.name') || 'Name'}</th>
                                        {extraFields.map(f => (
                                            <th key={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</th>
                                        ))}
                                        <th>{t('common.active') || 'Active'}</th>
                                        <th style={{ width: 120 }}>{t('columns.actions') || 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isAddingNew && (
                                        <tr className="editing-row">
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={newCode.code}
                                                    onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                                    placeholder={t('admin.code') || 'Code'}
                                                    autoFocus
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={newCode.name}
                                                    onChange={(e) => setNewCode(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder={t('admin.name') || 'Name'}
                                                />
                                            </td>
                                            {extraFields.map(f => (
                                                <td key={f}>
                                                    <input
                                                        type={f === 'color' ? 'color' : f === 'unitPrice' || f === 'multiplier' ? 'number' : 'text'}
                                                        className="form-input"
                                                        value={newCode[f] || ''}
                                                        onChange={(e) => setNewCode(prev => ({ ...prev, [f]: e.target.value }))}
                                                    />
                                                </td>
                                            ))}
                                            <td>-</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-icon btn-success" onClick={handleSaveNew} title={t('common.save') || 'Save'}>
                                                        <Save size={16} />
                                                    </button>
                                                    <button className="btn-icon btn-secondary" onClick={() => setIsAddingNew(false)} title={t('common.cancel') || 'Cancel'}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {filteredCodes.map(code => (
                                        <tr key={code.code} className={code.active === false ? 'inactive-row' : ''}>
                                            <td>
                                                <div className="code-cell">
                                                    <code className="code-badge">{code.code}</code>
                                                    <button
                                                        className="btn-icon-mini"
                                                        onClick={() => handleCopyCode(code.code)}
                                                        title={t('admin.copyCode') || 'Copy code'}
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                {editingCode === code.code ? (
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        defaultValue={code.name}
                                                        onBlur={(e) => {
                                                            handleUpdate(code.code, 'name', e.target.value);
                                                            setEditingCode(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleUpdate(code.code, 'name', e.target.value);
                                                                setEditingCode(null);
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setEditingCode(null);
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    code.name
                                                )}
                                            </td>
                                            {extraFields.map(f => (
                                                <td key={f}>
                                                    {f === 'color' ? (
                                                        <input
                                                            type="color"
                                                            value={code[f] || '#000000'}
                                                            onChange={(e) => handleUpdate(code.code, f, e.target.value)}
                                                            style={{ width: 40, height: 30, padding: 0, border: 'none' }}
                                                        />
                                                    ) : f === 'unitPrice' ? (
                                                        <span>RM {code[f] || 0}</span>
                                                    ) : (
                                                        code[f] || '-'
                                                    )}
                                                </td>
                                            ))}
                                            <td>
                                                <button
                                                    className={`btn-icon ${code.active !== false ? 'text-success' : 'text-muted'}`}
                                                    onClick={() => handleToggleActive(code.code, code.active !== false)}
                                                >
                                                    {code.active !== false ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => setEditingCode(code.code)}
                                                        title={t('common.edit') || 'Edit'}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {code.active !== false && (
                                                        <button
                                                            className="btn-icon text-error"
                                                            onClick={() => handleDelete(code.code)}
                                                            title={t('admin.deactivate') || 'Deactivate'}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCodes.length === 0 && !isAddingNew && (
                                        <tr>
                                            <td colSpan={4 + extraFields.length} className="text-center text-muted">
                                                {t('admin.noCodesFound') || 'No codes found'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Import Modal */}
                {showImportModal && (
                    <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    <Upload size={20} /> {t('admin.importCodes') || 'Import Codes'}
                                </h3>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3">{t('admin.importInstructions') || 'Paste JSON data to import codes. Existing codes will be skipped.'}</p>
                                <div className="form-group">
                                    <label className="form-label">{t('admin.jsonData') || 'JSON Data'}</label>
                                    <textarea
                                        className="form-input"
                                        rows={10}
                                        value={importData}
                                        onChange={(e) => setImportData(e.target.value)}
                                        placeholder='{ "codes": [{ "code": "ABC", "name": "Example" }] }'
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-ghost" onClick={() => setShowImportModal(false)}>
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button className="btn btn-primary" onClick={handleImport}>
                                    <CheckCircle size={16} /> {t('common.import') || 'Import'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
