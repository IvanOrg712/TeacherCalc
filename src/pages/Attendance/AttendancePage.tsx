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
                <h1>{subjectName}</h1>
                <div className="attendance-group">Grupo {groupName}</div>
            </header>

            <div className="attendance-content">
                <div className="attendance-table-container">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ minWidth: '200px', backgroundColor: '#f0f0f0' }}></th> {/* Empty for names */}
                                {MOCK_TERMS.map(term => (
                                    <th key={term.id} colSpan={term.dates.length + 1} className="header-parcial">
                                        {term.name}
                                    </th>
                                ))}
                                <th rowSpan={2} className="header-summary">Inasistencias</th>
                            </tr>
                            <tr>
                                {MOCK_TERMS.map(term => (
                                    <React.Fragment key={`${term.id}-dates`}>
                                        {term.dates.map((date, idx) => (
                                            <th
                                                key={idx}
                                                className="header-date"
                                                onContextMenu={(e) => handleContextMenu(e, 'date', `${term.id}-${idx}`)}
                                            >
                                                <div className="date-vertical">{date}</div>
                                            </th>
                                        ))}
                                        <th
                                            className="header-add-col"
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
                                        className="student-name-cell"
                                        onContextMenu={(e) => handleContextMenu(e, 'student', student.id)}
                                    >
                                        {student.lastName}, {student.firstName}
                                    </td>
                                    {MOCK_TERMS.map(term => (
                                        <React.Fragment key={term.id}>
                                            {term.dates.map((_, idx) => (
                                                <td key={idx} className="attendance-cell">
                                                    <input
                                                        type="number"
                                                        className="attendance-input"
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
                                                            target.classList.remove('present', 'absent');
                                                            if (target.value === "1") {
                                                                target.classList.add('present');
                                                            } else if (target.value === "0") {
                                                                target.classList.add('absent');
                                                            }
                                                        }}
                                                    />
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
                                <td
                                    style={{ textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}
                                    onClick={() => console.log("Add student clicked")}
                                >
                                    +
                                </td>
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

            {
                contextMenu && (
                    <div
                        className="context-menu"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {contextMenu.type === 'student' && (
                            <div className="context-menu-item" onClick={() => {
                                console.log(`Edit ${contextMenu.type}: ${contextMenu.id}`);
                                setContextMenu(null);
                            }}>Edit</div>
                        )}
                        <div className="context-menu-item danger" onClick={() => {
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
