import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useWorkflow } from '../../context/WorkflowContext';
import { Bell, LogOut, User, Menu, Key, ChevronDown, Globe, ClipboardList, ArrowRight, X, Sun, Moon, Sunrise } from 'lucide-react';
import './Header.css';

// Get time-based greeting
const getGreeting = (t) => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return { text: t?.('greetings.goodMorning') || 'Good Morning', icon: Sunrise };
    } else if (hour >= 12 && hour < 17) {
        return { text: t?.('greetings.goodAfternoon') || 'Good Afternoon', icon: Sun };
    } else {
        return { text: t?.('greetings.goodEvening') || 'Good Evening', icon: Moon };
    }
};

export default function Header({ onMenuToggle }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { t, language, languages, changeLanguage } = useLanguage();
    const { containers } = useData();
    const { togglePanel, isPanelOpen, selectContainer } = useWorkflow();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const userMenuRef = useRef(null);
    const notificationRef = useRef(null);

    // Get DAMAGED containers
    const damagedContainers = containers.filter(c => c.status === 'DM');
    const notificationCount = damagedContainers.length;

    // Get greeting based on time
    const greeting = getGreeting(t);
    const GreetingIcon = greeting.icon;

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getPageTitle = () => {
        const pageTitles = {
            '/': t('nav.dashboard'),
            '/containers': t('nav.allContainers'),
            '/containers/ar': t('nav.arContainers'),
            '/containers/register': t('nav.registerContainer'),
            '/surveys': t('nav.surveyList'),
            '/surveys/search': t('nav.newSurvey'),
            '/eor': t('nav.eorList'),
            '/repair-orders': t('nav.repairOrders'),
            '/shunting': t('nav.shunting'),
            '/pre-inspection': t('nav.preInspection'),
            '/stacking': t('nav.stackingRelease'),
            '/admin/codes': t('nav.masterCodes'),
            '/admin/groups': t('nav.permissionGroups'),
            '/admin/users': t('nav.userManagement'),
            '/admin/settings': t('nav.systemSettings')
        };

        // Check for exact match first
        if (pageTitles[location.pathname]) {
            return pageTitles[location.pathname];
        }

        // Check for dynamic routes
        if (location.pathname.startsWith('/surveys/new')) return t('survey.newSurvey');
        if (location.pathname.startsWith('/surveys/')) return t('survey.title');
        if (location.pathname.startsWith('/eor/new')) return t('eor.createEOR');
        if (location.pathname.startsWith('/eor/')) return t('eor.title');
        if (location.pathname.startsWith('/containers/')) return t('container.title');

        return 'M&R System';
    };

    const handleLogout = () => {
        setShowUserMenu(false);
        logout();
    };

    const handleChangePassword = () => {
        setShowUserMenu(false);
        setShowChangePassword(true);
    };

    const handleStartSurvey = (container) => {
        setShowNotifications(false);
        selectContainer(container.id);
        navigate(`/surveys/new/${container.id}`);
    };

    const handleViewContainer = (container) => {
        setShowNotifications(false);
        selectContainer(container.id);
    };

    return (
        <>
            <header className="header">
                <div className="header-left">
                    {/* Mobile menu button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={onMenuToggle}
                        aria-label="Toggle menu"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="header-title">{getPageTitle()}</h1>
                </div>

                <div className="header-right">
                    {/* Language selector */}
                    <div className="header-language">
                        <Globe size={18} />
                        <select
                            value={language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="language-select-mini"
                        >
                            {Object.values(languages).map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.flag}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Workflow Panel Toggle */}
                    <button
                        className={`header-btn ${isPanelOpen ? 'active' : ''}`}
                        onClick={togglePanel}
                        title="Workflow Guide"
                    >
                        <ClipboardList size={20} />
                    </button>

                    {/* Notifications */}
                    <div className="header-notifications" ref={notificationRef}>
                        <button
                            className={`header-btn ${showNotifications ? 'active' : ''}`}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell size={20} />
                            {notificationCount > 0 && (
                                <span className="notification-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <span>🔔 Damaged Containers</span>
                                    <button className="btn btn-ghost btn-icon btn-xs" onClick={() => setShowNotifications(false)}>
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="notification-list">
                                    {damagedContainers.length > 0 ? (
                                        <>
                                            {damagedContainers.slice(0, 5).map(container => (
                                                <div key={container.id} className="notification-item">
                                                    <div className="notification-info">
                                                        <strong>{container.containerNumber}</strong>
                                                        <span>{container.liner} • {container.size}ft</span>
                                                    </div>
                                                    <div className="notification-actions">
                                                        <button
                                                            className="btn btn-primary btn-xs"
                                                            onClick={() => handleStartSurvey(container)}
                                                        >
                                                            Survey
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-xs"
                                                            onClick={() => handleViewContainer(container)}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {damagedContainers.length > 5 && (
                                                <div className="notification-more">
                                                    +{damagedContainers.length - 5} more containers
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="notification-empty">
                                            <span>✓ No damaged containers</span>
                                        </div>
                                    )}
                                </div>
                                <div className="notification-footer">
                                    <button
                                        className="btn btn-secondary btn-sm btn-block"
                                        onClick={() => { setShowNotifications(false); navigate('/containers?status=DM'); }}
                                    >
                                        View All Damaged <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User dropdown */}
                    <div className="header-user-dropdown" ref={userMenuRef}>
                        <button
                            className="header-user"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <div className="header-avatar">
                                <User size={18} />
                            </div>
                            <div className="header-user-info hide-mobile">
                                <span className="header-greeting">
                                    <GreetingIcon size={14} />
                                    {greeting.text}, <strong>{user?.fullName || user?.username}</strong>
                                </span>
                                <span className="header-role">{user?.groups?.[0] || 'User'}</span>
                            </div>
                            <ChevronDown size={16} className="hide-mobile" />
                        </button>

                        {showUserMenu && (
                            <div className="user-dropdown-menu">
                                <div className="dropdown-user-info">
                                    <strong>{user?.fullName || user?.username}</strong>
                                    <span>{user?.email || ''}</span>
                                </div>
                                <div className="dropdown-divider" />
                                <button className="dropdown-item" onClick={handleChangePassword}>
                                    <Key size={16} />
                                    <span>{t('auth.changePassword') || 'Change Password'}</span>
                                </button>
                                <button className="dropdown-item danger" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>{t('common.logout')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Change Password Modal */}
            {showChangePassword && (
                <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
            )}
        </>
    );
}

// Change Password Modal Component
function ChangePasswordModal({ onClose }) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { updateUserPassword } = useConfig();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError(t('auth.passwordMismatch') || 'Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError(t('auth.passwordTooShort') || 'Password must be at least 6 characters');
            return;
        }

        // Try to update password
        const result = updateUserPassword?.(user?.id, formData.currentPassword, formData.newPassword);

        if (result?.success) {
            setSuccess(true);
            setTimeout(onClose, 1500);
        } else {
            setError(result?.error || t('auth.currentPasswordWrong') || 'Current password is incorrect');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{t('auth.changePassword') || 'Change Password'}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="form-error" style={{ marginBottom: 'var(--space-3)' }}>{error}</div>}
                        {success && (
                            <div className="form-success" style={{ marginBottom: 'var(--space-3)', color: 'var(--success-500)' }}>
                                {t('auth.passwordChanged') || 'Password changed successfully!'}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">{t('auth.currentPassword') || 'Current Password'}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={formData.currentPassword}
                                onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('auth.newPassword') || 'New Password'}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={formData.newPassword}
                                onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('auth.confirmPassword') || 'Confirm Password'}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
