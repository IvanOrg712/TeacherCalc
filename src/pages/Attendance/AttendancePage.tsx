import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubject, getGroup, getStudentsForGroup, MOCK_TERMS } from '../../data/mockData';
import type { Student } from '../../types/models';
import './AttendancePage.css';

const AttendancePage: React.FC = () => {
    const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
    const navigate = useNavigate();
    // const navigate = useNavigate();

    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [subjectName, setSubjectName] = useState("Loading...");
    const [groupName, setGroupName] = useState("");

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'student' | 'date'; id: string } | null>(null);

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleContextMenu = (e: React.MouseEvent, type: 'student' | 'date', id: string) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, type, id });
    };

    useEffect(() => {
        if (subjectId && groupId) {
            const subjectData = getSubject(subjectId);
            const groupData = getGroup(groupId);

            if (subjectData) {
                setSubjectName(subjectData.subject.name);
            }
            if (groupData) {
                setGroupName(groupData.group.name);
            }

            // Load students
            const groupStudents = getStudentsForGroup(groupId);
            setStudents(groupStudents);
        }
    }, [subjectId, groupId]);

    const handleGradesClick = () => {
        navigate(`/grades/${subjectId}/${groupId}`);
    };

    return (
        <div className="attendance-page">
            <header className="attendance-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => navigate('/dashboard')} aria-label="Go back">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1>{subjectName}</h1>
                </div>
                <div className="attendance-group">Grupo {groupName}</div>
            </header>

            <div className="attendance-content">
                <div className="unified-table-container">
                    <table className="unified-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="student-col-unified">Nombre del Estudiante</th>
                                {MOCK_TERMS.map(term => (
                                    <th key={term.id} colSpan={term.dates.length + 1} className="unified-header-main">
                                        {term.name}
                                    </th>
                                ))}
                                <th rowSpan={2} className="unified-header-vertical">
                                    <div className="vertical-text-wrapper">Inasistencias</div>
                                </th>
                            </tr>
                            <tr>
                                {MOCK_TERMS.map(term => (
                                    <React.Fragment key={`${term.id}-dates`}>
                                        {term.dates.map((date, idx) => (
                                            <th
                                                key={idx}
                                                className="unified-header-vertical"
                                                onContextMenu={(e) => handleContextMenu(e, 'date', `${term.id}-${idx}`)}
                                            >
                                                <div className="vertical-text-wrapper">{date}</div>
                                            </th>
                                        ))}
                                        <th
                                            className="add-btn-cell"
                                            onClick={() => console.log(`Add column to ${term.name}`)}
                                        >
                                            +
                                        </th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td
                                        className="student-col-unified"
                                        onContextMenu={(e) => handleContextMenu(e, 'student', student.id)}
                                    >
                                        {student.lastName}, {student.firstName}
                                    </td>
                                    {MOCK_TERMS.map(term => (
                                        <React.Fragment key={term.id}>
                                            {term.dates.map((_, idx) => (
                                                <td key={idx} className="unified-cell-hover">
                                                    <div className="cell-input-wrapper">
                                                        <input
                                                            type="number"
                                                            className="unified-input"
                                                            min="0"
                                                            max="1"
                                                            onKeyDown={(e) => {
                                                                if (["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
                                                                if (!["0", "1"].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            onInput={(e) => {
                                                                const target = e.target as HTMLInputElement;
                                                                // Force single character
                                                                if (target.value.length > 1) {
                                                                    target.value = target.value.slice(0, 1);
                                                                }
                                                                // Ensure strictly 0 or 1
                                                                if (target.value !== "" && !["0", "1"].includes(target.value)) {
                                                                    target.value = "";
                                                                }

                                                                // Visual Feedback
                                                                target.classList.remove('passing', 'failing'); // reuse unified classes
                                                                if (target.value === "1") {
                                                                    target.classList.add('passing');
                                                                } else if (target.value === "0") {
                                                                    target.classList.add('failing');
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            ))}
                                            <td style={{ backgroundColor: '#fafafa' }}></td>
                                        </React.Fragment>
                                    ))}
                                    <td className="total-cell-unified" style={{ textAlign: 'center' }}>0</td>
                                </tr>
                            ))}
                            {/* Summary/Add row */}
                            {/* Add Student Row */}
                            <tr>
                                <td
                                    className="student-col-unified"
                                    style={{ textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}
                                    onClick={() => console.log("Add student clicked")}
                                >
                                    +
                                </td>
                                {MOCK_TERMS.map(term => (
                                    <React.Fragment key={term.id}>
                                        {/* Empty cells to match structure */}
                                        <td colSpan={term.dates.length + 1} style={{ backgroundColor: '#fafafa' }}></td>
                                    </React.Fragment>
                                ))}
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="unified-footer">
                <button className="footer-btn-unified active">Asistencia</button>
                <button className="footer-btn-unified" onClick={handleGradesClick}>Calificaciones</button>

            </footer>

            {
                contextMenu && (
                    <div
                        className="context-menu-unified"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {contextMenu.type === 'student' && (
                            <div className="context-menu-item-unified" onClick={() => {
                                console.log(`Edit ${contextMenu.type}: ${contextMenu.id}`);
                                setContextMenu(null);
                            }}>Edit</div>
                        )}
                        <div className="context-menu-item-unified danger" onClick={() => {
                            console.log(`Delete ${contextMenu.type}: ${contextMenu.id}`);
                            setContextMenu(null);
                        }}>Delete</div>
                    </div>
                )
            }
        </div >
    );
};

export default AttendancePage;
