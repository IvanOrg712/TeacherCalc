import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSubject, getGroup, getStudentsForGroup, MOCK_TERMS } from '../../data/mockData';
import type { Student } from '../../types/models';
import './AttendancePage.css';

const AttendancePage: React.FC = () => {
    const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
    // const navigate = useNavigate();

    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [subjectName, setSubjectName] = useState("Loading...");
    const [groupName, setGroupName] = useState("");

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
        console.log("Grades button clicked - Not implemented yet");
        // navigate(`/grades/${subjectId}/${groupId}`);
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
                                    <td className="student-name-cell">{student.lastName}, {student.firstName}</td>
                                    {MOCK_TERMS.map(term => (
                                        <React.Fragment key={term.id}>
                                            {term.dates.map((_, idx) => (
                                                <td key={idx} className="attendance-cell" title="Toggle Attendance">
                                                    {/* In a real app we would check student.attendance[date] */}
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
