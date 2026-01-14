import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../common/Modal/Modal';
import './NewActivityOverlay.css';

interface NewActivityOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: {
        name: string;
        description: string;
        isFixed: boolean;
        weight: number;
        scale: string;
        isExtra: boolean;
    };
}

const NewActivityOverlay: React.FC<NewActivityOverlayProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isFixed, setIsFixed] = useState(false);
    const [weight, setWeight] = useState('');
    const [scale, setScale] = useState('');
    const [isExtra, setIsExtra] = useState(false);

    // Populate form when editing
    React.useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setDescription(initialData.description);
            setIsFixed(initialData.isFixed);
            setWeight(String(initialData.weight));
            setScale(initialData.scale);
            setIsExtra(initialData.isExtra);
        } else if (isOpen && !initialData) {
            // Reset form for new activity
            setName('');
            setDescription('');
            setIsFixed(false);
            setWeight('');
            setScale('');
            setIsExtra(false);
        }
    }, [isOpen, initialData]);

    const handleExtraChange = (checked: boolean) => {
        setIsExtra(checked);
        if (checked) {
            setIsFixed(true);
        }
    };

    const handleSave = () => {
        onSave({
            name,
            description,
            isFixed,
            weight: Number(weight),
            scale, // e.g. "0/30" -> will need parsing in handler
            isExtra
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="activity-form">
                <input
                    type="text"
                    className="overlay-input"
                    placeholder={t('activity.name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <textarea
                    className="overlay-textarea"
                    placeholder={t('activity.description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={isFixed}
                        onChange={(e) => setIsFixed(e.target.checked)}
                        disabled={isExtra}
                    />
                    <label>{t('activity.hasFixedValue')}</label>
                </div>

                {isFixed && (
                    <input
                        type="number"
                        className="overlay-input"
                        placeholder={t('activity.valuePlaceholder')}
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                    />
                )}

                <input
                    type="text"
                    className="overlay-input"
                    placeholder={t('activity.scalePlaceholder')}
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                />

                <div className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={isExtra}
                        onChange={(e) => handleExtraChange(e.target.checked)}
                    />
                    <label>{t('activity.isExtra')}</label>
                </div>

                <button className="create-btn" onClick={handleSave}>
                    {t('activity.createActivity')}
                </button>
            </div>
        </Modal>
    );
};

export default NewActivityOverlay;
