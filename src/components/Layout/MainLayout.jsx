import { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TabBar from './TabBar';
import WorkflowPanel from '../Workflow/WorkflowPanel';
import { LiveChatButton, LiveChatWidget } from '../LiveChat';
import './MainLayout.css';
import '../../styles/responsive.css';

// Create context for mobile menu state
const MobileMenuContext = createContext();

export function useMobileMenu() {
    return useContext(MobileMenuContext);
}

export default function MainLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Default: expanded

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <MobileMenuContext.Provider value={{ isMobileMenuOpen, toggleMobileMenu, closeMobileMenu }}>
            <div className={`layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Mobile overlay */}
                <div
                    className={`sidebar-overlay ${isMobileMenuOpen ? 'visible' : ''}`}
                    onClick={closeMobileMenu}
                />
                <Sidebar
                    isOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                />
                <div className="layout-main">
                    <Header onMenuToggle={toggleMobileMenu} />
                    <TabBar />
                    <main className="layout-content">
                        <Outlet />
                    </main>
                </div>
                {/* Workflow Wizard Panel */}
                <WorkflowPanel />
                {/* Live Chat for authenticated users */}
                <LiveChatButton />
                <LiveChatWidget />
            </div>
        </MobileMenuContext.Provider>
    );
}

