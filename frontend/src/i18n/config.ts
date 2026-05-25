import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

const resources = {
    es: {
        translation: translations.es
    },
    en: {
        translation: translations.en
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'es', // Default language is Spanish as requested
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false // React already escapes values (prevents XSS)
        }
    });

export default i18n;
