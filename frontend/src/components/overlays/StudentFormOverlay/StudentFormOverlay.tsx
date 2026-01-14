import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal/Modal';
import './StudentFormOverlay.css';

interface StudentFormOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    initialName?: string;
}

const StudentFormOverlay: React.FC<StudentFormOverlayProps> = ({
    isOpen,
    onClose,
    onSave,
    initialName
}) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (initialName) {
            setName(initialName);
        } else {
            setName('');
        }
    }, [initialName, isOpen]);

    const handleSave = () => {
        if (!name.trim()) {
            return;
        }

        onSave(name.trim());
        setName('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="student-form">
                <h3>{initialName ? 'Editar Estudiante' : 'Agregar Estudiante'}</h3>

                <input
                    type="text"
                    className="overlay-input"
                    placeholder="Nombre completo del estudiante"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSave();
                        }
                    }}
                    autoFocus
                />

                <button className="create-btn" onClick={handleSave}>
                    {initialName ? 'Guardar Cambios' : 'Agregar Estudiante'}
                </button>
            </div>
        </Modal>
    );
};

export default StudentFormOverlay;
