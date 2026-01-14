import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../common/Modal/Modal';
import './SchoolConfigOverlay.css';

interface SchoolConfigOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; passingGrade: number; midtermCount: number }) => void;
    initialData?: { name: string; passingGrade: number; midtermCount: number } | null;
}

const SchoolConfigOverlay: React.FC<SchoolConfigOverlayProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [passingGrade, setPassingGrade] = useState<string>('7');
    const [midtermCount, setMidtermCount] = useState<string>('3');

    React.useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setPassingGrade(String(initialData.passingGrade));
            setMidtermCount(String(initialData.midtermCount));
        } else if (isOpen && !initialData) {
            // Reset if opening in create mode
            setName('');
            setPassingGrade('7');
            setMidtermCount('3');
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        if (!name) return; // Add validation error handling later (ErrorOverlay)

        onSave({
            name,
            passingGrade: Number(passingGrade),
            midtermCount: Number(midtermCount)
        });

        // Reset form
        setName('');
        setPassingGrade('7');
        setMidtermCount('3');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="school-config-form">
                <input
                    type="text"
                    className="overlay-input"
                    placeholder={t('school.name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />

                <div className="input-row">
                    <label>{t('school.passingGrade')}</label>
                    <input
                        type="number"
                        className="overlay-input-small"
                        value={passingGrade}
                        onChange={(e) => setPassingGrade(e.target.value)}
                    />
                </div>

                <div className="input-row">
                    <label>{t('school.midtermCount')}</label>
                    <input
                        type="number"
                        className="overlay-input-small"
                        value={midtermCount}
                        onChange={(e) => setMidtermCount(e.target.value)}
                    />
                </div>

                <button className="create-btn" onClick={handleSave}>
                    {initialData ? t('common.save') : t('school.createSchool')}
                </button>
            </div>
        </Modal>
    );
};

export default SchoolConfigOverlay;
