import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getSubject,
    getGroup,
    getStudentsForGroup,
    getMidtermsForGroup,
    getEvaluationsForMidterm,
    getActivitiesForEvaluation,
    getStudentGrade,
    updateStudentGrade
} from '../../data/mockData';
import type { Student, Midterm, Evaluation, Activity } from '../../@types/models';
import { useTableSelection } from '../../hooks/useTableSelection';
import { calculateAllStats } from '../../utils/statsUtils';
import SelectionStatsOverlay from '../../components/features/SelectionStatsOverlay/SelectionStatsOverlay';
import './GradesPage.css';

const GradesPage: React.FC = () => {
    const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
    const navigate = useNavigate();

    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [midterms, setMidterms] = useState<Midterm[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [activities, setActivities] = useState<Record<string, Activity[]>>({}); // evalId -> activities

    const [activeMidtermId, setActiveMidtermId] = useState<string | null>(null);
    const [subjectName, setSubjectName] = useState("Loading...");
    const [groupName, setGroupName] = useState("");

    // Track which cell is currently being edited (null = none)
    const [editingCell, setEditingCell] = useState<string | null>(null);

    // Build a flat column structure for selection logic
    // Each entry: { type: 'activity' | 'plus' | 'final', evalId?, actId?, actIndex?, evIndex? }
    const columnStructure = useMemo(() => {
        const cols: Array<{ type: 'activity' | 'plus' | 'final'; evalId?: string; actId?: string; globalColIndex: number }> = [];
        let globalIdx = 0;

        evaluations.forEach(ev => {
            const acts = activities[ev.id] || [];
            acts.forEach(act => {
                cols.push({ type: 'activity', evalId: ev.id, actId: act.id, globalColIndex: globalIdx });
                globalIdx++;
            });
            // Plus column (not selectable)
            cols.push({ type: 'plus', evalId: ev.id, globalColIndex: globalIdx });
            globalIdx++;
        });
        // Final grade column (not selectable)
        cols.push({ type: 'final', globalColIndex: globalIdx });

        return cols;
    }, [evaluations, activities]);

    // Total number of selectable columns
    const totalCols = columnStructure.length;

    // Determine if a cell is selectable (exclude plus columns and final grade)
    const isSelectable = useCallback((_row: number, col: number): boolean => {
        if (col < 0 || col >= columnStructure.length) return false;
        const colInfo = columnStructure[col];
        return colInfo.type === 'activity';
    }, [columnStructure]);

    // Selection hook
    const {
        selectedCells,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleMouseUp,
        handleRowSelect,
        handleColumnSelect,
        clearSelection,
        isSelected
    } = useTableSelection({
        totalRows: students.length,
        totalCols,
        isSelectable
    });

    // Build a 2D array of grade values for quick lookup
    const gradeMatrix = useMemo(() => {
        const matrix: (number | undefined)[][] = [];
        students.forEach((student) => {
            const row: (number | undefined)[] = [];
            columnStructure.forEach(colInfo => {
                if (colInfo.type === 'activity' && colInfo.actId) {
                    row.push(getStudentGrade(student.id, colInfo.actId));
                } else {
                    row.push(undefined);
                }
            });
            matrix.push(row);
        });
        return matrix;
    }, [students, columnStructure]);

    // Calculate stats from selected cells
    const selectionStats = useMemo(() => {
        const values: number[] = [];
        selectedCells.forEach(key => {
            const [rowStr, colStr] = key.split('-');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);
            if (gradeMatrix[row] && gradeMatrix[row][col] !== undefined) {
                values.push(gradeMatrix[row][col] as number);
            }
        });
        return calculateAllStats(values);
    }, [selectedCells, gradeMatrix]);

    // Load Initial Data
    useEffect(() => {
        if (subjectId && groupId) {
            const subjectData = getSubject(subjectId);
            const groupData = getGroup(groupId);

            if (subjectData) setSubjectName(subjectData.subject.name);
            if (groupData) setGroupName(groupData.group.name);

            setStudents(getStudentsForGroup(groupId));

            const groupMidterms = getMidtermsForGroup(groupId);
            setMidterms(groupMidterms);

            if (groupMidterms.length > 0) {
                setActiveMidtermId(groupMidterms[0].id);
            }
        }
    }, [subjectId, groupId]);

    // Load Evaluations/Activities when Midterm changes
    useEffect(() => {
        if (activeMidtermId) {
            const evals = getEvaluationsForMidterm(activeMidtermId);
            setEvaluations(evals);

            const actsMap: Record<string, Activity[]> = {};
            evals.forEach(ev => {
                actsMap[ev.id] = getActivitiesForEvaluation(ev.id);
            });
            setActivities(actsMap);
        }
    }, [activeMidtermId]);

    // Clear selection when midterm changes
    useEffect(() => {
        clearSelection();
        setEditingCell(null);
    }, [activeMidtermId, clearSelection]);

    // Handle Escape key to clear selection and exit edit mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                clearSelection();
                setEditingCell(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [clearSelection]);

    // Function to activate editing on a cell
    const activateEditing = (cellId: string) => {
        setEditingCell(cellId);
        // Focus the input after state update
        setTimeout(() => {
            const input = document.getElementById(cellId) as HTMLInputElement;
            if (input) {
                input.focus();
                input.select();
            }
        }, 0);
    };

    // Function to exit editing mode
    const exitEditing = () => {
        setEditingCell(null);
    };

    // Handle mouse up globally to end drag selection
    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseUp]);

    const handleGradeChange = (studentId: string, activityId: string, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
            updateStudentGrade(studentId, activityId, numValue);
            const el = document.getElementById(`grade-${studentId}-${activityId}`);
            if (el) {
                el.className = `unified-input ${numValue < 6 ? 'failing' : 'passing'}`;
            }
        }
    };

    const getGradeColorClass = (score: number | undefined) => {
        if (score === undefined) return '';
        return score < 6 ? 'failing' : 'passing';
    };

    // Build column header click handlers (for selecting entire column)
    // Returns the global column index for an activity
    const getActivityColIndex = (evIndex: number, actIndex: number): number => {
        let colIdx = 0;
        for (let e = 0; e < evIndex; e++) {
            const ev = evaluations[e];
            const acts = activities[ev.id] || [];
            colIdx += acts.length + 1; // activities + plus column
        }
        return colIdx + actIndex;
    };

    return (
        <div className="grades-page">
            <header className="grades-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => navigate('/dashboard')} aria-label="Go back">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1>{subjectName}</h1>
                </div>
                <div className="grades-group">Grupo {groupName}</div>
            </header>

            <div className="midterm-tabs">
                {midterms.map(midterm => (
                    <div
                        key={midterm.id}
                        className={`midterm-tab ${activeMidtermId === midterm.id ? 'active' : ''}`}
                        onClick={() => setActiveMidtermId(midterm.id)}
                    >
                        {midterm.name}
                    </div>
                ))}
            </div>

            <div className="grades-content">
                <div className="unified-table-container">
                    <table className="unified-table grades-selectable">
                        <thead>
                            {/* Row 1: Evaluations */}
                            <tr>
                                <th rowSpan={2} className="student-col-unified">Nombre del Estudiante</th>
                                {evaluations.map(ev => (
                                    <th
                                        key={ev.id}
                                        colSpan={(activities[ev.id]?.length || 1) + 1}
                                        className="unified-header-main"
                                    >
                                        {ev.name} ({ev.weightPercentage}%)
                                    </th>
                                ))}
                                <th rowSpan={2} className="unified-header-vertical">
                                    <div className="vertical-text-wrapper">Calificación Final</div>
                                </th>
                            </tr>
                            {/* Row 2: Activities */}
                            <tr>
                                {evaluations.map((ev, evIndex) => (
                                    <React.Fragment key={`${ev.id}-activities`}>
                                        {activities[ev.id]?.map((act, actIndex) => {
                                            const colIdx = getActivityColIndex(evIndex, actIndex);
                                            return (
                                                <th
                                                    key={act.id}
                                                    className="unified-header-vertical activity-header-selectable"
                                                    onClick={() => handleColumnSelect(colIdx)}
                                                >
                                                    <div className="vertical-text-wrapper">
                                                        {act.name}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                        <th
                                            className="add-btn-cell"
                                            onClick={() => console.log(`Add activity to ${ev.name}`)}
                                        >
                                            +
                                        </th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, studentIndex) => {
                                let currentColIndex = 0;
                                return (
                                    <tr key={student.id}>
                                        <td
                                            className="student-col-unified student-name-selectable"
                                            onClick={() => handleRowSelect(studentIndex)}
                                        >
                                            {student.lastName}, {student.firstName}
                                        </td>
                                        {evaluations.map((ev, evIndex) => (
                                            <React.Fragment key={`${student.id}-${ev.id}`}>
                                                {activities[ev.id]?.map((act, actIndex) => {
                                                    const score = getStudentGrade(student.id, act.id);
                                                    const columnId = `${evIndex}-${actIndex}`;
                                                    const colIdx = currentColIndex;
                                                    currentColIndex++;
                                                    const cellSelected = isSelected(studentIndex, colIdx);

                                                    return (
                                                        <td
                                                            key={act.id}
                                                            className={`unified-cell-hover ${cellSelected ? 'cell-selected' : ''}`}
                                                            onMouseDown={(e) => handleCellMouseDown(studentIndex, colIdx, e)}
                                                            onMouseEnter={() => handleCellMouseEnter(studentIndex, colIdx)}
                                                            onDoubleClick={() => activateEditing(`grade-${student.id}-${act.id}`)}
                                                        >
                                                            <div className="cell-input-wrapper">
                                                                <input
                                                                    id={`grade-${student.id}-${act.id}`}
                                                                    type="number"
                                                                    className={`unified-input ${getGradeColorClass(score)} ${editingCell === `grade-${student.id}-${act.id}` ? 'grade-editing' : 'grade-readonly'}`}
                                                                    defaultValue={score}
                                                                    min="0" max="10" step="0.1"
                                                                    data-student-index={studentIndex}
                                                                    data-column-id={columnId}
                                                                    readOnly={editingCell !== `grade-${student.id}-${act.id}`}
                                                                    onFocus={(e) => {
                                                                        const target = e.target as HTMLInputElement;
                                                                        // Only clear value if in editing mode
                                                                        if (editingCell === `grade-${student.id}-${act.id}` && target.value !== "") {
                                                                            target.value = "";
                                                                            target.classList.remove('passing', 'failing');
                                                                        }
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        const target = e.target as HTMLInputElement;
                                                                        const cellId = `grade-${student.id}-${act.id}`;

                                                                        // Enter key: if not editing, activate editing; if editing, save and move to next
                                                                        if (e.key === "Enter") {
                                                                            e.preventDefault();

                                                                            if (editingCell !== cellId) {
                                                                                // Activate editing on this cell
                                                                                activateEditing(cellId);
                                                                            } else {
                                                                                // Save and move to next cell
                                                                                handleGradeChange(student.id, act.id, target.value);

                                                                                const numValue = parseFloat(target.value);
                                                                                target.classList.remove('passing', 'failing');
                                                                                if (!isNaN(numValue)) {
                                                                                    target.classList.add(numValue < 6 ? 'failing' : 'passing');
                                                                                }

                                                                                const currentStudentIndex = parseInt(target.dataset.studentIndex || "0");
                                                                                const colId = target.dataset.columnId;
                                                                                const nextStudentIndex = currentStudentIndex + 1;

                                                                                const nextInput = document.querySelector(
                                                                                    `input[data-student-index="${nextStudentIndex}"][data-column-id="${colId}"]`
                                                                                ) as HTMLInputElement;

                                                                                if (nextInput) {
                                                                                    // Activate editing on the next cell
                                                                                    activateEditing(nextInput.id);
                                                                                } else {
                                                                                    exitEditing();
                                                                                    target.blur();
                                                                                }
                                                                            }
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        if (editingCell === `grade-${student.id}-${act.id}`) {
                                                                            handleGradeChange(student.id, act.id, e.target.value);
                                                                            exitEditing();
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                {/* Plus column - increment currentColIndex but not selectable */}
                                                <td
                                                    style={{ backgroundColor: '#fafafa' }}
                                                    onMouseDown={() => {/* not selectable */ }}
                                                >
                                                    {(() => { currentColIndex++; return null; })()}
                                                </td>
                                            </React.Fragment>
                                        ))}
                                        <td className="total-cell-unified">
                                            {/* Total calculation placeholder */}
                                            -
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Overlay */}
            <SelectionStatsOverlay
                stats={selectionStats}
                isVisible={selectedCells.size > 0}
            />

            <footer className="unified-footer">
                <button className="footer-btn-unified" onClick={() => navigate(`/attendance/${subjectId}/${groupId}`)}>Asistencia</button>
                <button className="footer-btn-unified active">Calificaciones</button>
            </footer>
        </div>
    );
};

export default GradesPage;
