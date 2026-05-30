import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export type Language = 'es' | 'en';

export const useTranslation = () => {
    const { t, i18n } = useI18nextTranslation();
    const user = useAuthStore((state) => state.user) as any;

    // Reactively change active i18next language when user tenant language changes
    useEffect(() => {
        if (user?.tenant?.language && user.tenant.language !== i18n.language) {
            i18n.changeLanguage(user.tenant.language);
        }
    }, [user, i18n]);

    return {
        t,
        language: (i18n.language || 'es') as Language,
        setLanguage: (lang: Language) => {
            i18n.changeLanguage(lang);
        }
    };
};
