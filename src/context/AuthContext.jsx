import { createContext, useContext, useState, useEffect } from 'react';
import { useConfig } from './ConfigContext';

const AuthContext = createContext(null);

// Fallback credentials for cases where config isn't loaded
const FALLBACK_USER = {
    id: 'user_admin',
    username: 'ADMIN',
    password: '909090',
    fullName: 'Administrator',
    groups: ['admin']
};

export function AuthProvider({ children }) {
    const { authenticateUser, getUserPermissions, users } = useConfig();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const savedUser = localStorage.getItem('mnr_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            // Re-validate and refresh permissions
            if (parsedUser.id) {
                const permissions = getUserPermissions(parsedUser.id);
                // Ensure proper merging of permissions structure
                setUser({ ...parsedUser, permissions });
            } else {
                setUser(parsedUser);
            }
        }
        setIsLoading(false);
    }, [getUserPermissions]);

    const login = (username, password) => {
        // First try ConfigContext's authenticateUser
        let authenticatedUser = authenticateUser(username, password);

        // Fallback check if ConfigContext auth fails but credentials match default
        if (!authenticatedUser &&
            username.toUpperCase() === FALLBACK_USER.username &&
            password === FALLBACK_USER.password) {
            console.log('Using fallback authentication');
            authenticatedUser = {
                id: FALLBACK_USER.id,
                username: FALLBACK_USER.username,
                fullName: FALLBACK_USER.fullName,
                groups: FALLBACK_USER.groups,
                permissions: {
                    screens: ['dashboard', 'container_list', 'container_register', 'container_ar',
                        'survey_new', 'survey_list', 'eor_list', 'eor_new', 'repair_list',
                        'shunting', 'inspection', 'stacking', 'config_codes', 'config_groups', 'config_users',
                        'job_monitoring'],
                    functions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'delete_job']
                }
            };
        }

        if (authenticatedUser) {
            const userData = {
                ...authenticatedUser,
                loginTime: new Date().toISOString()
            };
            setUser(userData);
            localStorage.setItem('mnr_user', JSON.stringify(userData));
            return { success: true, user: userData };
        }
        return { success: false, error: 'Invalid username or password' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mnr_user');
    };

    // Check if user can access a specific screen
    const canAccess = (screenId) => {
        if (!user || !user.permissions) return false;
        return user.permissions.screens.includes(screenId);
    };

    // Check if user can perform a specific function
    const canPerform = (func) => {
        if (!user || !user.permissions) return false;
        // Legacy function check
        if (user.permissions.functions && user.permissions.functions.includes(func)) return true;
        return false;
    };

    // Check if user has specific permission on a screen
    // e.g. hasScreenPermission('eor_detail', 'approve')
    const hasScreenPermission = (screenId, permissionType) => {
        if (!user) return false;

        // Admins have all permissions
        if (user.groups && user.groups.includes('admin')) return true;

        // Check granular screen permissions
        if (user.permissions && user.permissions.screenPermissions) {
            const screenPerms = user.permissions.screenPermissions[screenId];
            if (screenPerms && screenPerms[permissionType]) {
                return true;
            }
        }

        // Fallback to legacy behavior if granular permissions are missing but basic screen access exists
        // (For backward compatibility during migration)
        if (permissionType === 'use' || permissionType === 'retrieve') {
            return canAccess(screenId);
        }

        return false;
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        canAccess,
        canPerform,
        hasScreenPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
