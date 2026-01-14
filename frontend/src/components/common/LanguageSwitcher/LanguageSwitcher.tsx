import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        document.documentElement.lang = lng;
    };

    return (
        <div className="language-switcher">
            <button
                onClick={() => changeLanguage('es')}
                className={i18n.language === 'es' ? 'active' : ''}
                aria-label="Español"
            >
                ES
            </button>
            <button
                onClick={() => changeLanguage('en')}
                className={i18n.language === 'en' ? 'active' : ''}
                aria-label="English"
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;
