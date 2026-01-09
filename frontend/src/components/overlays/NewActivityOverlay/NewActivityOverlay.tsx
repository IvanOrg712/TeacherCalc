import React, { useState } from 'react';
import Modal from '../../common/Modal/Modal';
import './NewActivityOverlay.css';

interface NewActivityOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

const NewActivityOverlay: React.FC<NewActivityOverlayProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isFixed, setIsFixed] = useState(false);
    const [weight, setWeight] = useState('');
    const [scale, setScale] = useState('');
    const [isExtra, setIsExtra] = useState(false);

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
                    placeholder="Nombre de la actividad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <textarea
                    className="overlay-textarea"
                    placeholder="Descripción"
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
                    <label>¿Tiene un valor fijo?</label>
                </div>

                {isFixed && (
                    <input
                        type="number"
                        className="overlay-input"
                        placeholder="Valor (%)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                    />
                )}

                <input
                    type="text"
                    className="overlay-input"
                    placeholder="Escala (ej: 0 - 30)"
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                />

                <div className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={isExtra}
                        onChange={(e) => handleExtraChange(e.target.checked)}
                    />
                    <label>¿Es actividad extra?</label>
                </div>

                <button className="create-btn" onClick={handleSave}>
                    Crear Actividad
                </button>
            </div>
        </Modal>
    );
};

export default NewActivityOverlay;
