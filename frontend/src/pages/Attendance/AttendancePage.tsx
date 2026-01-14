import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Student } from '../../@types/models';
import { useSubjectGroup } from '../../contexts/SubjectGroupContext';
import './AttendancePage.css';

const AttendancePage: React.FC = () => {
    const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const {
        data: groupData,
        prefetchAllGroupData,
        updateAttendance,
        refetchStudents,
        refetchAttendance
    } = useSubjectGroup();

    // Note: students, terms, and attendanceData now come from groupData context
    // We no longer need local state for these

    // Derived values from context
    const students = groupData?.students || [];
    const terms = groupData?.midterms.map(m => ({
        id: m.id,
        name: m.name,
        dates: groupData.attendanceDatesByMidterm[m.id] || []
    })) || [];
    const attendanceData = groupData?.attendanceData || {};

    // Trigger prefetch if data not loaded
    useEffect(() => {
        if (!subjectId || !groupId) return;

        // If data not loaded or different group, trigger prefetch
        if (!groupData?.isFullyLoaded || groupData.groupId !== groupId) {
            prefetchAllGroupData(subjectId, groupId);
        }
    }, [subjectId, groupId, groupData, prefetchAllGroupData]);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'student' | 'date'; id: string; termId?: string; date?: string } | null>(null);

    // New Student State
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');

    // Edit Student State
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editingStudentName, setEditingStudentName] = useState('');

    // Edit Date State
    const [editingDate, setEditingDate] = useState<{ termId: string; oldDate: string } | null>(null);
    const [newDate, setNewDate] = useState('');
    const [isAddingColumn, setIsAddingColumn] = useState(false);

    // Multi-selection State
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set()); // Format: "termId|timestamp"
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<string | null>(null);

    // Flattened list of all dates for range calculation
    const allDateColumns = useMemo(() => {
        return terms.flatMap(t => t.dates.map((d: string) => ({
            termId: t.id,
            date: d,
            key: `${t.id}|${d}`
        })));
    }, [terms]);

    // Clean up selection state on global mouse up
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsSelecting(false);
            setSelectionStart(null);
        };
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    // Ref to store input elements for auto-navigation
    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // Don't clear selection if clicking on a header (handled by toggle)
            if ((e.target as HTMLElement).closest('.unified-header-vertical')) return;

            // Clear selection on outside click if not right-clicking
            if (e.button !== 2) {
                setContextMenu(null);
                // If clicking outside the table completely, clear selection
                if (!(e.target as HTMLElement).closest('.unified-table')) {
                    setSelectedDates(new Set());
                }
            } else {
                setContextMenu(null);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleHeaderMouseDown = (e: React.MouseEvent, termId: string, timestamp: string) => {
        // Ignore right-clicks (button 2) - let context menu handle it without changing selection
        if (e.button === 2) return;

        const key = `${termId}|${timestamp}`;
        setIsSelecting(true);
        setSelectionStart(key);
        setSelectedDates(new Set([key]));
    };

    const handleHeaderMouseEnter = (termId: string, timestamp: string) => {
        if (!isSelecting || !selectionStart) return;

        const currentKey = `${termId}|${timestamp}`;
        if (currentKey === selectionStart) {
            // If we date back to start, just select start
            // Actually, we should keep the start selected.
            // But usually dragging back to start means 1 item selected.
            // Logic below handles it (startIdx === endIdx);
        }

        // Calculate range
        const startIdx = allDateColumns.findIndex((c: { key: string }) => c.key === selectionStart);
        const endIdx = allDateColumns.findIndex((c: { key: string }) => c.key === currentKey);

        if (startIdx === -1 || endIdx === -1) return;

        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);

        const newSelection = new Set<string>();
        for (let i = minIdx; i <= maxIdx; i++) {
            newSelection.add(allDateColumns[i].key);
        }
        setSelectedDates(newSelection);
    };

    const handleContextMenu = (e: React.MouseEvent, type: 'student' | 'date', id: string, termId?: string, date?: string) => {
        e.preventDefault();

        // If right-clicking a date, preserve the existing selection
        // This allows users to select multiple dates with left-click, then right-click to delete them
        if (type === 'date' && termId && date) {
            setContextMenu({ x: e.pageX, y: e.pageY, type, id, termId, date });
            return;
        }

        setContextMenu({ x: e.pageX, y: e.pageY, type, id, termId, date });
    };

    // Function to find and focus the next empty cell (vertically in same date column)
    const focusNextEmptyCell = useCallback((currentStudentId: string, currentTermId: string, currentDate: string) => {
        // Find current student index
        const currentStudentIndex = students.findIndex(s => s.id === currentStudentId);
        if (currentStudentIndex === -1) return;

        // Look for next cell vertically (same term and date, next student)
        // We'll focus the next student's cell regardless of whether it's empty or filled
        // This allows for faster attendance taking by moving down the column
        if (currentStudentIndex + 1 < students.length) {
            const nextStudent = students[currentStudentIndex + 1];
            const cellKey = `${nextStudent.id}-${currentTermId}-${currentDate}`;
            const inputElement = inputRefs.current.get(cellKey);
            if (inputElement) {
                setTimeout(() => {
                    inputElement.focus();
                    inputElement.select();
                }, 50);
            }
        } else {
            // If we're at the last student, blur the current cell to unselect it
            const currentCellKey = `${currentStudentId}-${currentTermId}-${currentDate}`;
            const currentInputElement = inputRefs.current.get(currentCellKey);
            if (currentInputElement) {
                setTimeout(() => {
                    currentInputElement.blur();
                }, 50);
            }
        }
    }, [students]);

    // Old fetchInitialData useEffect removed - data now comes from context via prefetchAllGroupData


    // Function to refresh attendance data without page reload
    const refreshAttendanceData = async () => {
        if (!subjectId || !groupId) return;
        // Simply refetch all data from context, forcing a refresh
        await prefetchAllGroupData(subjectId, groupId, true);
    };

    const handleAddColumn = async (termId: string) => {
        if (isAddingColumn) return;
        setIsAddingColumn(true);
        // Automatically use current date and time
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        // Generate unique timestamp by adding current time
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${dateStr}T${hours}:${minutes}:${seconds}`;

        try {
            const { default: api } = await import('../../api/client');

            // Create attendance records with status null (empty) for all students
            // This persists the date in the database while keeping cells empty in the UI
            const promises = students.map(student =>
                api.post('/v1/attendance/', {
                    student: student.id,
                    group: groupId,
                    midterm: termId,
                    date: timestamp,
                    status: null  // null means "not taken yet" / empty
                }).catch(err => {
                    // If record already exists (duplicate date), ignore the error
                    if (err.response?.status === 400) {
                        return; // Ignore duplicate errors
                    }
                    throw err;
                })
            );

            await Promise.all(promises);

            await Promise.all(promises);

            // Refetch attendance data directly
            await refetchAttendance(groupId!);
        } catch (error) {
            console.error("Error adding column", error);
            alert("Failed to add attendance column.");
        } finally {
            setIsAddingColumn(false);
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

            // Update context with optimistic update
            updateAttendance(studentId, midtermId, date, newVal);

            // Auto-navigate to next empty cell
            focusNextEmptyCell(studentId, midtermId, date);

        } catch (error) {
            console.error("Error updating attendance", error);
            // On error, refetch to ensure consistency
            await refreshAttendanceData();
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
            // Refetch students to update list
            await refetchStudents(groupId!);

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
            setEditingStudentName(student.name);
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

            // Refetch students to update list
            await refetchStudents(groupId!);

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

            // Refetch students to update list
            await refetchStudents(groupId!);
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

            // Refresh data without page reload
            await refreshAttendanceData();
        } catch (error) {
            console.error("Error deleting attendance date", error);
        }
        setContextMenu(null);
    };

    const handleBulkDelete = async () => {
        if (selectedDates.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedDates.size} columns?`)) return;

        // Group by termId
        const datesByTerm: Record<string, string[]> = {};
        selectedDates.forEach(key => {
            const [tId, val] = key.split('|');
            if (!datesByTerm[tId]) datesByTerm[tId] = [];
            datesByTerm[tId].push(val);
        });

        try {
            const { default: api } = await import('../../api/client');

            const deletePromises = Object.entries(datesByTerm).map(async ([tId, dates]) => {
                // Fetch all records for this term
                const attendanceRes = await api.get(`/v1/attendance/?group=${groupId}&midterm=${tId}`);
                const recordsToDelete = attendanceRes.data.filter((r: any) => dates.includes(r.date));

                return Promise.all(recordsToDelete.map((record: any) => api.delete(`/v1/attendance/${record.id}/`)));
            });

            await Promise.all(deletePromises);

            await refreshAttendanceData();
            setSelectedDates(new Set()); // Clear selection
        } catch (error) {
            console.error("Bulk delete failed", error);
            alert("Failed to delete selected columns.");
        }
        setContextMenu(null);
    };

    // Helper for single delete to use shared logic if needed, but keeping separate is fine for now.
    // Actually, let's update handleDeleteDate to just use the direct logic as before to avoid breaking changes, 
    // or modify it to use the new API calls. The existing logic works fine.


    const handleEditDate = (termId: string, oldDate: string) => {
        setEditingDate({ termId, oldDate });
        setNewDate(oldDate);
        setContextMenu(null);
    };

    const handleSaveEditedDate = async () => {
        if (!editingDate || !newDate) return;

        const { termId, oldDate } = editingDate;

        try {
            const { default: api } = await import('../../api/client');

            // Get all attendance records for the old date
            const attendanceRes = await api.get(`/v1/attendance/?group=${groupId}&midterm=${termId}`);
            const recordsToUpdate = attendanceRes.data.filter((r: any) => r.date === oldDate);

            // Update each record with the new date
            await Promise.all(
                recordsToUpdate.map((record: any) =>
                    api.put(`/v1/attendance/${record.id}/`, {
                        ...record,
                        date: newDate
                    })
                )
            );

            // Refresh data
            await refreshAttendanceData();
            setEditingDate(null);
            setNewDate('');
        } catch (error) {
            console.error("Error updating attendance date", error);
            alert("Failed to update date.");
        }
    };

    const handleCancelEditDate = () => {
        setEditingDate(null);
        setNewDate('');
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
                    <h1>{groupData?.subjectName || "Loading..."}</h1>
                </div>
                <div className="attendance-group">{t('attendance.group')} {groupData?.groupName || ""}</div>
            </header>

            <div className="attendance-content">
                <div className="unified-table-container">
                    <table className="unified-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="student-col-unified">{t('attendance.studentName')}</th>
                                {terms.map(term => (
                                    <th key={term.id} colSpan={term.dates.length + 1} className="unified-header-main">
                                        {term.name.replace(/Parcial/i, t('midterm.midterm'))}
                                    </th>
                                ))}
                                <th rowSpan={2} className="unified-header-vertical">
                                    <div className="vertical-text-wrapper">{t('attendance.absences')}</div>
                                </th>
                            </tr>
                            <tr>
                                {terms.map(term => (
                                    <React.Fragment key={`${term.id}-dates`}>
                                        {term.dates.map((timestamp: string, idx: number) => {
                                            // Extract date portion for display (YYYY-MM-DD)
                                            const dateOnly = timestamp.split('T')[0];
                                            const isSelected = selectedDates.has(`${term.id}|${timestamp}`);

                                            return (
                                                <th
                                                    key={idx}
                                                    className={`unified-header-vertical ${isSelected ? 'selected' : ''}`}
                                                    onContextMenu={(e) => handleContextMenu(e, 'date', `${term.id}-${idx}`, term.id, timestamp)}
                                                    onMouseDown={(e) => handleHeaderMouseDown(e, term.id, timestamp)}
                                                    onMouseEnter={() => handleHeaderMouseEnter(term.id, timestamp)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        userSelect: 'none'
                                                    }}
                                                >
                                                    {/* Display only date, not time */}
                                                    <div className="vertical-text-wrapper">{dateOnly}</div>
                                                </th>
                                            )
                                        })}
                                        <th
                                            className={`add-btn-cell ${isAddingColumn ? 'disabled' : ''}`}
                                            onClick={() => !isAddingColumn && handleAddColumn(term.id)}
                                            title="Add Date"
                                            style={{ cursor: isAddingColumn ? 'wait' : 'pointer', opacity: isAddingColumn ? 0.7 : 1 }}
                                        >
                                            {isAddingColumn ? '...' : '+'}
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
                                            student.name
                                        )}
                                    </td>
                                    {terms.map((term) => (
                                        <React.Fragment key={term.id}>
                                            {term.dates.map((date: string, idx: number) => {
                                                const status = getStatus(student.id, term.id, date);
                                                // Treat null (empty/not taken) as empty string, otherwise show the status
                                                // Status values: 0 = absent, 1 = present, null = not taken yet
                                                const val = status !== null ? String(status) : "";
                                                const cellKey = `${student.id}-${term.id}-${date}`;
                                                return (
                                                    <td key={idx} className="unified-cell-hover">
                                                        <div className="cell-input-wrapper">
                                                            <input
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        inputRefs.current.set(cellKey, el);
                                                                    } else {
                                                                        inputRefs.current.delete(cellKey);
                                                                    }
                                                                }}
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
                                    {(() => {
                                        let absences = 0;
                                        terms.forEach(t => {
                                            t.dates.forEach((d: string) => {
                                                const s = getStatus(student.id, t.id, d);
                                                if (s === 0) absences++;
                                            });
                                        });

                                        // Check if absences meet or exceed allowed limit
                                        const exceedsLimit = groupData?.absencesAllowed !== null &&
                                            groupData?.absencesAllowed !== undefined &&
                                            absences >= groupData.absencesAllowed;

                                        return (
                                            <td
                                                className="total-cell-unified"
                                                style={{
                                                    textAlign: 'center',
                                                    backgroundColor: exceedsLimit ? '#ef4444' : undefined,
                                                    color: exceedsLimit ? 'white' : undefined,
                                                    fontWeight: exceedsLimit ? 'bold' : undefined
                                                }}
                                            >
                                                {absences}
                                            </td>
                                        );
                                    })()}
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
                <button className="footer-btn-unified active">{t('dashboard.attendance')}</button>
                <button className="footer-btn-unified" onClick={() => navigate(`/grades/${subjectId}/${groupId}`)}>{t('dashboard.grades')}</button>
            </footer>

            {/* Edit Date Modal */}
            {editingDate && (
                <div className="modal-overlay" onClick={handleCancelEditDate}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('attendance.editDate')}</h3>
                        <p>Selecciona una nueva fecha (solo fechas futuras):</p>
                        <input
                            type="date"
                            value={newDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="date-picker-input"
                        />
                        <div className="modal-actions">
                            <button onClick={handleSaveEditedDate} className="btn-primary">
                                Guardar
                            </button>
                            <button onClick={handleCancelEditDate} className="btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    {t('attendance.editStudent')}
                                </div>
                                <div className="context-menu-item-unified danger" onClick={() => handleDeleteStudent(contextMenu.id)}>
                                    {t('attendance.deleteStudent')}
                                </div>
                            </>
                        )}
                        {contextMenu.type === 'date' && contextMenu.termId && contextMenu.date && (
                            <>
                                {selectedDates.size > 1 ? (
                                    <div className="context-menu-item-unified danger" onClick={handleBulkDelete}>
                                        {t('attendance.deleteColumns', { count: selectedDates.size })}
                                    </div>
                                ) : (
                                    <>
                                        <div className="context-menu-item-unified" onClick={() => handleEditDate(contextMenu.termId!, contextMenu.date!)}>
                                            {t('common.edit')}
                                        </div>
                                        <div className="context-menu-item-unified danger" onClick={() => handleDeleteDate(contextMenu.termId!, contextMenu.date!)}>
                                            {t('common.delete')}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )
            }
        </div >
    );
};

export default AttendancePage;
