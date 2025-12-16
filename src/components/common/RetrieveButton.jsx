import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from './Toast';

/**
 * Retrieve Button - Reloads data from storage
 * Only visible if user has 'retrieve' permission for the screen
 * 
 * @param {string} screenId - Screen ID for permission check
 * @param {function} onRetrieve - Optional callback after data reload
 */
export default function RetrieveButton({ screenId, onRetrieve }) {
    const { reloadFromStorage } = useData();
    const { hasScreenPermission } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Check permission
    if (!hasScreenPermission(screenId, 'retrieve')) {
        return null;
    }

    const handleRetrieve = async () => {
        setIsLoading(true);
        try {
            // Force refresh from Firebase/localStorage
            await reloadFromStorage();
            toast.success(t('common.dataReloaded') || 'Data reloaded from server');
            if (onRetrieve) onRetrieve();
        } catch (error) {
            toast.error(t('common.reloadError') || 'Failed to reload data');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            className={`btn btn-secondary btn-sm ${isLoading ? 'loading' : ''}`}
            onClick={handleRetrieve}
            disabled={isLoading}
            title={t('common.retrieve') || 'Retrieve'}
        >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            {t('common.retrieve') || 'Retrieve'}
        </button>
    );
}
