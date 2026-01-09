import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal/Modal';
import './SubjectConfigOverlay.css';

interface SubjectData {
    id?: string;
    name: string;
    absencesAllowed: number;
    groups?: { id: string; name: string }[];
}

interface SubjectConfigOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; absencesAllowed: number; groupCount: number; groupNames: string }) => void;
    initialData?: SubjectData;
}

const SubjectConfigOverlay: React.FC<SubjectConfigOverlayProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const [name, setName] = useState('');
    const [absencesAllowed, setAbsencesAllowed] = useState<string>('8');
    const [groupCount, setGroupCount] = useState<string>('1');
    const [groupNames, setGroupNames] = useState('');
    const [error, setError] = useState('');

    // Populate form when editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setAbsencesAllowed(String(initialData.absencesAllowed || 8));
            if (initialData.groups) {
                const names = initialData.groups.map(g => g.name).join(', ');
                setGroupNames(names);
                setGroupCount(String(initialData.groups.length));
            }
        } else {
            // Reset for new subject
            setName('');
            setAbsencesAllowed('8');
            setGroupCount('1');
            setGroupNames('');
        }
        setError('');
    }, [initialData, isOpen]);

    const handleSave = () => {
        // Validate
        const names = groupNames.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const count = Number(groupCount);

        if (names.length !== count) {
            setError(`Expected ${count} group names, but found ${names.length}.`);
            return;
        }
        setError('');

        onSave({
            name,
            absencesAllowed: Number(absencesAllowed),
            groupCount: count,
            groupNames
        });

        // Reset
        setName('');
        setAbsencesAllowed('8');
        setGroupCount('1');
        setGroupNames('');
        onClose();
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="subject-config-form">
                <input
                    type="text"
                    className="overlay-input"
                    placeholder="Nombre de la materia"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />

                <div className="input-row">
                    <label>¿Cuántas faltas tiene permitidas?</label>
                    <input
                        type="number"
                        className="overlay-input-small"
                        value={absencesAllowed}
                        onChange={(e) => setAbsencesAllowed(e.target.value)}
                    />
                </div>

                <div className="input-row">
                    <label>¿Cuantos grupos tiene?</label>
                    <input
                        type="number"
                        className="overlay-input-small"
                        value={groupCount}
                        onChange={(e) => setGroupCount(e.target.value)}
                    />
                </div>

                <input
                    type="text"
                    className="overlay-input"
                    placeholder="Escriba los nombres de los grupos separados por comas"
                    value={groupNames}
                    onChange={(e) => setGroupNames(e.target.value)}
                />

                {error && <div className="error-message">{error}</div>}

                <button className="create-btn" onClick={handleSave}>
                    {initialData ? 'Guardar Cambios' : 'Crear Materia'}
                </button>
            </div>
        </Modal>
    );
};

export default SubjectConfigOverlay;
