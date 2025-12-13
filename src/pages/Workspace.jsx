import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, MousePointerClick } from 'lucide-react';
import './Workspace.css';

export default function Workspace() {
    const { t } = useLanguage();
    const { user } = useAuth();

    // Get time-based greeting
    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return t('greetings.goodMorning') || 'Good Morning';
        if (hour >= 12 && hour < 18) return t('greetings.goodAfternoon') || 'Good Afternoon';
        return t('greetings.goodEvening') || 'Good Evening';
    };

    return (
        <div className="workspace-empty">
            <div className="workspace-content">
                <div className="workspace-icon">
                    <LayoutGrid size={48} />
                </div>
                <h2 className="workspace-greeting">
                    {getTimeBasedGreeting()}, {user?.fullName || user?.username}!
                </h2>
                <p className="workspace-message">
                    {t('workspace.selectScreen') || 'Please select a screen from the menu to get started.'}
                </p>
                <div className="workspace-hint">
                    <MousePointerClick size={20} />
                    <span>{t('workspace.menuHint') || 'Use the navigation menu on the left to open screens'}</span>
                </div>
            </div>
        </div>
    );
}
