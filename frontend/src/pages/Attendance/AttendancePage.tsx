import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Student } from '../../@types/models';
import './AttendancePage.css';

const AttendancePage: React.FC = () => {
    const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
    const navigate = useNavigate();

    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [subjectName, setSubjectName] = useState("Loading...");
    const [groupName, setGroupName] = useState("");

    // Terms structure: { id: string, name: string, dates: string[] }
    const [terms, setTerms] = useState<any[]>([]);

    // Attendance data: studentId -> midtermId -> date -> status (1 or 0)
    const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, Record<string, number>>>>({});

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'student' | 'date'; id: string; termId?: string; date?: string } | null>(null);

    // New Student State
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');

    // Edit Student State
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editingStudentName, setEditingStudentName] = useState('');

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleContextMenu = (e: React.MouseEvent, type: 'student' | 'date', id: string, termId?: string, date?: string) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, type, id, termId, date });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!subjectId || !groupId) return;
            try {
                const { default: api } = await import('../../api/client');

                // Fetch Students
                const studentsRes = await api.get(`/v1/students/?group=${groupId}`);
                const mappedStudents = studentsRes.data.map((s: any) => ({
                    id: String(s.id),
                    firstName: s.name.split(' ')[0],
                    lastName: s.name.split(' ').slice(1).join(' ') || '',
                }));
                setStudents(mappedStudents);

                // Fetch Midterms
                const midtermsRes = await api.get(`/v1/midterms/?group=${groupId}`);

                // Fetch All Attendance for this group
                const attendanceRes = await api.get(`/v1/attendance/?group=${groupId}`);
                const rawAttendance = attendanceRes.data;

                // Process Attendance
                const attMap: Record<string, Record<string, Record<string, number>>> = {};
                const datesPerMidterm: Record<string, Set<string>> = {};

                rawAttendance.forEach((att: any) => {
                    const sId = String(att.student);
                    const mId = String(att.midterm);
                    const date = att.date;
                    const status = att.status; // 0 or 1

                    if (!attMap[sId]) attMap[sId] = {};
                    if (!attMap[sId][mId]) attMap[sId][mId] = {};
                    attMap[sId][mId][date] = status;

                    if (!datesPerMidterm[mId]) datesPerMidterm[mId] = new Set();
                    datesPerMidterm[mId].add(date);
                });

                setAttendanceData(attMap);

                // Map Midterms with sorted dates
                const mappedTerms = midtermsRes.data.map((m: any) => ({
                    id: String(m.id),
                    name: m.name,
                    dates: Array.from(datesPerMidterm[String(m.id)] || []).sort()
                }));
                setTerms(mappedTerms);

                // Headlines
                try {
                    const subjectRes = await api.get(`/v1/subjects/${subjectId}/`);
                    setSubjectName(subjectRes.data.name);
                } catch (e) { console.warn(e); }
                try {
                    const groupRes = await api.get(`/v1/groups/${groupId}/`);
                    setGroupName(groupRes.data.name);
                } catch (e) { console.warn(e); }

            } catch (error) {
                console.error("Error fetching data", error);
            }
        };

        fetchInitialData();
    }, [subjectId, groupId]);

    const handleAddColumn = async (termId: string) => {
        // Automatically use today's date
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        try {
            const { default: api } = await import('../../api/client');
            // Create default attendance (Present=1) for all students
            const promises = students.map(student =>
                api.post('/v1/attendance/', {
                    student: student.id,
                    group: groupId,
                    midterm: termId,
                    date: today,
                    status: 1
                })
            );
            await Promise.all(promises);

            // Reload page to refresh data
            window.location.reload();
        } catch (error) {
            console.error("Error adding column", error);
            alert("Failed to add attendance for today.");
        }
    };

    const handleAttendanceChange = async (studentId: string, midtermId: string, date: string, newVal: number) => {
        try {
            const { default: api } = await import('../../api/client');

            // Re-fetch specific record to find ID to update
            const res = await api.get(`/v1/attendance/?student=${studentId}&group=${groupId}&midterm=${midtermId}`);
            // Filter locally for date match (since filter by date wasn't strictly added to ViewSet but could be added easily)
            // We didn't add ?date= filtering in ViewSet, so we must filter client side or add it.
            // Given the small number of records per student/midterm, client side filter is okay for now.
            const record = res.data.find((r: any) => r.date === date);

            if (record) {
                await api.put(`/v1/attendance/${record.id}/`, {
                    student: studentId,
                    group: groupId,
                    midterm: midtermId,
                    date: date,
                    status: newVal
                });
            } else {
                await api.post('/v1/attendance/', {
                    student: studentId,
                    group: groupId,
                    midterm: midtermId,
                    date: date,
                    status: newVal
                });
            }

            // Update local state
            setAttendanceData(prev => ({
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    [midtermId]: {
                        ...(prev[studentId]?.[midtermId] || {}),
                        [date]: newVal
                    }
                }
            }));

        } catch (e) {
            console.error("Update failed", e);
        }
    };

    const handleAddStudent = async () => {
        if (!groupId || !newStudentName.trim()) return;
        try {
            const { default: api } = await import('../../api/client');

            // Create student
            await api.post('/v1/students/', {
                name: newStudentName.trim(),
                group: groupId
            });

            // Refresh students list
            const studentsRes = await api.get(`/v1/students/?group=${groupId}`);
            const mappedStudents = studentsRes.data.map((s: any) => ({
                id: String(s.id),
                firstName: s.name.split(' ')[0],
                lastName: s.name.split(' ').slice(1).join(' ') || '',
            }));
            setStudents(mappedStudents);

            // Reset state
            setIsAddingStudent(false);
            setNewStudentName('');
        } catch (error) {
            console.error("Error adding student", error);
        }
    };

    const handleEditStudent = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (student) {
            setEditingStudentId(studentId);
            setEditingStudentName(`${student.lastName}, ${student.firstName}`);
        }
        setContextMenu(null);
    };

    const handleUpdateStudent = async (studentId: string) => {
        if (!editingStudentName.trim()) return;

        try {
            const { default: api } = await import('../../api/client');

            await api.put(`/v1/students/${studentId}/`, {
                name: editingStudentName.trim()
            });

            // Refresh students list
            const studentsRes = await api.get(`/v1/students/?group=${groupId}`);
            const mappedStudents = studentsRes.data.map((s: any) => ({
                id: String(s.id),
                firstName: s.name.split(' ')[0],
                lastName: s.name.split(' ').slice(1).join(' ') || '',
            }));
            setStudents(mappedStudents);

            setEditingStudentId(null);
            setEditingStudentName('');
        } catch (error) {
            console.error("Error updating student", error);
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to delete this student?')) return;

        try {
            const { default: api } = await import('../../api/client');
            await api.delete(`/v1/students/${studentId}/`);

            // Refresh students list
            const studentsRes = await api.get(`/v1/students/?group=${groupId}`);
            const mappedStudents = studentsRes.data.map((s: any) => ({
                id: String(s.id),
                firstName: s.name.split(' ')[0],
                lastName: s.name.split(' ').slice(1).join(' ') || '',
            }));
            setStudents(mappedStudents);
        } catch (error) {
            console.error("Error deleting student", error);
        }
        setContextMenu(null);
    };

    const handleDeleteDate = async (termId: string, date: string) => {
        if (!confirm(`Are you sure you want to delete attendance for ${date}?`)) return;

        try {
            const { default: api } = await import('../../api/client');

            // Delete all attendance records for this date and midterm
            const attendanceRes = await api.get(`/v1/attendance/?group=${groupId}&midterm=${termId}`);
            const recordsToDelete = attendanceRes.data.filter((r: any) => r.date === date);

            await Promise.all(
                recordsToDelete.map((record: any) =>
                    api.delete(`/v1/attendance/${record.id}/`)
                )
            );

            // Reload page to refresh
            window.location.reload();
        } catch (error) {
            console.error("Error deleting attendance date", error);
        }
        setContextMenu(null);
    };

    const handleGradesClick = () => {
        navigate(`/grades/${subjectId}/${groupId}`);
    };

    const getStatus = (studentId: string, midtermId: string, date: string) => {
        return attendanceData[studentId]?.[midtermId]?.[date] ?? null;
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
                                {terms.map(term => (
                                    <th key={term.id} colSpan={term.dates.length + 1} className="unified-header-main">
                                        {term.name}
                                    </th>
                                ))}
                                <th rowSpan={2} className="unified-header-vertical">
                                    <div className="vertical-text-wrapper">Inasistencias</div>
                                </th>
                            </tr>
                            <tr>
                                {terms.map(term => (
                                    <React.Fragment key={`${term.id}-dates`}>
                                        {term.dates.map((date: string, idx: number) => (
                                            <th
                                                key={idx}
                                                className="unified-header-vertical"
                                                onContextMenu={(e) => handleContextMenu(e, 'date', `${term.id}-${idx}`, term.id, date)}
                                            >
                                                {/* Display full date with year */}
                                                <div className="vertical-text-wrapper">{date}</div>
                                            </th>
                                        ))}
                                        <th
                                            className="add-btn-cell"
                                            onClick={() => handleAddColumn(term.id)}
                                            title="Add Date"
                                        >
                                            +
                                        </th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td
                                        className="student-col-unified"
                                        onContextMenu={(e) => handleContextMenu(e, 'student', student.id)}
                                    >
                                        {editingStudentId === student.id ? (
                                            <input
                                                type="text"
                                                className="unified-input"
                                                value={editingStudentName}
                                                onChange={(e) => setEditingStudentName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleUpdateStudent(student.id);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingStudentId(null);
                                                        setEditingStudentName('');
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (editingStudentName.trim()) {
                                                        handleUpdateStudent(student.id);
                                                    } else {
                                                        setEditingStudentId(null);
                                                    }
                                                }}
                                                autoFocus
                                                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'left', padding: '0 24px' }}
                                            />
                                        ) : (
                                            `${student.lastName}, ${student.firstName}`
                                        )}
                                    </td>
                                    {terms.map((term) => (
                                        <React.Fragment key={term.id}>
                                            {term.dates.map((date: string, idx: number) => {
                                                const status = getStatus(student.id, term.id, date);
                                                const val = status !== null ? String(status) : "";
                                                return (
                                                    <td key={idx} className="unified-cell-hover">
                                                        <div className="cell-input-wrapper">
                                                            <input
                                                                type="number"
                                                                className={`unified-input ${val === '1' ? 'passing' : val === '0' ? 'failing' : ''}`}
                                                                min="0"
                                                                max="1"
                                                                value={val}
                                                                onChange={(e) => { }} // Controlled by onKeyDown or native
                                                                onKeyDown={(e) => {
                                                                    const key = e.key;
                                                                    if (key === '0' || key === '1') {
                                                                        e.preventDefault();
                                                                        handleAttendanceChange(student.id, term.id, date, Number(key));
                                                                    }
                                                                }}
                                                                // Also support simple typing
                                                                onInput={(e) => {
                                                                    const v = (e.target as HTMLInputElement).value;
                                                                    if (v === '0' || v === '1') {
                                                                        handleAttendanceChange(student.id, term.id, date, Number(v));
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td style={{ backgroundColor: '#fafafa' }}></td>
                                        </React.Fragment>
                                    ))}
                                    <td className="total-cell-unified" style={{ textAlign: 'center' }}>
                                        {/* Calc absences */}
                                        {(() => {
                                            let absences = 0;
                                            terms.forEach(t => {
                                                t.dates.forEach((d: string) => {
                                                    const s = getStatus(student.id, t.id, d);
                                                    if (s === 0) absences++;
                                                });
                                            });
                                            return absences;
                                        })()}
                                    </td>
                                </tr>
                            ))}
                            {/* Add Student Row */}
                            <tr>
                                <td
                                    className="student-col-unified"
                                    style={{ textAlign: isAddingStudent ? 'left' : 'center', fontWeight: 'bold', cursor: isAddingStudent ? 'default' : 'pointer', padding: '8px' }}
                                    onClick={() => !isAddingStudent && setIsAddingStudent(true)}
                                >
                                    {isAddingStudent ? (
                                        <input
                                            type="text"
                                            className="unified-input"
                                            placeholder="Nombre completo del estudiante"
                                            value={newStudentName}
                                            onChange={(e) => setNewStudentName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddStudent();
                                                } else if (e.key === 'Escape') {
                                                    setIsAddingStudent(false);
                                                    setNewStudentName('');
                                                }
                                            }}
                                            onBlur={() => {
                                                if (newStudentName.trim()) {
                                                    handleAddStudent();
                                                } else {
                                                    setIsAddingStudent(false);
                                                }
                                            }}
                                            autoFocus
                                            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
                                        />
                                    ) : (
                                        '+'
                                    )}
                                </td>
                                {terms.map(term => (
                                    <React.Fragment key={term.id}>
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
                            <>
                                <div className="context-menu-item-unified" onClick={() => handleEditStudent(contextMenu.id)}>
                                    Editar
                                </div>
                                <div className="context-menu-item-unified danger" onClick={() => handleDeleteStudent(contextMenu.id)}>
                                    Eliminar
                                </div>
                            </>
                        )}
                        {contextMenu.type === 'date' && contextMenu.termId && contextMenu.date && (
                            <div className="context-menu-item-unified danger" onClick={() => handleDeleteDate(contextMenu.termId!, contextMenu.date!)}>
                                Eliminar
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
};

export default AttendancePage;
