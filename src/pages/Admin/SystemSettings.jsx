import { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/common/Toast';
import {
    Settings, Save, RotateCcw, DollarSign, Package, FileText,
    Bell, Globe, Clock, Database, AlertTriangle, CheckCircle, Info, Trash2
} from 'lucide-react';
import './Admin.css';

export default function SystemSettings() {
    const { settings, updateSettings, DEFAULT_SETTINGS } = useConfig();
    const { t, language, setLanguage } = useLanguage();
    const { clearAllData, containers, surveys, eors, repairOrders, washingOrders } = useData();
    const toast = useToast();
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const [formData, setFormData] = useState({
        autoApprovalThreshold: settings.autoApprovalThreshold ?? 100,
        defaultCurrency: settings.defaultCurrency ?? 'RM',
        containersPerPage: settings.containersPerPage ?? 200,
        // New settings
        enableNotifications: settings.enableNotifications ?? true,
        sessionTimeout: settings.sessionTimeout ?? 30,
        dateFormat: settings.dateFormat ?? 'DD/MM/YYYY',
        timeFormat: settings.timeFormat ?? '24h',
        enableAutoLogout: settings.enableAutoLogout ?? true,
        defaultSurveyType: settings.defaultSurveyType ?? 'DAMAGE',
        requirePhotoForSurvey: settings.requirePhotoForSurvey ?? true,
        showCostInList: settings.showCostInList ?? true,
        enableQuickActions: settings.enableQuickActions ?? true
    });

    const [hasChanges, setHasChanges] = useState(false);
    const [activeSection, setActiveSection] = useState('eor');

    const SECTIONS = [
        { id: 'eor', label: t('admin.eorSettings') || 'EOR / Approval', icon: FileText },
        { id: 'display', label: t('admin.displaySettings') || 'Display', icon: Package },
        { id: 'notifications', label: t('admin.notifications') || 'Notifications', icon: Bell },
        { id: 'localization', label: t('admin.localization') || 'Localization', icon: Globe },
        { id: 'workflow', label: t('admin.workflowSettings') || 'Workflow', icon: Clock },
        { id: 'data', label: t('admin.dataManagement') || 'Data Management', icon: Database }
    ];

    const handleClearAllData = () => {
        clearAllData();
        setShowClearConfirm(false);
        toast.success('All data cleared! Page will reload...');
        setTimeout(() => window.location.reload(), 1000);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateSettings(formData);
        setHasChanges(false);
        toast.success(t('admin.settingsSaved') || 'Settings saved successfully!');
    };

    const handleReset = () => {
        setFormData({
            autoApprovalThreshold: DEFAULT_SETTINGS.autoApprovalThreshold,
            defaultCurrency: DEFAULT_SETTINGS.defaultCurrency,
            containersPerPage: DEFAULT_SETTINGS.containersPerPage,
            enableNotifications: true,
            sessionTimeout: 30,
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            enableAutoLogout: true,
            defaultSurveyType: 'DAMAGE',
            requirePhotoForSurvey: true,
            showCostInList: true,
            enableQuickActions: true
        });
        setHasChanges(true);
        toast.info(t('admin.settingsReset') || 'Settings reset to defaults');
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">
                    <Settings size={24} />
                    <h1>{t('nav.systemSettings') || 'System Settings'}</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        className="btn btn-secondary"
                        onClick={handleReset}
                        title={t('admin.resetDefaults') || 'Reset to default values'}
                    >
                        <RotateCcw size={16} /> {t('admin.resetDefaults') || 'Reset Defaults'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={!hasChanges}
                    >
                        <Save size={16} /> {t('common.save') || 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="settings-layout">
                {/* Settings Sidebar */}
                <div className="settings-sidebar">
                    {SECTIONS.map(section => (
                        <button
                            key={section.id}
                            className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <section.icon size={18} />
                            <span>{section.label}</span>
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="settings-content">
                    {/* EOR Settings */}
                    {activeSection === 'eor' && (
                        <div className="settings-section-content">
                            <h3><FileText size={20} /> {t('admin.eorSettings') || 'EOR / Approval Settings'}</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.autoApprovalThreshold') || 'Auto-Approval Threshold'}</label>
                                    <p className="setting-description">
                                        {t('admin.autoApprovalDesc') || 'EORs with total cost at or below this amount will be automatically approved without requiring liner confirmation.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <div className="input-with-prefix">
                                        <span className="input-prefix">RM</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.autoApprovalThreshold}
                                            onChange={(e) => handleChange('autoApprovalThreshold', parseInt(e.target.value) || 0)}
                                            min="0"
                                            step="10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.defaultCurrency') || 'Default Currency'}</label>
                                    <p className="setting-description">
                                        {t('admin.currencyDesc') || 'Currency used for all cost calculations and displays.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <select
                                        className="form-input"
                                        value={formData.defaultCurrency}
                                        onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                                    >
                                        <option value="RM">RM (Malaysian Ringgit)</option>
                                        <option value="USD">USD (US Dollar)</option>
                                        <option value="SGD">SGD (Singapore Dollar)</option>
                                        <option value="EUR">EUR (Euro)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.showCostInList') || 'Show Cost in List Views'}</label>
                                    <p className="setting-description">
                                        {t('admin.showCostDesc') || 'Display cost information in list views for EORs and repair orders.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.showCostInList}
                                            onChange={(e) => handleChange('showCostInList', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Display Settings */}
                    {activeSection === 'display' && (
                        <div className="settings-section-content">
                            <h3><Package size={20} /> {t('admin.displaySettings') || 'Display Settings'}</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.containersPerPage') || 'Containers Per Page'}</label>
                                    <p className="setting-description">
                                        {t('admin.containersDesc') || 'Number of containers to display per page in the container list.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <select
                                        className="form-input"
                                        value={formData.containersPerPage}
                                        onChange={(e) => handleChange('containersPerPage', parseInt(e.target.value))}
                                    >
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={200}>200</option>
                                        <option value={500}>500</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.enableQuickActions') || 'Enable Quick Actions'}</label>
                                    <p className="setting-description">
                                        {t('admin.quickActionsDesc') || 'Show quick action buttons in list views for faster operations.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.enableQuickActions}
                                            onChange={(e) => handleChange('enableQuickActions', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeSection === 'notifications' && (
                        <div className="settings-section-content">
                            <h3><Bell size={20} /> {t('admin.notifications') || 'Notification Settings'}</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.enableNotifications') || 'Enable Notifications'}</label>
                                    <p className="setting-description">
                                        {t('admin.notificationsDesc') || 'Show in-app notifications for important events.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.enableNotifications}
                                            onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.sessionTimeout') || 'Session Timeout (minutes)'}</label>
                                    <p className="setting-description">
                                        {t('admin.sessionDesc') || 'Auto-logout after inactivity period.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <select
                                        className="form-input"
                                        value={formData.sessionTimeout}
                                        onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>1 hour</option>
                                        <option value={120}>2 hours</option>
                                        <option value={0}>Never</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.enableAutoLogout') || 'Enable Auto Logout'}</label>
                                    <p className="setting-description">
                                        {t('admin.autoLogoutDesc') || 'Automatically log out users after the session timeout.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.enableAutoLogout}
                                            onChange={(e) => handleChange('enableAutoLogout', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Localization Settings */}
                    {activeSection === 'localization' && (
                        <div className="settings-section-content">
                            <h3><Globe size={20} /> {t('admin.localization') || 'Localization Settings'}</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.language') || 'Language'}</label>
                                    <p className="setting-description">
                                        {t('admin.languageDesc') || 'Select the interface language.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <select
                                        className="form-input"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                    >
                                        <option value="en">English</option>
                                        <option value="ms">Bahasa Melayu</option>
                                        <option value="zh">中文 (Chinese)</option>
                                        <option value="vi">Tiếng Việt</option>
                                        <option value="ko">한국어 (Korean)</option>
                                        <option value="pt">Português</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.dateFormat') || 'Date Format'}</label>
                                    <p className="setting-description">
                                        {t('admin.dateFormatDesc') || 'Format for displaying dates throughout the application.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <select
                                        className="form-input"
                                        value={formData.dateFormat}
                                        onChange={(e) => handleChange('dateFormat', e.target.value)}
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.timeFormat') || 'Time Format'}</label>
                                    <p className="setting-description">
                                        {t('admin.timeFormatDesc') || 'Format for displaying time.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <select
                                        className="form-input"
                                        value={formData.timeFormat}
                                        onChange={(e) => handleChange('timeFormat', e.target.value)}
                                    >
                                        <option value="24h">24-hour (14:30)</option>
                                        <option value="12h">12-hour (2:30 PM)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Workflow Settings */}
                    {activeSection === 'workflow' && (
                        <div className="settings-section-content">
                            <h3><Clock size={20} /> {t('admin.workflowSettings') || 'Workflow Settings'}</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.defaultSurveyType') || 'Default Survey Type'}</label>
                                    <p className="setting-description">
                                        {t('admin.surveyTypeDesc') || 'Default survey type when creating new surveys.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <select
                                        className="form-input"
                                        value={formData.defaultSurveyType}
                                        onChange={(e) => handleChange('defaultSurveyType', e.target.value)}
                                    >
                                        <option value="DAMAGE">Damage Survey</option>
                                        <option value="GATE_IN">Gate In Survey</option>
                                        <option value="GATE_OUT">Gate Out Survey</option>
                                        <option value="PERIODIC">Periodic Survey</option>
                                    </select>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.requirePhoto') || 'Require Photo for Survey'}</label>
                                    <p className="setting-description">
                                        {t('admin.requirePhotoDesc') || 'Make at least one photo mandatory when completing surveys.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.requirePhotoForSurvey}
                                            onChange={(e) => handleChange('requirePhotoForSurvey', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Data Management */}
                    {activeSection === 'data' && (
                        <div className="settings-section-content">
                            <h3><Database size={20} /> {t('admin.dataManagement') || 'Data Management'}</h3>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <label className="setting-label">{t('admin.currentData') || 'Current Data'}</label>
                                    <p className="setting-description">
                                        {t('admin.dataOverview') || 'Overview of data stored in the system.'}
                                    </p>
                                </div>
                                <div className="setting-control" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                    <span className="badge badge-info">{containers.length} Containers</span>
                                    <span className="badge badge-primary">{surveys.length} Surveys</span>
                                    <span className="badge badge-warning">{eors.length} EORs</span>
                                    <span className="badge badge-secondary">{repairOrders.length} Repairs</span>
                                    <span className="badge badge-success">{washingOrders.length} Washing</span>
                                </div>
                            </div>

                            <div className="setting-item" style={{ borderColor: 'var(--error-200)', background: 'rgba(255,77,79,0.05)' }}>
                                <div className="setting-info">
                                    <label className="setting-label" style={{ color: 'var(--error-600)' }}>
                                        <AlertTriangle size={16} style={{ marginRight: '8px' }} />
                                        {t('admin.clearAllData') || 'Clear All Data'}
                                    </label>
                                    <p className="setting-description">
                                        {t('admin.clearDataDesc') || 'Permanently delete all containers, surveys, EORs, repair orders, and washing data. This action cannot be undone.'}
                                    </p>
                                </div>
                                <div className="setting-control">
                                    {!showClearConfirm ? (
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => setShowClearConfirm(true)}
                                        >
                                            <Trash2 size={16} /> {t('admin.clearData') || 'Clear All Data'}
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--error-600)', fontWeight: 500, fontSize: '13px' }}>Are you sure?</span>
                                            <button className="btn btn-danger btn-sm" onClick={handleClearAllData}>
                                                Yes, Delete All
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setShowClearConfirm(false)}>
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Summary */}
                    <div className="settings-summary-card">
                        <h4><Info size={16} /> {t('admin.currentSettings') || 'Current Settings Summary'}</h4>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <DollarSign size={14} />
                                <span>{t('admin.autoApproval') || 'Auto-approval'}: <strong>RM {settings.autoApprovalThreshold || 100}</strong></span>
                            </div>
                            <div className="summary-item">
                                <Package size={14} />
                                <span>{t('admin.perPage') || 'Per page'}: <strong>{settings.containersPerPage || 200}</strong></span>
                            </div>
                            <div className="summary-item">
                                <Globe size={14} />
                                <span>{t('admin.language') || 'Language'}: <strong>{language.toUpperCase()}</strong></span>
                            </div>
                            <div className="summary-item">
                                <Clock size={14} />
                                <span>{t('admin.timeout') || 'Timeout'}: <strong>{formData.sessionTimeout} min</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
