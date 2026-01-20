import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './DismissibleHint.css';

interface DismissibleHintProps {
    /** Unique key for localStorage persistence */
    hintKey: string;
    /** i18n translation key for the hint text */
    translationKey: string;
    /** Optional variant: 'info' (default), 'tip', 'warning' */
    variant?: 'info' | 'tip' | 'warning';
}

const DismissibleHint: React.FC<DismissibleHintProps> = ({
    hintKey,
    translationKey,
    variant = 'info'
}) => {
    const { t } = useTranslation();
    const storageKey = `hint_dismissed_${hintKey}`;
    const [isDismissed, setIsDismissed] = useState<boolean>(true); // Start hidden to prevent flash

    useEffect(() => {
        // Check localStorage on mount
        const dismissed = localStorage.getItem(storageKey) === 'true';
        setIsDismissed(dismissed);
    }, [storageKey]);

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem(storageKey, 'true');
    };

    if (isDismissed) {
        return null;
    }

    return (
        <div className={`dismissible-hint hint-${variant}`}>
            <span className="hint-text">{t(translationKey)}</span>
            <button
                className="hint-dismiss-btn"
                onClick={handleDismiss}
                aria-label={t('common.close')}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
};

export default DismissibleHint;
