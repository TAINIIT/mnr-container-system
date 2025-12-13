import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';
import { X, XCircle } from 'lucide-react';
import './TabBar.css';

export default function TabBar() {
    const { tabs, activeTabId, closeTab, switchTab, openTab, closeAllOthers, closeAllTabs } = useTabs();
    const location = useLocation();
    const lastPathRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, tabId: null });

    // Auto-open tab for current location if not exists
    useEffect(() => {
        const currentPath = location.pathname;

        if (lastPathRef.current === currentPath) {
            return;
        }
        lastPathRef.current = currentPath;

        const existingTab = tabs.find(t => t.path === currentPath);
        if (!existingTab) {
            openTab(currentPath);
        } else {
            switchTab(existingTab.id);
        }
    }, [location.pathname]);

    // Handle right-click context menu
    const handleContextMenu = (e, tabId) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            tabId
        });
    };

    // Close context menu when clicking elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, tabId: null });
        if (contextMenu.visible) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu.visible]);

    const handleCloseOthers = () => {
        if (contextMenu.tabId) {
            closeAllOthers(contextMenu.tabId);
        }
        setContextMenu({ visible: false, x: 0, y: 0, tabId: null });
    };

    const handleCloseThis = () => {
        if (contextMenu.tabId) {
            closeTab(contextMenu.tabId);
        }
        setContextMenu({ visible: false, x: 0, y: 0, tabId: null });
    };

    if (tabs.length === 0) {
        return null;
    }

    return (
        <>
            <div className="tab-bar">
                <div className="tab-bar-scroll">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
                            onClick={() => switchTab(tab.id)}
                            onContextMenu={(e) => handleContextMenu(e, tab.id)}
                        >
                            <span className="tab-title">{tab.title}</span>
                            <button
                                className="tab-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(tab.id);
                                }}
                                title="Close tab (Ctrl+W)"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="tab-bar-actions">
                    {tabs.length > 1 && (
                        <button
                            className="tab-close-all"
                            onClick={() => closeAllOthers()}
                            title="Close all other tabs"
                        >
                            <XCircle size={16} />
                        </button>
                    )}
                    <span className="tab-bar-info">
                        {tabs.length} / 30
                    </span>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="tab-context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button onClick={handleCloseThis}>Close</button>
                    <button onClick={handleCloseOthers}>Close Other Tabs</button>
                    <button onClick={() => { closeAllTabs(); setContextMenu({ visible: false, x: 0, y: 0, tabId: null }); }}>
                        Close All Tabs
                    </button>
                </div>
            )}
        </>
    );
}
