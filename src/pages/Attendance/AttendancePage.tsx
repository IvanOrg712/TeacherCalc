import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AttendancePage.css';

interface Student {
    id: string;
    name: string;
    attendance: Record<string, boolean>; // date -> present/absent
}

// Mock Data
const MOCK_STUDENTS: Student[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `student-${i}`,
    name: "Ivan Vivas Garcia",
    attendance: {}
}));

const PARCIALES = [
    { id: 'p1', name: 'Parcial 1', dates: ['10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025'] },
    { id: 'p2', name: 'Parcial 2', dates: ['10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025'] },
    { id: 'p3', name: 'Parcial 3', dates: ['10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025', '10/03/2025'] },
];

const AttendancePage: React.FC = () => {
    const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
    const navigate = useNavigate();

    // In a real app, we'd fetch data based on subjectId/groupId
    // For now, logging to avoid unused vars lint
    console.log(`Viewing attendance for Subject: ${subjectId}, Group: ${groupId}`);

    // We can try to decode or just use placeholders
    const subjectName = "Matemáticas 1";
    const groupName = `Grupo ${groupId || '711'}`;

    // State for toggle
    const [students] = useState(MOCK_STUDENTS);

    const handleGradesClick = () => {
        console.log("Grades button clicked - Not implemented yet");
        // navigate(\`/grades/\${subjectId}/\${groupId}\`);
    };

    return (
        <div className="attendance-page">
            <header className="attendance-header">
                <h1>{subjectName}</h1>
                <div className="attendance-group">{groupName}</div>
            </header>

            <div className="attendance-content">
                <div className="attendance-table-container">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ minWidth: '200px', backgroundColor: '#f0f0f0' }}></th> {/* Empty for names */}
                                {PARCIALES.map(parcial => (
                                    <th key={parcial.id} colSpan={parcial.dates.length + 1} className="header-parcial">
                                        {parcial.name}
                                    </th>
                                ))}
                                <th rowSpan={2} className="header-summary">Inasistencias</th>
                            </tr>
                            <tr>
                                {PARCIALES.map(parcial => (
                                    <React.Fragment key={`${parcial.id}-dates`}>
                                        {parcial.dates.map((date, idx) => (
                                            <th key={idx} className="header-date">
                                                <div className="date-vertical">{date}</div>
                                            </th>
                                        ))}
                                        <th className="header-add-col">+</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td className="student-name-cell">{student.name}</td>
                                    {PARCIALES.map(parcial => (
                                        <React.Fragment key={parcial.id}>
                                            {parcial.dates.map((_, idx) => (
                                                <td key={idx} className="attendance-cell" title="Toggle Attendance">
                                                    {/* Checkbox or empty for now */}
                                                </td>
                                            ))}
                                            <td className="attendance-cell" style={{ backgroundColor: '#fafafa' }}></td>
                                        </React.Fragment>
                                    ))}
                                    <td className="summary-cell" style={{ textAlign: 'center' }}>0</td>
                                </tr>
                            ))}
                            {/* Summary/Add row */}
                            <tr>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>+</td>
                                <td colSpan={100}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="attendance-footer">
                <button className="footer-btn active">Asistencia</button>
                <button className="footer-btn" onClick={handleGradesClick}>Calificaciones</button>
            </footer>
        </div>
    );
};

export default AttendancePage;
