import React, { useState, useRef } from 'react';
import Modal from '../../common/Modal/Modal';
import './CSVImportOverlay.css';

interface CSVImportOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    groupId: string;
}

interface ParsedRow {
    name: string;
    studentNumber?: string;
}

const CSVImportOverlay: React.FC<CSVImportOverlayProps> = ({ isOpen, onClose, onSuccess, groupId }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ParsedRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            setError('Por favor selecciona un archivo CSV');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setResult(null);

        // Parse and preview
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const rows = parseCSV(text);
                setPreview(rows.slice(0, 5)); // Show first 5 rows
            } catch (err) {
                setError('Error al leer el archivo CSV');
            }
        };
        reader.readAsText(selectedFile);
    };

    const parseCSV = (text: string): ParsedRow[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h === 'name' || h === 'nombre');
        const numberIndex = headers.findIndex(h =>
            h === 'student_number' || h === 'numero' || h === 'matricula'
        );

        if (nameIndex === -1) {
            throw new Error('No "name" or "nombre" column found');
        }

        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
                name: values[nameIndex] || '',
                studentNumber: numberIndex >= 0 ? values[numberIndex] : undefined
            };
        }).filter(row => row.name);
    };

    const handleUpload = async () => {
        if (!file || !groupId) return;

        setIsUploading(true);
        setError(null);

        try {
            const { default: api } = await import('../../../api/client');
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(
                `/v1/students/import-csv/?group=${groupId}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            setResult({
                created: response.data.created,
                errors: response.data.errors || []
            });

            if (response.data.created > 0) {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al importar estudiantes');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview([]);
        setError(null);
        setResult(null);
        onClose();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.name.endsWith('.csv')) {
            const fakeEvent = { target: { files: [droppedFile] } } as any;
            handleFileChange(fakeEvent);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="csv-import-form">
                <h3>Importar Estudiantes desde CSV</h3>

                {/* Format Instructions */}
                <div className="csv-format-hint">
                    <strong>Formato requerido:</strong>
                    <code className="csv-example">
                        name,student_number<br />
                        Juan Pérez,12345<br />
                        María García,12346
                    </code>
                    <p className="format-note">
                        La columna <b>name</b> (o <b>nombre</b>) es obligatoria.<br />
                        La columna <b>student_number</b> (o <b>numero</b>, <b>matricula</b>) es opcional.
                    </p>
                </div>

                {/* Drop Zone */}
                <div
                    className={`csv-drop-zone ${file ? 'has-file' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        hidden
                    />
                    {file ? (
                        <div className="file-info">
                            <span className="file-icon">📄</span>
                            <span className="file-name">{file.name}</span>
                        </div>
                    ) : (
                        <div className="drop-hint">
                            <span className="upload-icon">📤</span>
                            <p>Arrastra un archivo CSV aquí o haz clic para seleccionar</p>
                        </div>
                    )}
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                    <div className="csv-preview">
                        <strong>Vista previa ({preview.length} filas):</strong>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Número</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.name}</td>
                                        <td>{row.studentNumber || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Error */}
                {error && <div className="csv-error">{error}</div>}

                {/* Result */}
                {result && (
                    <div className={`csv-result ${result.created > 0 ? 'success' : 'warning'}`}>
                        <p>✓ {result.created} estudiantes importados</p>
                        {result.errors.length > 0 && (
                            <ul>
                                {result.errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="csv-actions">
                    <button
                        className="create-btn"
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                    >
                        {isUploading ? 'Importando...' : 'Importar Estudiantes'}
                    </button>
                    <button className="cancel-btn" onClick={handleClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CSVImportOverlay;
