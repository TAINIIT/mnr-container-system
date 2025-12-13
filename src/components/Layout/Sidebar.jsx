import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    LayoutDashboard,
    Container,
    ClipboardList,
    FileText,
    Wrench,
    Clock,
    Truck,
    ClipboardCheck,
    Package,
    Search,
    PlusCircle,
    Shield,
    Users as UsersIcon,
    Database,
    Settings,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    X,
    PanelLeftClose,
    PanelLeft,
    Activity,
    Droplets,
    MessageCircle
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
    {
        path: '/dashboard',
        icon: LayoutDashboard,
        labelKey: 'nav.dashboard',
        screenId: 'dashboard'
    },
    {
        section: 'nav.containerManagement',
        sectionId: 'container'
    },
    {
        path: '/containers/register',
        icon: PlusCircle,
        labelKey: 'nav.registerContainer',
        screenId: 'container_register'
    },
    {
        path: '/containers',
        icon: Container,
        labelKey: 'nav.allContainers',
        screenId: 'container_list'
    },
    {
        path: '/containers/ar',
        icon: Clock,
        labelKey: 'nav.arContainers',
        screenId: 'container_ar'
    },
    {
        section: 'nav.surveyDamage',
        sectionId: 'survey'
    },
    {
        path: '/surveys/search',
        icon: Search,
        labelKey: 'nav.newSurvey',
        screenId: 'survey_new'
    },
    {
        path: '/surveys',
        icon: ClipboardList,
        labelKey: 'nav.surveyList',
        screenId: 'survey_list'
    },
    {
        section: 'nav.repairManagement',
        sectionId: 'repair'
    },
    {
        path: '/eor',
        icon: FileText,
        labelKey: 'nav.eorList',
        screenId: 'eor_list'
    },
    {
        path: '/repair-orders',
        icon: Wrench,
        labelKey: 'nav.repairOrders',
        screenId: 'repair_list'
    },
    {
        section: 'nav.yardOperations',
        sectionId: 'operations'
    },
    {
        path: '/shunting',
        icon: Truck,
        labelKey: 'nav.shunting',
        screenId: 'shunting'
    },
    {
        path: '/pre-inspection',
        icon: ClipboardCheck,
        labelKey: 'nav.preInspection',
        screenId: 'inspection'
    },
    {
        path: '/washing',
        icon: Droplets,
        labelKey: 'nav.washingStation',
        screenId: 'washing'
    },
    {
        path: '/stacking',
        icon: Package,
        labelKey: 'nav.stackingRelease',
        screenId: 'stacking'
    },
    {
        section: 'nav.monitoring',
        sectionId: 'monitoring'
    },
    {
        path: '/monitoring/jobs',
        icon: Activity,
        labelKey: 'nav.jobMonitoring',
        screenId: 'job_monitoring'
    },
    {
        section: 'nav.administration',
        sectionId: 'admin'
    },
    {
        path: '/admin/codes',
        icon: Database,
        labelKey: 'nav.masterCodes',
        screenId: 'config_codes'
    },
    {
        path: '/admin/groups',
        icon: Shield,
        labelKey: 'nav.permissionGroups',
        screenId: 'config_groups'
    },
    {
        path: '/admin/users',
        icon: UsersIcon,
        labelKey: 'nav.userManagement',
        screenId: 'config_users'
    },
    {
        path: '/admin/settings',
        icon: Settings,
        labelKey: 'nav.systemSettings',
        screenId: 'config_settings'
    },
    {
        path: '/admin/homepage',
        icon: LayoutDashboard,
        labelKey: 'nav.homePageManagement',
        screenId: 'config_homepage'
    },
    {
        path: '/admin/chats',
        icon: MessageCircle,
        labelKey: 'nav.chatManagement',
        screenId: 'config_chats'
    }
];

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
    const location = useLocation();
    const { user } = useAuth();
    const { canAccessScreen } = useConfig();
    const { t } = useLanguage();

    // Track expanded sections - all expanded by default
    const [expandedSections, setExpandedSections] = useState({
        container: true,
        survey: true,
        repair: true,
        operations: true,
        monitoring: true,
        admin: true
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Handle link click on mobile - close sidebar
    const handleLinkClick = () => {
        if (onClose) {
            onClose();
        }
    };

    // Filter menu items based on user permissions
    const getVisibleItems = () => {
        if (!user) return [];

        const visibleItems = [];
        let currentSection = null;
        let currentSectionId = null;

        for (const item of menuItems) {
            if (item.section) {
                currentSection = item;
                currentSectionId = item.sectionId;
                continue;
            }

            // Check if user can access this screen
            const canAccess = canAccessScreen(user.id, item.screenId);

            if (canAccess) {
                // Add section header if needed
                if (currentSection && !visibleItems.find(i => i.sectionId === currentSectionId)) {
                    visibleItems.push(currentSection);
                }
                visibleItems.push({ ...item, parentSection: currentSectionId });
            }
        }

        // Remove orphan sections (sections with no items after them)
        return visibleItems.filter((item, index) => {
            if (item.section) {
                // Check if next item exists and is not a section
                const nextItem = visibleItems[index + 1];
                return nextItem && !nextItem.section;
            }
            return true;
        });
    };

    const visibleItems = getVisibleItems();

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/logo.jpg" alt="TIIT TECH" className="logo-image" />
                </div>
                {!isCollapsed && (
                    <div className="sidebar-brand">
                        <h1>TIIT TECH</h1>
                        <span>Container Depot</span>
                    </div>
                )}
                {/* Close button for mobile */}
                <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
                    <X size={24} />
                </button>
            </div>

            {/* Collapse toggle button */}
            <button
                className="sidebar-collapse-btn"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <nav className="sidebar-nav">
                {visibleItems.map((item, index) => {
                    if (item.section) {
                        if (isCollapsed) return null; // Hide sections when collapsed
                        const isExpanded = expandedSections[item.sectionId];
                        return (
                            <div
                                key={index}
                                className={`sidebar-section ${isExpanded ? 'expanded' : 'collapsed'}`}
                                onClick={() => toggleSection(item.sectionId)}
                            >
                                <span>{t(item.section)}</span>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        );
                    }

                    const Icon = item.icon;
                    const isActive = item.exact
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);
                    const isHidden = item.parentSection && !expandedSections[item.parentSection];

                    if (isHidden) return null;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={handleLinkClick}
                            title={isCollapsed ? t(item.labelKey) : undefined}
                        >
                            <Icon size={20} />
                            {!isCollapsed && <span>{t(item.labelKey)}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            {!isCollapsed && (
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <span className="user-name">{user?.fullName || user?.username}</span>
                        <span className="user-role">{user?.groups?.[0] || 'User'}</span>
                    </div>
                </div>
            )}
        </aside>
    );
}
