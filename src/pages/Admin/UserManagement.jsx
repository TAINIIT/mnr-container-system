import { useState, useMemo } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import {
    UserPlus, Edit2, Save, X, Search, Eye, EyeOff,
    ToggleLeft, ToggleRight, Shield, Mail, User, Key, ChevronRight, Building, Ship,
    Clock, Activity, Calendar, Filter
} from 'lucide-react';
import './Admin.css';

export default function UserManagement() {
    const { users, groups, createUser, updateUser, deactivateUser, updateUserPassword, getCodeList } = useConfig();
    const { t } = useLanguage();
    const toast = useToast();
    const liners = getCodeList('LINERS');

    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [groupFilter, setGroupFilter] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPassword, setShowPassword] = useState({});
    const [resetPasswordData, setResetPasswordData] = useState({ newPassword: '', show: false });
    const [activeTab, setActiveTab] = useState('details');
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        groups: [],
        userType: 'INTERNAL',
        shippingLineCode: null
    });

    // Simulate activity log (would be from database in production)
    const getActivityLog = (userId) => {
        const logs = JSON.parse(localStorage.getItem('mnr_audit_log') || '[]');
        return logs.filter(log => log.userId === userId || log.username === users.find(u => u.id === userId)?.username)
            .slice(0, 20);
    };

    // User statistics
    const userStats = useMemo(() => {
        return {
            total: users.length,
            active: users.filter(u => u.active).length,
            inactive: users.filter(u => !u.active).length,
            internal: users.filter(u => (u.userType || 'INTERNAL') === 'INTERNAL').length,
            external: users.filter(u => u.userType === 'EXTERNAL').length
        };
    }, [users]);

    const filteredUsers = users.filter(u => {
        if (!showInactive && !u.active) return false;
        const q = searchQuery.toLowerCase();
        const matchesSearch = u.username.toLowerCase().includes(q) ||
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q);
        const matchesGroup = !groupFilter || u.groups.includes(groupFilter);
        const matchesType = !userTypeFilter || (u.userType || 'INTERNAL') === userTypeFilter;
        return matchesSearch && matchesGroup && matchesType;
    });

    const handleSaveNew = () => {
        if (!newUser.username || !newUser.password || !newUser.fullName) {
            toast.error(t('admin.requiredFields') || 'Username, Password, and Full Name are required');
            return;
        }
        if (users.some(u => u.username.toUpperCase() === newUser.username.toUpperCase())) {
            toast.error(t('admin.usernameExists') || 'Username already exists');
            return;
        }
        if (newUser.groups.length === 0) {
            toast.error(t('admin.groupRequired') || 'At least one group is required');
            return;
        }
        createUser({
            ...newUser,
            createdAt: new Date().toISOString(),
            lastLogin: null
        });
        setNewUser({ username: '', password: '', fullName: '', email: '', groups: [], userType: 'INTERNAL', shippingLineCode: null });
        setIsAddingNew(false);
        toast.success(t('admin.userCreated') || 'User created successfully');
    };

    const handleUpdateUser = (userId, updates) => {
        updateUser(userId, updates);
        toast.success(t('admin.userUpdated') || 'User updated');
    };

    const handleSaveSelectedUser = () => {
        if (!selectedUser) return;
        if (selectedUser.groups.length === 0) {
            toast.error(t('admin.groupRequired') || 'At least one group is required');
            return;
        }
        handleUpdateUser(selectedUser.id, {
            fullName: selectedUser.fullName,
            email: selectedUser.email,
            groups: selectedUser.groups,
            userType: selectedUser.userType || 'INTERNAL',
            shippingLineCode: selectedUser.shippingLineCode
        });
        setSelectedUser(null);
    };

    const handleToggleActive = (userId, currentActive) => {
        if (currentActive) {
            deactivateUser(userId);
            toast.info(t('admin.userDeactivated') || 'User deactivated');
        } else {
            updateUser(userId, { active: true });
            toast.success(t('admin.userActivated') || 'User activated');
        }
    };

    const handleResetPassword = () => {
        if (!selectedUser || !resetPasswordData.newPassword) {
            toast.error(t('auth.passwordRequired') || 'New password is required');
            return;
        }
        if (resetPasswordData.newPassword.length < 6) {
            toast.error(t('auth.passwordTooShort') || 'Password must be at least 6 characters');
            return;
        }
        updateUser(selectedUser.id, { password: resetPasswordData.newPassword });
        setResetPasswordData({ newPassword: '', show: false });
        toast.success(t('auth.passwordChanged') || 'Password reset successfully');
    };

    const toggleNewGroup = (groupId) => {
        setNewUser(prev => ({
            ...prev,
            groups: prev.groups.includes(groupId)
                ? prev.groups.filter(g => g !== groupId)
                : [...prev.groups, groupId]
        }));
    };

    const toggleSelectedGroup = (groupId) => {
        if (!selectedUser) return;
        setSelectedUser(prev => ({
            ...prev,
            groups: prev.groups.includes(groupId)
                ? prev.groups.filter(g => g !== groupId)
                : [...prev.groups, groupId]
        }));
    };

    // Format relative time
    const formatRelativeTime = (date) => {
        if (!date) return t('admin.never') || 'Never';
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t('admin.justNow') || 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2><UserPlus size={24} /> {t('nav.userManagement')}</h2>
                    <p className="text-muted">{t('admin.userManagementDesc') || 'Register and manage user accounts and group assignments'}</p>
                </div>
                <div className="header-stats">
                    <div className="header-stat">
                        <span className="header-stat-value">{userStats.active}</span>
                        <span className="header-stat-label">{t('common.active') || 'Active'}</span>
                    </div>
                    <div className="header-stat">
                        <span className="header-stat-value">{userStats.inactive}</span>
                        <span className="header-stat-label">{t('common.inactive') || 'Inactive'}</span>
                    </div>
                    <div className="header-stat">
                        <span className="header-stat-value">{userStats.internal}</span>
                        <span className="header-stat-label">{t('admin.internal') || 'Internal'}</span>
                    </div>
                    <div className="header-stat">
                        <span className="header-stat-value">{userStats.external}</span>
                        <span className="header-stat-label">{t('admin.external') || 'External'}</span>
                    </div>
                </div>
            </div>

            <div className="master-detail-layout">
                {/* Master Panel - User List */}
                <div className="master-panel">
                    <div className="master-toolbar">
                        <div className="search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder={t('common.search') + '...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => { setIsAddingNew(true); setSelectedUser(null); }}>
                            <UserPlus size={14} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="master-filters">
                        <select
                            className="form-input form-input-sm"
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                        >
                            <option value="">{t('admin.allGroups') || 'All Groups'}</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                        <select
                            className="form-input form-input-sm"
                            value={userTypeFilter}
                            onChange={(e) => setUserTypeFilter(e.target.value)}
                        >
                            <option value="">{t('admin.allTypes') || 'All Types'}</option>
                            <option value="INTERNAL">{t('admin.internal') || 'Internal'}</option>
                            <option value="EXTERNAL">{t('admin.external') || 'External'}</option>
                        </select>
                        <label className="checkbox-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                            />
                            {t('admin.showInactive') || 'Inactive'}
                        </label>
                    </div>

                    <div className="master-list">
                        {filteredUsers.map(user => (
                            <div
                                key={user.id}
                                className={`master-item ${selectedUser?.id === user.id ? 'active' : ''} ${!user.active ? 'inactive' : ''}`}
                                onClick={() => { setSelectedUser({ ...user }); setIsAddingNew(false); setActiveTab('details'); }}
                                style={{ opacity: user.active ? 1 : 0.5 }}
                            >
                                <div className="master-item-content">
                                    <div className="master-item-title">
                                        <User size={16} />
                                        <span>{user.username}</span>
                                        {user.userType === 'EXTERNAL' && (
                                            <Ship size={12} style={{ color: 'var(--secondary-500)' }} />
                                        )}
                                        {!user.active && (
                                            <span className="badge badge-secondary" style={{ marginLeft: '4px', fontSize: '9px' }}>Inactive</span>
                                        )}
                                    </div>
                                    <div className="master-item-subtitle">{user.fullName}</div>
                                    <div className="master-item-meta">
                                        <span>{user.groups.map(gid => groups.find(g => g.id === gid)?.name).filter(Boolean).join(', ')}</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="master-item-arrow" />
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                                <User size={32} />
                                <p>{t('admin.noUsersFound') || 'No users found'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="detail-panel">
                    {isAddingNew ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3><UserPlus size={20} /> {t('admin.registerUser') || 'Register New User'}</h3>
                                <div className="detail-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => setIsAddingNew(false)}>
                                        <X size={14} /> {t('common.cancel')}
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={handleSaveNew}>
                                        <Save size={14} /> {t('common.save')}
                                    </button>
                                </div>
                            </div>
                            <div className="detail-body">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="form-group">
                                        <label className="form-label required">{t('admin.username')}</label>
                                        <div className="input-with-icon">
                                            <User size={18} />
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={newUser.username}
                                                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value.toUpperCase() }))}
                                                placeholder="JOHN"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">{t('admin.password')}</label>
                                        <div className="input-with-icon">
                                            <input
                                                type={showPassword.new ? 'text' : 'password'}
                                                className="form-input"
                                                value={newUser.password}
                                                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                                placeholder="••••••"
                                            />
                                            <button
                                                type="button"
                                                className="btn-icon"
                                                onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                                            >
                                                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">{t('admin.fullName')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newUser.fullName}
                                            onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('admin.email')}</label>
                                        <div className="input-with-icon">
                                            <Mail size={18} />
                                            <input
                                                type="email"
                                                className="form-input"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="john@depot.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* User Type and Shipping Line */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="form-group">
                                        <label className="form-label required">{t('admin.userType') || 'User Type'}</label>
                                        <select
                                            className="form-input"
                                            value={newUser.userType}
                                            onChange={(e) => setNewUser(prev => ({
                                                ...prev,
                                                userType: e.target.value,
                                                shippingLineCode: e.target.value === 'INTERNAL' ? null : prev.shippingLineCode
                                            }))}
                                        >
                                            <option value="INTERNAL">{t('admin.internal') || 'Internal'}</option>
                                            <option value="EXTERNAL">{t('admin.external') || 'External'}</option>
                                        </select>
                                    </div>
                                    {newUser.userType === 'EXTERNAL' && (
                                        <div className="form-group">
                                            <label className="form-label required">{t('admin.shippingLine') || 'Shipping Line'}</label>
                                            <select
                                                className="form-input"
                                                value={newUser.shippingLineCode || ''}
                                                onChange={(e) => setNewUser(prev => ({ ...prev, shippingLineCode: e.target.value || null }))}
                                            >
                                                <option value="">{t('common.select') || 'Select...'}</option>
                                                {liners.map(liner => (
                                                    <option key={liner.code} value={liner.code}>
                                                        {liner.code} - {liner.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">{t('admin.assignGroups') || 'Assign Groups'}</label>
                                    <div className="group-checkboxes">
                                        {groups.map(group => (
                                            <label key={group.id} className="checkbox-card">
                                                <input
                                                    type="checkbox"
                                                    checked={newUser.groups.includes(group.id)}
                                                    onChange={() => toggleNewGroup(group.id)}
                                                />
                                                <div>
                                                    <strong>{group.name}</strong>
                                                    <span>{group.description}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : selectedUser ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <div>
                                    <h3>
                                        <code className="username-badge">{selectedUser.username}</code>
                                        {selectedUser.userType === 'EXTERNAL' && (
                                            <span className="badge badge-secondary" style={{ marginLeft: '8px' }}>
                                                <Ship size={10} /> External
                                            </span>
                                        )}
                                        {!selectedUser.active && (
                                            <span className="badge badge-secondary" style={{ marginLeft: '8px' }}>Inactive</span>
                                        )}
                                    </h3>
                                    <p className="text-muted">{selectedUser.email || 'No email'}</p>
                                </div>
                                <div className="detail-actions">
                                    <button
                                        className={`btn btn-sm ${selectedUser.active ? 'btn-secondary' : 'btn-primary'}`}
                                        onClick={() => {
                                            handleToggleActive(selectedUser.id, selectedUser.active);
                                            setSelectedUser(prev => ({ ...prev, active: !prev.active }));
                                        }}
                                        disabled={selectedUser.id === 'user_admin'}
                                    >
                                        {selectedUser.active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                        {selectedUser.active ? (t('admin.deactivate') || 'Deactivate') : (t('admin.activate') || 'Activate')}
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={handleSaveSelectedUser}>
                                        <Save size={14} /> {t('common.save')}
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="detail-tabs">
                                <button
                                    className={`detail-tab ${activeTab === 'details' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('details')}
                                >
                                    <User size={14} /> {t('admin.details') || 'Details'}
                                </button>
                                <button
                                    className={`detail-tab ${activeTab === 'activity' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    <Activity size={14} /> {t('admin.activity') || 'Activity'}
                                </button>
                                <button
                                    className={`detail-tab ${activeTab === 'security' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('security')}
                                >
                                    <Key size={14} /> {t('admin.security') || 'Security'}
                                </button>
                            </div>

                            <div className="detail-body">
                                {activeTab === 'details' && (
                                    <>
                                        {/* User Info Summary */}
                                        <div className="user-info-summary mb-4">
                                            <div className="user-info-item">
                                                <Clock size={14} />
                                                <span className="user-info-label">{t('admin.lastLogin') || 'Last Login'}:</span>
                                                <span>{formatRelativeTime(selectedUser.lastLogin)}</span>
                                            </div>
                                            <div className="user-info-item">
                                                <Calendar size={14} />
                                                <span className="user-info-label">{t('admin.createdAt') || 'Created'}:</span>
                                                <span>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* User Info */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="form-group">
                                                <label className="form-label">{t('admin.fullName')}</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={selectedUser.fullName}
                                                    onChange={(e) => setSelectedUser(prev => ({ ...prev, fullName: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{t('admin.email')}</label>
                                                <input
                                                    type="email"
                                                    className="form-input"
                                                    value={selectedUser.email || ''}
                                                    onChange={(e) => setSelectedUser(prev => ({ ...prev, email: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        {/* User Type and Shipping Line */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="form-group">
                                                <label className="form-label">{t('admin.userType') || 'User Type'}</label>
                                                <select
                                                    className="form-input"
                                                    value={selectedUser.userType || 'INTERNAL'}
                                                    onChange={(e) => setSelectedUser(prev => ({
                                                        ...prev,
                                                        userType: e.target.value,
                                                        shippingLineCode: e.target.value === 'INTERNAL' ? null : prev.shippingLineCode
                                                    }))}
                                                >
                                                    <option value="INTERNAL">{t('admin.internal') || 'Internal'}</option>
                                                    <option value="EXTERNAL">{t('admin.external') || 'External'}</option>
                                                </select>
                                            </div>
                                            {(selectedUser.userType || 'INTERNAL') === 'EXTERNAL' && (
                                                <div className="form-group">
                                                    <label className="form-label">{t('admin.shippingLine') || 'Shipping Line'}</label>
                                                    <select
                                                        className="form-input"
                                                        value={selectedUser.shippingLineCode || ''}
                                                        onChange={(e) => setSelectedUser(prev => ({ ...prev, shippingLineCode: e.target.value || null }))}
                                                    >
                                                        <option value="">{t('common.select') || 'Select...'}</option>
                                                        {liners.map(liner => (
                                                            <option key={liner.code} value={liner.code}>
                                                                {liner.code} - {liner.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Groups */}
                                        <div className="form-group mb-4">
                                            <label className="form-label">{t('admin.assignGroups') || 'Assigned Groups'}</label>
                                            <div className="group-checkboxes">
                                                {groups.map(group => (
                                                    <label key={group.id} className="checkbox-card">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUser.groups.includes(group.id)}
                                                            onChange={() => toggleSelectedGroup(group.id)}
                                                        />
                                                        <div>
                                                            <strong>{group.name}</strong>
                                                            <span>{group.description}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="activity-log">
                                        <div className="activity-log-header">
                                            <h4><Activity size={16} /> {t('admin.recentActivity') || 'Recent Activity'}</h4>
                                        </div>
                                        <div className="activity-log-list">
                                            {getActivityLog(selectedUser.id).length > 0 ? (
                                                getActivityLog(selectedUser.id).map((log, index) => (
                                                    <div key={index} className="activity-log-item">
                                                        <div className="activity-log-icon">
                                                            <Activity size={14} />
                                                        </div>
                                                        <div className="activity-log-content">
                                                            <div className="activity-log-action">{log.action || 'Activity'}</div>
                                                            <div className="activity-log-details">{log.details || 'No details'}</div>
                                                        </div>
                                                        <div className="activity-log-time">
                                                            {formatRelativeTime(log.timestamp)}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                                                    <Clock size={32} />
                                                    <p>{t('admin.noActivityYet') || 'No activity recorded yet'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="security-settings">
                                        {/* Reset Password */}
                                        <div className="card" style={{ background: 'var(--bg-tertiary)' }}>
                                            <h4 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <Key size={16} /> {t('admin.resetPassword') || 'Reset Password'}
                                            </h4>
                                            <div className="flex gap-3" style={{ alignItems: 'flex-end' }}>
                                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                                    <label className="form-label">{t('auth.newPassword')}</label>
                                                    <div className="input-with-icon">
                                                        <input
                                                            type={resetPasswordData.show ? 'text' : 'password'}
                                                            className="form-input"
                                                            value={resetPasswordData.newPassword}
                                                            onChange={(e) => setResetPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn-icon"
                                                            onClick={() => setResetPasswordData(prev => ({ ...prev, show: !prev.show }))}
                                                        >
                                                            {resetPasswordData.show ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <button className="btn btn-secondary" onClick={handleResetPassword}>
                                                    <Key size={14} /> {t('admin.resetPassword') || 'Reset'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Session Info */}
                                        <div className="card mt-4" style={{ background: 'var(--bg-tertiary)' }}>
                                            <h4 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <Shield size={16} /> {t('admin.sessionInfo') || 'Session Information'}
                                            </h4>
                                            <div className="user-info-grid">
                                                <div className="user-info-row">
                                                    <span className="user-info-label">{t('admin.lastLogin') || 'Last Login'}</span>
                                                    <span>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</span>
                                                </div>
                                                <div className="user-info-row">
                                                    <span className="user-info-label">{t('admin.accountStatus') || 'Account Status'}</span>
                                                    <span className={`badge ${selectedUser.active ? 'badge-success' : 'badge-secondary'}`}>
                                                        {selectedUser.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="detail-empty">
                            <User size={48} />
                            <h4>{t('admin.selectUser') || 'Select a User'}</h4>
                            <p>{t('admin.selectUserDesc') || 'Choose a user from the list to view and edit their details'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
