import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import {
    Container, Shield, AlertCircle, Globe, Megaphone,
    HelpCircle, ShoppingCart, ChevronRight, CheckCircle,
    Headphones, Menu, X, LifeBuoy, ExternalLink, Anchor, Lock
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { LiveChatButton, LiveChatWidget } from '../components/LiveChat';
import './Login.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('shippingAgent');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [justLoggedIn, setJustLoggedIn] = useState(false);
    const { login, isAuthenticated, user } = useAuth();
    const { getAnnouncements, getLinks, getBenefits, getWelcomeText, getCodeList } = useConfig();
    const { t, language, languages, changeLanguage } = useLanguage();
    const navigate = useNavigate();
    const toast = useToast();

    const announcements = getAnnouncements();
    const links = getLinks();
    const benefits = getBenefits();
    const welcomeText = getWelcomeText();

    // Redirect already-authenticated users (but not if we're showing the success modal)
    // EXTERNAL users are allowed to stay on the login/portal page
    useEffect(() => {
        if (isAuthenticated && !showSuccessModal && !justLoggedIn && user?.userType !== 'EXTERNAL') {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, showSuccessModal, justLoggedIn, navigate, user]);

    // Get liners list for shipping line name lookup
    const liners = getCodeList?.('LINERS') || [];

    // Get shipping line name for a user
    const getShippingLineName = (user) => {
        if (user?.shippingLineCode) {
            const liner = liners.find(l => l.code === user.shippingLineCode);
            return liner?.name || user.shippingLineCode;
        }
        return null;
    };

    // Map tab keys to role types for benefits
    const tabToRoleType = {
        shippingAgent: 'Shipping Agent',
        forwardingAgent: 'Forwarding Agent',
        shipperConsignee: 'Shipper/Consignee'
    };

    const activeBenefit = benefits.find(b => b.roleType === tabToRoleType[activeTab]) || benefits[0];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const result = login(username, password);
        if (result.success) {
            // Close login modal and show success modal
            setShowLoginModal(false);
            setJustLoggedIn(true);
            setLoggedInUser(result.user);
            setShowSuccessModal(true);
        } else {
            setError(t('auth.loginError'));
        }
        setIsLoading(false);
    };

    const handleSuccessModalOk = () => {
        setShowSuccessModal(false);
        // All users stay on portal page - they must click Access System to enter
        setUsername('');
        setPassword('');
        // Reset the login state
        setJustLoggedIn(false);
    };

    // Handle Login click - open login modal
    const handleLoginClick = (e) => {
        e?.preventDefault();
        setShowLoginModal(true);
    };

    // Navigation items with translation keys
    const navItems = [
        { key: 'home', label: t('portal.home'), isActive: true },
        { key: 'about', label: t('portal.about') },
        { key: 'services', label: t('portal.services') },
        { key: 'contactUs', label: t('portal.contactUs') },
        { key: 'generalEnquiry', label: t('portal.generalEnquiry') },
        { key: 'registration', label: t('portal.registration') },
        { key: 'accessSystem', label: t('portal.accessSystem') || 'Access System', onClick: handleAccessSystem }
    ];

    // Time-based greeting helper
    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return t('greetings.goodMorning') || 'Good Morning';
        if (hour >= 12 && hour < 18) return t('greetings.goodAfternoon') || 'Good Afternoon';
        return t('greetings.goodEvening') || 'Good Evening';
    };

    // Get user display name based on user type
    const getUserDisplayName = (userObj) => {
        if (userObj?.userType === 'EXTERNAL' && userObj?.shippingLineCode) {
            const liner = liners.find(l => l.code === userObj.shippingLineCode);
            return liner?.name || userObj.shippingLineCode;
        }
        return userObj?.fullName || 'User';
    };

    // Handle Access System click
    function handleAccessSystem(e) {
        e?.preventDefault();
        if (!isAuthenticated) {
            toast.error(t('auth.pleaseLoginFirst') || 'Please login first to access the system.');
            return;
        }
        // User is authenticated - validate authority and navigate
        navigate('/');
    }

    // Role tabs with translation keys
    const roleTabs = [
        { key: 'shippingAgent', label: t('portal.shippingAgent') },
        { key: 'forwardingAgent', label: t('portal.forwardingAgent') },
        { key: 'shipperConsignee', label: t('portal.shipperConsignee') }
    ];

    // Get welcome message - show shipping line name for authenticated external users
    const getWelcomeEyebrow = () => {
        // Check if user is authenticated and is EXTERNAL
        if (user?.userType === 'EXTERNAL' && user?.shippingLineCode) {
            const liner = liners.find(l => l.code === user.shippingLineCode);
            const shippingLineName = liner?.name || user.shippingLineCode;
            return `WELCOME ${shippingLineName.toUpperCase()}`;
        }
        return t('portal.welcomeTo');
    };

    return (
        <div className="alt-portal">
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="alt-modal-overlay">
                    <div className="alt-success-modal">
                        <div className="alt-success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h2>{t('auth.loginSuccess') || 'Login Successful'}</h2>
                        <p>
                            {`${getTimeBasedGreeting()}, ${getUserDisplayName(loggedInUser)}!`}
                            <br />
                            {t('auth.loginSuccessMessage') || 'You have logged in successfully.'}
                        </p>
                        <button className="alt-modal-btn" onClick={handleSuccessModalOk}>
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className="alt-modal-overlay" onClick={() => setShowLoginModal(false)}>
                    <div className="alt-login-modal" onClick={e => e.stopPropagation()}>
                        <button className="alt-login-modal-close" onClick={() => setShowLoginModal(false)}>
                            <X size={20} />
                        </button>
                        <div className="alt-login-modal-header">
                            <div className="alt-login-modal-logo">
                                <img src="/logo.jpg" alt="TIIT TECH" />
                            </div>
                            <h2>{t('auth.userLogin') || 'User Login'}</h2>
                            <p>{t('auth.enterCredentials') || 'Enter your credentials to access the system'}</p>
                        </div>
                        <form onSubmit={handleSubmit} className="alt-login-modal-form">
                            {error && (
                                <div className="alt-error">
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="alt-form-group">
                                <label>{t('auth.username') || 'Username'}</label>
                                <input
                                    type="text"
                                    placeholder={t('auth.enterUsername') || 'Enter username'}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="alt-form-group">
                                <label>{t('auth.password') || 'Password'}</label>
                                <input
                                    type="password"
                                    placeholder={t('auth.enterPassword') || 'Enter password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="alt-login-submit" disabled={isLoading}>
                                {isLoading ? '...' : (t('auth.loginButton') || 'Sign In')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="alt-header" role="banner">
                <div className="alt-header-left">
                    <button
                        className="alt-menu-btn"
                        onClick={() => setMobileNavOpen(!mobileNavOpen)}
                        aria-label="Toggle navigation"
                    >
                        {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="alt-logo">
                        <div className="alt-logo-icon">
                            <img src="/logo.jpg" alt="TIIT TECH" className="alt-logo-image" />
                        </div>
                        <div className="alt-logo-text">
                            <span className="alt-brand">TIIT TECH</span>
                            <span className="alt-subtitle">{t('portal.containerPortal')}</span>
                        </div>
                    </div>
                </div>
                <div className="alt-header-right">
                    {isAuthenticated && user && (
                        <div className="alt-user-greeting">
                            <span className="alt-greeting-text">
                                {getTimeBasedGreeting()}, {getUserDisplayName(user)}
                            </span>
                            <span className={`alt-user-type-badge ${user.userType === 'INTERNAL' ? 'internal' : 'external'}`}>
                                {user.userType === 'INTERNAL' ? t('admin.internal') : t('admin.external')}
                            </span>
                        </div>
                    )}
                    <div className="alt-lang" aria-label={t('auth.selectLanguage')}>
                        <Globe size={16} />
                        <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
                            {Object.values(languages).map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {/* Desktop Navigation Bar */}
            <nav className="alt-topnav" role="navigation" aria-label="Main navigation">
                {navItems.map((item) => (
                    <a
                        key={item.key}
                        href="#"
                        className={`alt-topnav-item ${item.isActive ? 'active' : ''} ${item.isEmphasized ? 'emphasized' : ''}`}
                        onClick={item.onClick || undefined}
                    >
                        {item.label}
                    </a>
                ))}
            </nav>

            {/* Mobile Nav Drawer */}
            <nav className={`alt-drawer ${mobileNavOpen ? 'open' : ''}`} role="navigation">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.key}>
                            <a href="#" onClick={(e) => {
                                setMobileNavOpen(false);
                                if (item.onClick) item.onClick(e);
                            }}>{item.label}</a>
                        </li>
                    ))}
                </ul>
                <p className="alt-drawer-footer">TIIT TECH · Container Management</p>
            </nav>
            {mobileNavOpen && <div className="alt-overlay" onClick={() => setMobileNavOpen(false)} />}

            {/* Main Content */}
            <main className="alt-main" role="main">
                {/* Welcome Section */}
                <div className="alt-welcome-section">
                    <p className="alt-eyebrow">{getWelcomeEyebrow()}</p>
                    <h1 className="alt-welcome-title">{welcomeText.titleLine || 'SINGLE ACCESS FOR SHIPPING AGENTS, FORWARDING AGENTS AND SHIPPERS / CONSIGNEES.'}</h1>
                    <p className="alt-welcome-subtitle">{welcomeText.subtitleLine || 'Manage container operations, track cargo and access Johor Port services from a unified, secure interface.'}</p>
                </div>

                {/* Feature Images Row */}
                <div className="alt-features">
                    <div className="alt-feature-img">
                        <img src="/feature-1.jpg" alt={t('portal.containerOperations')} />
                        <span className="alt-feature-label">{t('portal.containerOperations')}</span>
                    </div>
                    <div className="alt-feature-img">
                        <img src="/feature-2.jpg" alt={t('portal.qualityAssurance')} />
                        <span className="alt-feature-label">{t('portal.qualityAssurance')}</span>
                    </div>
                    <div className="alt-feature-img">
                        <img src="/feature-3.jpg" alt={t('portal.support247')} />
                        <span className="alt-feature-label">{t('portal.support247')}</span>
                    </div>
                </div>

                {/* Main Grid: Left (Benefit+Login) | Announcement | Links */}
                <div className="alt-main-grid">
                    {/* Left Column: Benefit Section (Expanded) */}
                    <div className="alt-left-col">
                        {/* Role Tabs + Benefit - Expanded */}
                        <div className="alt-role-card alt-role-card-expanded">
                            <div className="alt-tabs">
                                {roleTabs.map(role => (
                                    <button
                                        key={role.key}
                                        className={activeTab === role.key ? 'active' : ''}
                                        onClick={() => setActiveTab(role.key)}
                                    >
                                        {role.label}
                                    </button>
                                ))}
                            </div>
                            <div className="alt-benefit alt-benefit-expanded">
                                <span className="alt-benefit-badge">{t('portal.benefit')}</span>
                                <p>{activeBenefit?.content || 'TIIT TECH Container Management System will help you in carrying your day-to-day business transaction in simple way and effortlessly'}</p>
                                <div className="alt-benefit-features">
                                    <div className="alt-benefit-feature">
                                        <CheckCircle size={16} />
                                        <span>{t('portal.containerOperations') || 'Container Operations'}</span>
                                    </div>
                                    <div className="alt-benefit-feature">
                                        <CheckCircle size={16} />
                                        <span>{t('portal.qualityAssurance') || 'Quality Assurance'}</span>
                                    </div>
                                    <div className="alt-benefit-feature">
                                        <CheckCircle size={16} />
                                        <span>{t('portal.support247') || '24/7 Support'}</span>
                                    </div>
                                </div>
                                <button className="alt-login-btn" onClick={handleLoginClick}>
                                    <Lock size={16} />
                                    {t('auth.login') || 'Login'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Announcements */}
                    <div className="alt-panel announcements-panel">
                        <h3><Megaphone size={16} /> {t('portal.announcement')}</h3>
                        <div className="alt-panel-content auto-scroll">
                            {announcements.length === 0 ? (
                                <ul>
                                    <li><ChevronRight size={12} /> Implementation of new Safety And Security System</li>
                                    <li><ChevronRight size={12} /> Introduction of new Dangerous Cargo declaration system</li>
                                    {/* Duplicate for seamless scroll */}
                                    <li><ChevronRight size={12} /> Implementation of new Safety And Security System</li>
                                    <li><ChevronRight size={12} /> Introduction of new Dangerous Cargo declaration system</li>
                                </ul>
                            ) : (
                                <ul>
                                    {/* Original items */}
                                    {announcements.map(ann => (
                                        <li key={ann.id}>
                                            <ChevronRight size={12} />
                                            <div>
                                                <strong>{ann.title}</strong>
                                                {ann.content && <p>{ann.content}</p>}
                                            </div>
                                        </li>
                                    ))}
                                    {/* Duplicate items for seamless loop */}
                                    {announcements.map(ann => (
                                        <li key={`${ann.id}-dup`}>
                                            <ChevronRight size={12} />
                                            <div>
                                                <strong>{ann.title}</strong>
                                                {ann.content && <p>{ann.content}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Links */}
                    <div className="alt-panel links-panel">
                        <h3><ExternalLink size={16} /> {t('portal.links')}</h3>
                        <div className="alt-panel-content auto-scroll">
                            {links.length === 0 ? (
                                <ul>
                                    <li><a href="#">Lembaga Pelabuhan Johor</a></li>
                                    <li><a href="#">Kastam Diraja Malaysia</a></li>
                                    <li><a href="#">MAQIS</a></li>
                                    <li><a href="#">Kementerian Kesihatan Malaysia</a></li>
                                    {/* Duplicate for seamless scroll */}
                                    <li><a href="#">Lembaga Pelabuhan Johor</a></li>
                                    <li><a href="#">Kastam Diraja Malaysia</a></li>
                                    <li><a href="#">MAQIS</a></li>
                                    <li><a href="#">Kementerian Kesihatan Malaysia</a></li>
                                </ul>
                            ) : (
                                <ul>
                                    {/* Original items */}
                                    {links.map(link => (
                                        <li key={link.id}>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>
                                        </li>
                                    ))}
                                    {/* Duplicate items for seamless loop */}
                                    {links.map(link => (
                                        <li key={`${link.id}-dup`}>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="alt-actions">
                    <button className="alt-action danger">
                        <LifeBuoy size={20} />
                        <span>{t('portal.helpDesk')}</span>
                    </button>
                    <button className="alt-action glass">
                        <Globe size={20} />
                        <span>{t('portal.networkInfrastructure')}</span>
                    </button>
                    <a href="#" className="alt-action green">
                        <ShoppingCart size={20} />
                        <span>{t('portal.onlineMarketplace')}</span>
                    </a>
                    <button className="alt-action glass">
                        <HelpCircle size={20} />
                        <span>{t('portal.faq')}</span>
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="alt-footer" role="contentinfo">
                <span>© TIIT TECH</span>
                <span>Container Management System</span>
            </footer>

            {/* Live Chat */}
            <LiveChatButton />
            <LiveChatWidget />
        </div>
    );
}
