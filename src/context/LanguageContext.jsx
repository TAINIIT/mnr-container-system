import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../i18n';

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
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('mnr_language');
        return saved && LANGUAGES[saved] ? saved : DEFAULT_LANGUAGE;
    });

    const [currentTranslations, setCurrentTranslations] = useState(translations[language] || translations.en);

    useEffect(() => {
        localStorage.setItem('mnr_language', language);
        setCurrentTranslations(translations[language] || translations.en);
        // Set document language for accessibility
        document.documentElement.lang = language;
    }, [language]);

    const changeLanguage = useCallback((langCode) => {
        if (LANGUAGES[langCode]) {
            setLanguage(langCode);
        }
    }, []);

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
        translations: currentTranslations
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
