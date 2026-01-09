import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import type { Student, Midterm, Evaluation, Activity, GradingConfig } from '../../@types/models';
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
    const [gradingConfig, setGradingConfig] = useState<GradingConfig>({
        passingGrade: 6,
        maxGrade: 10,
        gradeScale: 'numeric'
    });

    // Track which cell is currently being edited (null = none)
    const [editingCell, setEditingCell] = useState<string | null>(null);

    // Ref for the table container to detect clicks outside
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Build a flat column structure for selection logic
    // Each entry: { type: 'activity' | 'plus' | 'final', evalId?, actId?, maxScore?, globalColIndex }
    const columnStructure = useMemo(() => {
        const cols: Array<{ type: 'activity' | 'plus' | 'final'; evalId?: string; actId?: string; maxScore?: number; globalColIndex: number }> = [];
        let globalIdx = 0;

        evaluations.forEach(ev => {
            const acts = activities[ev.id] || [];
            acts.forEach(act => {
                cols.push({ type: 'activity', evalId: ev.id, actId: act.id, maxScore: act.maxScore, globalColIndex: globalIdx });
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

    // Track selection mode: 'activity' | 'final' | null
    // When selecting, only cells of the same type can be selected together
    const [selectionMode, setSelectionMode] = useState<'activity' | 'final' | null>(null);

    // Pending selection to handle mode switching synchronization
    const [pendingSelection, setPendingSelection] = useState<{
        type: 'column' | 'cell';
        index?: number; // for column
        row?: number; // for cell
        col?: number; // for cell
        shiftKey?: boolean;
    } | null>(null);

    // Get the index of the final column
    const finalColIndex = useMemo(() => {
        return columnStructure.findIndex(col => col.type === 'final');
    }, [columnStructure]);

    // Determine if a cell is selectable based on current selection mode
    const isSelectable = useCallback((_row: number, col: number): boolean => {
        if (col < 0 || col >= columnStructure.length) return false;
        const colInfo = columnStructure[col];

        // Plus columns are never selectable
        if (colInfo.type === 'plus') return false;

        // If no selection mode set, allow both activities and final
        if (selectionMode === null) {
            return colInfo.type === 'activity' || colInfo.type === 'final';
        }

        // Otherwise, only allow cells matching the current selection mode
        return colInfo.type === selectionMode;
    }, [columnStructure, selectionMode]);

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

    // Calculate final grades for each student (weighted average of normalized activity grades)
    const finalGrades = useMemo(() => {
        return students.map((student) => {
            let totalWeightedScore = 0;
            let totalWeight = 0;

            evaluations.forEach(ev => {
                const evActivities = activities[ev.id] || [];
                if (evActivities.length === 0) return;

                // Calculate average for this evaluation (normalized to school scale)
                let evalSum = 0;
                let evalCount = 0;
                evActivities.forEach(act => {
                    const grade = getStudentGrade(student.id, act.id);
                    if (grade !== undefined) {
                        const normalizedGrade = (grade / act.maxScore) * gradingConfig.maxGrade;
                        evalSum += normalizedGrade;
                        evalCount++;
                    }
                });

                if (evalCount > 0) {
                    const evalAverage = evalSum / evalCount;
                    totalWeightedScore += evalAverage * (ev.weightPercentage / 100);
                    totalWeight += ev.weightPercentage / 100;
                }
            });

            if (totalWeight === 0) return undefined;
            return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
        });
    }, [students, evaluations, activities, gradingConfig.maxGrade]);

    // Build a 2D array of grade values with maxScore for normalization
    const gradeMatrix = useMemo(() => {
        const matrix: { grade: number | undefined; maxScore: number }[][] = [];
        students.forEach((student, studentIndex) => {
            const row: { grade: number | undefined; maxScore: number }[] = [];
            columnStructure.forEach(colInfo => {
                if (colInfo.type === 'activity' && colInfo.actId) {
                    row.push({
                        grade: getStudentGrade(student.id, colInfo.actId),
                        maxScore: colInfo.maxScore || gradingConfig.maxGrade
                    });
                } else if (colInfo.type === 'final') {
                    // Final grades are already on school scale
                    row.push({
                        grade: finalGrades[studentIndex],
                        maxScore: gradingConfig.maxGrade
                    });
                } else {
                    row.push({ grade: undefined, maxScore: gradingConfig.maxGrade });
                }
            });
            matrix.push(row);
        });
        return matrix;
    }, [students, columnStructure, gradingConfig.maxGrade, finalGrades]);

    // Wrapper to set selection mode before selecting a cell
    const handleCellSelect = useCallback((row: number, col: number, event: React.MouseEvent) => {
        const colInfo = columnStructure[col];
        if (!colInfo) return;

        const newMode = colInfo.type === 'final' ? 'final' : colInfo.type === 'activity' ? 'activity' : null;

        // If mode changes, update it and schedule selection for after render
        if (newMode && newMode !== selectionMode) {
            setSelectionMode(newMode);
            setPendingSelection({ type: 'cell', row, col, shiftKey: event.shiftKey });
        } else {
            handleCellMouseDown(row, col, event);
        }
    }, [columnStructure, selectionMode, handleCellMouseDown]);

    // Wrapper to select final grade column
    const handleFinalColumnSelect = useCallback(() => {
        if (selectionMode !== 'final') {
            setSelectionMode('final');
            setPendingSelection({ type: 'column', index: finalColIndex });
        } else {
            handleColumnSelect(finalColIndex);
        }
    }, [finalColIndex, handleColumnSelect, selectionMode]);

    // Wrapper for activity column select
    const handleActivityColumnSelect = useCallback((col: number) => {
        if (selectionMode !== 'activity') {
            setSelectionMode('activity');
            setPendingSelection({ type: 'column', index: col });
        } else {
            handleColumnSelect(col);
        }
    }, [handleColumnSelect, selectionMode]);

    // Clear selection and reset mode
    const handleClearSelection = useCallback(() => {
        clearSelection();
        setSelectionMode(null);
        setPendingSelection(null);
    }, [clearSelection]);

    // Execute pending selection after mode update (render)
    useEffect(() => {
        if (pendingSelection) {
            if (pendingSelection.type === 'column' && pendingSelection.index !== undefined) {
                handleColumnSelect(pendingSelection.index);
            } else if (pendingSelection.type === 'cell' && pendingSelection.row !== undefined && pendingSelection.col !== undefined) {
                // Mock event for shift key
                handleCellMouseDown(pendingSelection.row, pendingSelection.col, { shiftKey: pendingSelection.shiftKey } as React.MouseEvent);
            }
            setPendingSelection(null);
        }
    }, [pendingSelection, handleColumnSelect, handleCellMouseDown]);

    // Calculate stats from selected cells
    // Normalizes grades to school's scale for pass/fail calculation
    const selectionStats = useMemo(() => {
        const normalizedValues: number[] = [];
        selectedCells.forEach(key => {
            const [rowStr, colStr] = key.split('-');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);
            if (gradeMatrix[row] && gradeMatrix[row][col]?.grade !== undefined) {
                const cellData = gradeMatrix[row][col];
                const rawGrade = cellData.grade as number;
                const maxScore = cellData.maxScore;
                // Normalize to school's scale: (rawGrade / maxScore) * schoolMaxGrade
                const normalizedGrade = (rawGrade / maxScore) * gradingConfig.maxGrade;
                normalizedValues.push(Math.round(normalizedGrade * 100) / 100);
            }
        });
        return calculateAllStats(normalizedValues, gradingConfig.passingGrade);
    }, [selectedCells, gradeMatrix, gradingConfig]);

    // Load Initial Data
    useEffect(() => {
        if (subjectId && groupId) {
            const subjectData = getSubject(subjectId);
            const groupData = getGroup(groupId);

            if (subjectData) setSubjectName(subjectData.subject.name);
            if (groupData) {
                setGroupName(groupData.group.name);
                // Get school's grading configuration
                if (groupData.school.gradingConfig) {
                    setGradingConfig(groupData.school.gradingConfig);
                }
            }

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



    const handleGradeChange = (studentId: string, activityId: string, value: string, maxScore: number) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= maxScore) {
            updateStudentGrade(studentId, activityId, numValue);
            const el = document.getElementById(`grade-${studentId}-${activityId}`);
            if (el) {
                // Normalize to school's scale for pass/fail determination
                const normalizedGrade = (numValue / maxScore) * gradingConfig.maxGrade;
                el.className = `unified-input ${normalizedGrade < gradingConfig.passingGrade ? 'failing' : 'passing'}`;
            }
        }
    };

    // Determine pass/fail color class based on normalized grade
    const getGradeColorClass = (score: number | undefined, maxScore: number) => {
        if (score === undefined) return '';
        // Normalize to school's scale for pass/fail determination
        const normalizedGrade = (score / maxScore) * gradingConfig.maxGrade;
        return normalizedGrade < gradingConfig.passingGrade ? 'failing' : 'passing';
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
        <div
            className="grades-page"
            onMouseDown={(e) => {
                // Don't clear if clicking on table, stats overlay, or interactive elements
                const target = e.target as HTMLElement;
                const isInsideTable = tableContainerRef.current?.contains(target);
                const isStatsOverlay = target.closest('.stats-overlay');
                const isInteractiveElement = target.tagName === 'BUTTON' || target.tagName === 'INPUT';
                const isMidtermTab = target.closest('.midterm-tab');

                if (!isInsideTable && !isStatsOverlay && !isInteractiveElement && !isMidtermTab) {
                    handleClearSelection();
                    setEditingCell(null);
                }
            }}
        >
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
                <div ref={tableContainerRef} className="unified-table-container">
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
                                <th
                                    rowSpan={2}
                                    className="unified-header-vertical activity-header-selectable"
                                    onClick={handleFinalColumnSelect}
                                >
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
                                                    onClick={() => handleActivityColumnSelect(colIdx)}
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
                                                            onMouseDown={(e) => handleCellSelect(studentIndex, colIdx, e)}
                                                            onMouseEnter={() => handleCellMouseEnter(studentIndex, colIdx)}
                                                            onDoubleClick={() => activateEditing(`grade-${student.id}-${act.id}`)}
                                                        >
                                                            <div className="cell-input-wrapper">
                                                                <input
                                                                    id={`grade-${student.id}-${act.id}`}
                                                                    type="number"
                                                                    className={`unified-input ${getGradeColorClass(score, act.maxScore)} ${editingCell === `grade-${student.id}-${act.id}` ? 'grade-editing' : 'grade-readonly'}`}
                                                                    defaultValue={score}
                                                                    min="0" max={act.maxScore} step="0.1"
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
                                                                                handleGradeChange(student.id, act.id, target.value, act.maxScore);

                                                                                const numValue = parseFloat(target.value);
                                                                                target.classList.remove('passing', 'failing');
                                                                                if (!isNaN(numValue)) {
                                                                                    // Normalize for pass/fail determination
                                                                                    const normalizedGrade = (numValue / act.maxScore) * gradingConfig.maxGrade;
                                                                                    target.classList.add(normalizedGrade < gradingConfig.passingGrade ? 'failing' : 'passing');
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
                                                                            handleGradeChange(student.id, act.id, e.target.value, act.maxScore);
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
                                        {(() => {
                                            const finalGrade = finalGrades[studentIndex];
                                            const isFinalSelected = isSelected(studentIndex, finalColIndex);
                                            return (
                                                <td
                                                    className={`total-cell-unified ${isFinalSelected ? 'cell-selected' : ''}`}
                                                    onMouseDown={(e) => handleCellSelect(studentIndex, finalColIndex, e)}
                                                    onMouseEnter={() => handleCellMouseEnter(studentIndex, finalColIndex)}
                                                >
                                                    <div className="cell-input-wrapper">
                                                        <span className={`final-grade-value ${finalGrade !== undefined ? getGradeColorClass(finalGrade, gradingConfig.maxGrade) : ''}`}>
                                                            {finalGrade !== undefined ? finalGrade.toFixed(2) : '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })()}
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
