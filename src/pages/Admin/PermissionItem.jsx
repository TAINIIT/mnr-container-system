import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export const PermissionItem = ({
    screen,
    selectedGroup,
    setSelectedGroup,
    toggleScreenPermission,
    PERMISSION_TEMPLATES,
    PERMISSION_TYPES
}) => {
    const perms = selectedGroup.screenPermissions?.[screen.id] || {};
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine current access level
    let currentLevel = 'custom';
    const enabledKeys = Object.keys(perms).filter(k => perms[k]);
    const enabledCount = enabledKeys.length;

    if (enabledCount === 0) currentLevel = 'none';
    else {
        // Check for exact matches with templates
        const isMatch = (templateId) => {
            const template = PERMISSION_TEMPLATES.find(t => t.id === templateId);
            if (!template) return false;
            const templatePerms = template.perms;
            if (templatePerms.length !== enabledCount) return false;
            return templatePerms.every(p => perms[p]);
        };

        if (isMatch('readonly')) currentLevel = 'readonly';
        else if (isMatch('standard')) currentLevel = 'standard';
        else if (isMatch('full')) currentLevel = 'full';
        else if (isMatch('admin')) currentLevel = 'admin';
    }

    const handleLevelChange = (level) => {
        if (level === 'custom') {
            setIsExpanded(true);
            return;
        }

        // Set permissions based on level
        let newPerms = {};
        if (level === 'none') {
            // all false
        } else {
            const template = PERMISSION_TEMPLATES.find(t => t.id === level);
            if (template) {
                template.perms.forEach(p => newPerms[p] = true);
            }
        }

        // Update parent state
        setSelectedGroup(prev => {
            const updated = { ...prev.screenPermissions };
            // Reset this screen first
            updated[screen.id] = {};
            Object.assign(updated[screen.id], newPerms);
            return { ...prev, screenPermissions: updated };
        });
    };

    return (
        <div className={`permission-item ${isExpanded ? 'expanded' : ''}`}>
            <div className="permission-row">
                <div className="perm-info">
                    <span className="perm-name">{screen.name}</span>
                    <span className="perm-id">{screen.id}</span>
                </div>

                <div className="perm-controls">
                    <select
                        className="perm-select"
                        value={currentLevel}
                        onChange={(e) => handleLevelChange(e.target.value)}
                        disabled={selectedGroup.id === 'admin'}
                    >
                        <option value="none">No Access</option>
                        <option value="readonly">Viewer</option>
                        <option value="standard">Operator</option>
                        <option value="full">Manager</option>
                        <option value="custom">Custom...</option>
                    </select>

                    <button
                        className={`btn-expand ${isExpanded ? 'active' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                        title="Customize"
                    >
                        <ChevronRight size={16} className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="granular-permissions">
                    {PERMISSION_TYPES.map(type => (
                        <label key={type.key} className="granular-checkbox">
                            <input
                                type="checkbox"
                                checked={perms[type.key] || false}
                                onChange={() => toggleScreenPermission(screen.id, type.key)}
                                disabled={selectedGroup.id === 'admin'}
                            />
                            <span>{type.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};
