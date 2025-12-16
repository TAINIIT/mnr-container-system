import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TabContext = createContext(null);

const MAX_TABS = 30;

// Map paths to titles
const pathToTitle = (path) => {
    const pathMappings = {
        '/': 'Welcome Page',
        '/dashboard': 'Dashboard',
        '/containers': 'Container List',
        '/containers/register': 'Register Container',
        '/containers/ar': 'AR Containers',
        '/surveys': 'Survey List',
        '/surveys/search': 'Survey Detail', // Use same tab as Survey Detail
        '/eor': 'EOR List',
        '/repair-orders': 'Repair Orders',
        '/shunting': 'Shunting',
        '/pre-inspection': 'Pre-Inspection',
        '/stacking': 'Stacking & Release',
        '/washing': 'Washing Station',
        '/washing/new': 'Washing Detail', // Use same tab as Washing Detail
        '/monitoring/jobs': 'Job Monitoring',
        '/admin/codes': 'Master Codes',
        '/admin/groups': 'Permission Groups',
        '/admin/users': 'User Management',
        '/admin/settings': 'System Settings'
    };

    if (pathMappings[path]) return pathMappings[path];

    // Handle path with query params - strip them for matching
    const basePath = path.split('?')[0];
    if (pathMappings[basePath]) return pathMappings[basePath];

    // Detail pages - all use consistent "Detail" naming for single-tab-per-screen
    if (basePath.startsWith('/containers/') && basePath !== '/containers/register' && basePath !== '/containers/ar') {
        return 'Container Detail';
    }
    if (basePath.startsWith('/surveys/')) {
        // All survey pages (new, edit, detail) use the same tab
        return 'Survey Detail';
    }
    if (basePath.startsWith('/eor/')) {
        if (basePath.includes('/new')) return 'New EOR';
        if (basePath.includes('/edit')) return 'Edit EOR';
        return 'EOR Detail';
    }
    if (basePath.startsWith('/repair-orders/')) {
        return 'Repair Order Detail';
    }
    // All washing detail pages (schedule, work, qc, certificate, detail) -> single tab name
    if (basePath.startsWith('/washing/')) {
        if (basePath === '/washing/new' || basePath.startsWith('/washing/new?')) return 'New Washing Order';
        return 'Washing Detail';
    }

    return 'Page';
};


export function TabProvider({ children }) {
    // On refresh (F5), start with empty tabs - go back to welcome screen
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const navigate = useNavigate();

    const tabsRef = useRef([]);
    tabsRef.current = tabs;

    const activeTabIdRef = useRef(null);
    activeTabIdRef.current = activeTabId;

    // No sessionStorage persistence - F5 resets to welcome screen

    // Open or focus a tab - now matches by TITLE for single-tab-per-screen experience
    const openTab = useCallback((path, customTitle = null) => {
        const title = customTitle || pathToTitle(path);

        // Find existing tab with same TITLE (not path) for single-tab-per-screen
        const existingTab = tabsRef.current.find(t => t.title === title);
        if (existingTab) {
            // Update the path if different (navigate within same "screen")
            if (existingTab.path !== path) {
                setTabs(prev => prev.map(t =>
                    t.id === existingTab.id
                        ? { ...t, path }
                        : t
                ));
            }
            setActiveTabId(existingTab.id);
            return existingTab.id;
        }

        const newTab = {
            id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            path,
            title
        };

        setTabs(prev => {
            // Double-check for title match to avoid race conditions
            if (prev.some(t => t.title === title)) {
                return prev.map(t => t.title === title ? { ...t, path } : t);
            }
            if (prev.length >= MAX_TABS) {
                return [...prev.slice(1), newTab];
            }
            return [...prev, newTab];
        });

        setActiveTabId(newTab.id);
        return newTab.id;
    }, []);

    // Close a single tab
    const closeTab = useCallback((tabId) => {
        setTabs(prev => {
            const index = prev.findIndex(t => t.id === tabId);
            if (index === -1) return prev;

            const newTabs = prev.filter(t => t.id !== tabId);

            if (newTabs.length > 0) {
                const newActiveIndex = Math.min(index, newTabs.length - 1);
                const newActiveTab = newTabs[newActiveIndex];
                setActiveTabId(newActiveTab.id);
                navigate(newActiveTab.path);
            } else {
                setActiveTabId(null);
                navigate('/');
            }

            return newTabs;
        });
    }, [navigate]);

    // Close all tabs except the current active one
    const closeAllOthers = useCallback((keepTabId = null) => {
        const idToKeep = keepTabId || activeTabIdRef.current;
        setTabs(prev => {
            const tabToKeep = prev.find(t => t.id === idToKeep);
            if (!tabToKeep) {
                // If no tab to keep found, go to dashboard
                navigate('/');
                return [];
            }
            setActiveTabId(tabToKeep.id);
            navigate(tabToKeep.path);
            return [tabToKeep];
        });
    }, [navigate]);

    // Close all tabs
    const closeAllTabs = useCallback(() => {
        setTabs([]);
        setActiveTabId(null);
        navigate('/');
    }, [navigate]);

    // Switch to a tab
    const switchTab = useCallback((tabId) => {
        const tab = tabsRef.current.find(t => t.id === tabId);
        if (tab) {
            setActiveTabId(tabId);
            navigate(tab.path);
        }
    }, [navigate]);

    // Switch to next/previous tab
    const switchToNextTab = useCallback(() => {
        const currentIndex = tabsRef.current.findIndex(t => t.id === activeTabIdRef.current);
        if (currentIndex === -1 || tabsRef.current.length <= 1) return;

        const nextIndex = (currentIndex + 1) % tabsRef.current.length;
        const nextTab = tabsRef.current[nextIndex];
        setActiveTabId(nextTab.id);
        navigate(nextTab.path);
    }, [navigate]);

    const switchToPrevTab = useCallback(() => {
        const currentIndex = tabsRef.current.findIndex(t => t.id === activeTabIdRef.current);
        if (currentIndex === -1 || tabsRef.current.length <= 1) return;

        const prevIndex = (currentIndex - 1 + tabsRef.current.length) % tabsRef.current.length;
        const prevTab = tabsRef.current[prevIndex];
        setActiveTabId(prevTab.id);
        navigate(prevTab.path);
    }, [navigate]);

    // Close current active tab (for keyboard shortcut)
    const closeCurrentTab = useCallback(() => {
        if (activeTabIdRef.current) {
            closeTab(activeTabIdRef.current);
        }
    }, [closeTab]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+W - Close current tab
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                closeCurrentTab();
            }
            // Ctrl+Tab - Next tab
            else if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                switchToNextTab();
            }
            // Ctrl+Shift+Tab - Previous tab
            else if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                switchToPrevTab();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeCurrentTab, switchToNextTab, switchToPrevTab]);

    const value = {
        tabs,
        activeTabId,
        openTab,
        closeTab,
        closeAllOthers,
        closeAllTabs,
        switchTab,
        switchToNextTab,
        switchToPrevTab,
        closeCurrentTab,
        MAX_TABS
    };

    return (
        <TabContext.Provider value={value}>
            {children}
        </TabContext.Provider>
    );
}

export function useTabs() {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return context;
}
