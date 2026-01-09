import React, { useState } from 'react';
import Modal from '../../common/Modal/Modal';
import './NewEvaluationOverlay.css';

interface NewEvaluationOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; isFixed: boolean; weight: number }) => void;
}

const NewEvaluationOverlay: React.FC<NewEvaluationOverlayProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [isFixed, setIsFixed] = useState(false);
    const [weight, setWeight] = useState<string>('');

    const handleSave = () => {
        onSave({
            name,
            isFixed,
            weight: isFixed ? Number(weight) : 0
        });
        setName('');
        setIsFixed(false);
        setWeight('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="evaluation-form">
                <input
                    type="text"
                    className="overlay-input"
                    placeholder="Nombre de la evaluación"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />

                <div className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={isFixed}
                        onChange={(e) => setIsFixed(e.target.checked)}
                        id="eval-fixed"
                    />
                    <label htmlFor="eval-fixed">¿Tiene un valor fijo?</label>
                </div>

                {isFixed && (
                    <input
                        type="number"
                        className="overlay-input"
                        placeholder="Valor de la evaluación (%)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                    />
                )}

                <button className="create-btn" onClick={handleSave}>
                    Crear Evaluación
                </button>
            </div>
        </Modal>
    );
};

export default NewEvaluationOverlay;
