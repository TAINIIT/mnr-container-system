import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../i18n';
import { database, ref, onValue, set, get, DEMO_MODE } from '../config/firebase';
import { useAuth } from './AuthContext';

// Import all translation files
import en from '../i18n/en.json';
import vi from '../i18n/vi.json';
import ms from '../i18n/ms.json';
import ko from '../i18n/ko.json';
import zh from '../i18n/zh.json';
import pt from '../i18n/pt.json';

const translations = { en, vi, ms, ko, zh, pt };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const { user } = useAuth();
    const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
    const [isLoading, setIsLoading] = useState(true);

    const [currentTranslations, setCurrentTranslations] = useState(translations[language] || translations.en);

    // Load language preference from Firebase when user changes
    useEffect(() => {
        if (!user?.id) {
            // No user, use default
            setLanguage(DEFAULT_LANGUAGE);
            setIsLoading(false);
            return;
        }

        if (DEMO_MODE) {
            // Demo mode: use localStorage
            const saved = localStorage.getItem('mnr_language');
            setLanguage(saved && LANGUAGES[saved] ? saved : DEFAULT_LANGUAGE);
            setIsLoading(false);
            return;
        }

        // Firebase: load user's language preference
        const loadLanguage = async () => {
            try {
                const langRef = ref(database, `userPreferences/${user.id}/language`);
                const snapshot = await get(langRef);
                if (snapshot.exists() && LANGUAGES[snapshot.val()]) {
                    setLanguage(snapshot.val());
                }
            } catch (error) {
                console.error('Failed to load language preference:', error);
            }
            setIsLoading(false);
        };

        loadLanguage();

        // Subscribe to real-time updates
        const langRef = ref(database, `userPreferences/${user.id}/language`);
        const unsubscribe = onValue(langRef, (snapshot) => {
            if (snapshot.exists() && LANGUAGES[snapshot.val()]) {
                setLanguage(snapshot.val());
            }
        });

        return () => unsubscribe();
    }, [user?.id]);

    // Update translations when language changes
    useEffect(() => {
        setCurrentTranslations(translations[language] || translations.en);
        document.documentElement.lang = language;
    }, [language]);

    const changeLanguage = useCallback(async (langCode) => {
        if (!LANGUAGES[langCode]) return;

        setLanguage(langCode);

        if (DEMO_MODE) {
            localStorage.setItem('mnr_language', langCode);
            return;
        }

        // Save to Firebase if user is logged in
        if (user?.id) {
            try {
                const langRef = ref(database, `userPreferences/${user.id}/language`);
                await set(langRef, langCode);
                console.log('🔥 Language preference saved to Firebase');
            } catch (error) {
                console.error('Failed to save language preference:', error);
            }
        }
    }, [user?.id]);

    // Translation function with nested key support (e.g., 'common.save')
    const t = useCallback((key, fallback = '') => {
        const keys = key.split('.');
        let value = currentTranslations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Key not found, return fallback or key itself
                return fallback || key;
            }
        }

        return typeof value === 'string' ? value : fallback || key;
    }, [currentTranslations]);

    const value = {
        language,
        languages: LANGUAGES,
        changeLanguage,
        t,
        translations: currentTranslations,
        isLoading
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Shorthand hook for just the translation function
export function useTranslation() {
    const { t } = useLanguage();
    return t;
}
