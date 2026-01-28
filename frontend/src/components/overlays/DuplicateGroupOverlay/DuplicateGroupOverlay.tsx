import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../common/Modal/Modal';
import './DuplicateGroupOverlay.css';

interface Subject {
    id: string;
    name: string;
}

interface DuplicateGroupOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    sourceGroupId: string;
    sourceGroupName: string;
    subjects: Subject[];
}

const DuplicateGroupOverlay: React.FC<DuplicateGroupOverlayProps> = ({
    isOpen,
    onClose,
    onSuccess,
    sourceGroupId,
    sourceGroupName,
    subjects
}) => {
    const { t } = useTranslation();
    const [targetSubjectId, setTargetSubjectId] = useState<string>('');
    const [newName, setNewName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ midterms: number; evaluations: number; activities: number } | null>(null);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setNewName(`${sourceGroupName} (Copy)`);
            setTargetSubjectId(subjects[0]?.id || '');
            setError(null);
            setResult(null);
        }
    }, [isOpen, sourceGroupName, subjects]);

    const handleSubmit = async () => {
        if (!targetSubjectId || !newName.trim()) {
            setError(t('templates.requiredFields'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { default: api } = await import('../../../api/client');
            const response = await api.post(`/v1/groups/${sourceGroupId}/duplicate/`, {
                target_subject: targetSubjectId,
                new_name: newName.trim()
            });

            setResult({
                midterms: response.data.midterms_copied,
                evaluations: response.data.evaluations_copied,
                activities: response.data.activities_copied
            });

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || t('templates.duplicateFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setResult(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="duplicate-group-form">
                <h3>{t('templates.duplicateTitle')}</h3>
                <p className="source-info">
                    {t('templates.copyingFrom')}: <strong>{sourceGroupName}</strong>
                </p>

                {!result ? (
                    <>
                        <div className="form-group">
                            <label htmlFor="target-subject">{t('templates.targetSubject')}</label>
                            <select
                                id="target-subject"
                                value={targetSubjectId}
                                onChange={(e) => setTargetSubjectId(e.target.value)}
                                disabled={isLoading}
                            >
                                {subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="new-name">{t('templates.newGroupName')}</label>
                            <input
                                id="new-name"
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t('templates.enterName')}
                                disabled={isLoading}
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="form-actions">
                            <button
                                className="primary-btn"
                                onClick={handleSubmit}
                                disabled={isLoading || !newName.trim()}
                            >
                                {isLoading ? t('common.loading') : t('templates.duplicate')}
                            </button>
                            <button className="cancel-btn" onClick={handleClose} disabled={isLoading}>
                                {t('common.cancel')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="success-result">
                        <div className="success-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <p className="success-text">{t('templates.successMessage')}</p>
                        <ul className="copied-items">
                            <li>{result.midterms} {t('templates.midterms')}</li>
                            <li>{result.evaluations} {t('templates.evaluations')}</li>
                            <li>{result.activities} {t('templates.activities')}</li>
                        </ul>
                        <button className="primary-btn" onClick={handleClose}>
                            {t('common.close')}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default DuplicateGroupOverlay;
