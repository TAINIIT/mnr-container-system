import { useState } from 'react';
import {
    Shield, AlertCircle, Globe, Megaphone,
    HelpCircle, ShoppingCart, ChevronRight, CheckCircle,
    Headphones, Menu, X, LifeBuoy, ExternalLink, Anchor, Lock
} from 'lucide-react';
import './LoginTemplate.css';

export default function LoginTemplate() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('shippingAgent');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Mock Data
    const announcements = [
        { id: 1, title: 'Implementation of new Safety And Security System', content: 'Details about safety system...' },
        { id: 2, title: 'Introduction of new Dangerous Cargo declaration system', content: 'Details about cargo system...' }
    ];

    const links = [
        { id: 1, title: 'Lembaga Pelabuhan Johor', url: '#' },
        { id: 2, title: 'Kastam Diraja Malaysia', url: '#' },
        { id: 3, title: 'MAQIS', url: '#' },
        { id: 4, title: 'Kementerian Kesihatan Malaysia', url: '#' }
    ];

    const benefits = [
        { roleType: 'Shipping Agent', content: 'Johor Port Portal will help you in carrying your day-to-day business transaction in simple way and effortlessly' },
        { roleType: 'Forwarding Agent', content: 'Streamline your forwarding operations with real-time tracking and easy documentation.' },
        { roleType: 'Shipper/Consignee', content: 'Direct access to cargo status and simplified billing processes.' }
    ];

    const tabToRoleType = {
        shippingAgent: 'Shipping Agent',
        forwardingAgent: 'Forwarding Agent',
        shipperConsignee: 'Shipper/Consignee'
    };

    const activeBenefit = benefits.find(b => b.roleType === tabToRoleType[activeTab]) || benefits[0];

    const roleTabs = [
        { key: 'shippingAgent', label: 'Authorized Shipping Agent' },
        { key: 'forwardingAgent', label: 'Forwarding Agent' },
        { key: 'shipperConsignee', label: 'Shipper / Consignee' }
    ];

    const navItems = [
        { key: 'home', label: 'Home', isActive: true },
        { key: 'about', label: 'About Us' },
        { key: 'services', label: 'Services' },
        { key: 'contactUs', label: 'Contact Us' },
        { key: 'generalEnquiry', label: 'General Enquiry' },
        { key: 'registration', label: 'Registration' },
        { key: 'login', label: 'Login', isEmphasized: true },
        { key: 'accessSystem', label: 'Access System' },
        { key: 'helpDesk', label: 'Help Desk' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Login attempt:', { username, password });
        setShowSuccessModal(true);
        setIsLoading(false);
    };

    const handleSuccessModalOk = () => {
        setShowSuccessModal(false);
        setUsername('');
        setPassword('');
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
                        <h2>Login Successful</h2>
                        <p>
                            Welcome back!
                            <br />
                            You have logged in successfully.
                        </p>
                        <button className="alt-modal-btn" onClick={handleSuccessModalOk}>
                            OK
                        </button>
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
                            <Anchor size={22} />
                        </div>
                        <div className="alt-logo-text">
                            <span className="alt-brand">JOHOR PORT</span>
                            <span className="alt-subtitle">CONTAINER PORTAL</span>
                        </div>
                    </div>
                </div>
                <div className="alt-header-right">
                    <div className="alt-lang">
                        <Globe size={16} />
                        <select>
                            <option value="en">🇺🇸 English</option>
                            <option value="ms">🇲🇾 Bahasa Melayu</option>
                        </select>
                    </div>
                    <button className="alt-help-outline">
                        <LifeBuoy size={16} />
                        <span>Help Desk</span>
                    </button>
                </div>
            </header>

            {/* Desktop Navigation Bar */}
            <nav className="alt-topnav" role="navigation" aria-label="Main navigation">
                {navItems.map((item) => (
                    <a
                        key={item.key}
                        href="#"
                        className={`alt-topnav-item ${item.isActive ? 'active' : ''} ${item.isEmphasized ? 'emphasized' : ''}`}
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
                            <a href="#" onClick={() => setMobileNavOpen(false)}>{item.label}</a>
                        </li>
                    ))}
                </ul>
                <p className="alt-drawer-footer">JOHOR PORT BERHAD · 14</p>
            </nav>
            {mobileNavOpen && <div className="alt-overlay" onClick={() => setMobileNavOpen(false)} />}

            {/* Main Content */}
            <main className="alt-main" role="main">
                {/* Welcome Section */}
                <div className="alt-welcome-section">
                    <p className="alt-eyebrow">WELCOME TO</p>
                    <h1 className="alt-welcome-title">SINGLE ACCESS FOR SHIPPING AGENTS, FORWARDING AGENTS AND SHIPPERS / CONSIGNEES.</h1>
                    <p className="alt-welcome-subtitle">Manage container operations, track cargo and access Johor Port services from a unified, secure interface.</p>
                </div>

                {/* Feature Images Row */}
                <div className="alt-features">
                    <div className="alt-feature-img">
                        <div style={{ width: '100%', height: '100%', background: '#1e4095' }} />
                        <span className="alt-feature-label">Container Operations</span>
                    </div>
                    <div className="alt-feature-img">
                        <div style={{ width: '100%', height: '100%', background: '#0a3d62' }} />
                        <span className="alt-feature-label">Quality Assurance</span>
                    </div>
                    <div className="alt-feature-img">
                        <div style={{ width: '100%', height: '100%', background: '#20bf6b' }} />
                        <span className="alt-feature-label">24/7 Support</span>
                    </div>
                </div>

                {/* Main Grid: Left (Benefit+Login) | Announcement | Links */}
                <div className="alt-main-grid">
                    {/* Left Column: Benefit + Login */}
                    <div className="alt-left-col">
                        {/* Role Tabs + Benefit */}
                        <div className="alt-role-card">
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
                            <div className="alt-benefit">
                                <span className="alt-benefit-badge">BENEFIT</span>
                                <p>{activeBenefit?.content}</p>
                            </div>
                        </div>

                        {/* Compact Login Card */}
                        <div className="alt-login-compact">
                            <h3>USER LOGIN</h3>
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="alt-error">
                                        <AlertCircle size={14} />
                                        <span>{error}</span>
                                    </div>
                                )}
                                <div className="alt-login-row">
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button type="submit" disabled={isLoading}>
                                        {isLoading ? '...' : 'Login'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Middle Column: Announcements */}
                    <div className="alt-panel announcements-panel">
                        <h3><Megaphone size={16} /> ANNOUNCEMENT</h3>
                        <div className="alt-panel-content">
                            <ul>
                                {announcements.map(ann => (
                                    <li key={ann.id}>
                                        <ChevronRight size={12} />
                                        <div>
                                            <strong>{ann.title}</strong>
                                            {ann.content && <p>{ann.content}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Links */}
                    <div className="alt-panel links-panel">
                        <h3><ExternalLink size={16} /> LINKS</h3>
                        <div className="alt-panel-content">
                            <ul>
                                {links.map(link => (
                                    <li key={link.id}>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="alt-actions">
                    <button className="alt-action danger">
                        <LifeBuoy size={20} />
                        <span>Help Desk</span>
                    </button>
                    <button className="alt-action glass">
                        <Globe size={20} />
                        <span>Network</span>
                    </button>
                    <a href="#" className="alt-action green">
                        <ShoppingCart size={20} />
                        <span>Marketplace</span>
                    </a>
                    <button className="alt-action glass">
                        <HelpCircle size={20} />
                        <span>FAQ</span>
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="alt-footer" role="contentinfo">
                <span>© Johor Port Berhad</span>
                <span>JOHOR PORT BERHAD · 14</span>
            </footer>
        </div>
    );
}
