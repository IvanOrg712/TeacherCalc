import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Student, Midterm, Evaluation, Activity, GradingConfig } from '../../@types/models';
import { useTableSelection } from '../../hooks/useTableSelection';
import { calculateAllStats } from '../../utils/statsUtils';
import SelectionStatsOverlay from '../../components/features/SelectionStatsOverlay/SelectionStatsOverlay';
import NewEvaluationOverlay from '../../components/overlays/NewEvaluationOverlay/NewEvaluationOverlay';
import NewActivityOverlay from '../../components/overlays/NewActivityOverlay/NewActivityOverlay';
import ErrorOverlay from '../../components/overlays/ErrorOverlay/ErrorOverlay';
import './GradesPage.css';

const GradesPage: React.FC = () => {
    const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
    const navigate = useNavigate();

    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [midterms, setMidterms] = useState<Midterm[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [activities, setActivities] = useState<Record<string, Activity[]>>({}); // evalId -> activities
    // Map: studentId -> activityId -> { id: gradeId, score: number }
    const [gradesMap, setGradesMap] = useState<Record<string, Record<string, { id: number; score: number }>>>({});

    const [activeMidtermId, setActiveMidtermId] = useState<string | null>(null);
    const [subjectName, setSubjectName] = useState("Loading...");
    const [groupName, setGroupName] = useState("");
    const [gradingConfig, setGradingConfig] = useState<GradingConfig>({
        passingGrade: 6,
        maxGrade: 10,
        gradeScale: 'numeric'
    });

    // Overlays State
    const [isEvalOverlayOpen, setIsEvalOverlayOpen] = useState(false);
    const [isActivityOverlayOpen, setIsActivityOverlayOpen] = useState(false);
    const [targetEvalIdForActivity, setTargetEvalIdForActivity] = useState<string | null>(null);

    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isErrorOpen, setIsErrorOpen] = useState(false);

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setIsErrorOpen(true);
    };

    // Track which cell is currently being edited (null = none)
    const [editingCell, setEditingCell] = useState<string | null>(null);

    // Ref for the table container to detect clicks outside
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(false);

    // Fetch Initial Data (Students, Group Info, Midterms)
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!groupId || !subjectId) return;
            setLoading(true);
            try {
                const { default: api } = await import('../../api/client');

                // Fetch Students
                const studentsRes = await api.get(`/v1/students/?group=${groupId}`);
                // Map API students to frontend interface
                const mappedStudents = studentsRes.data.map((s: any) => ({
                    id: String(s.id),
                    firstName: s.name.split(' ')[0],
                    lastName: s.name.split(' ').slice(1).join(' ') || '',
                    attendance: {}
                }));
                setStudents(mappedStudents);

                // Fetch Midterms
                const midtermsRes = await api.get(`/v1/midterms/?group=${groupId}`);
                const mappedMidterms = midtermsRes.data.map((m: any) => ({
                    id: String(m.id),
                    name: m.name,
                    groupId: String(m.group)
                }));
                setMidterms(mappedMidterms);
                if (mappedMidterms.length > 0) {
                    setActiveMidtermId(mappedMidterms[0].id);
                }

                // Fetch Subject/Group info
                try {
                    const subjectRes = await api.get(`/v1/subjects/${subjectId}/`);
                    setSubjectName(subjectRes.data.name);
                } catch (e) { console.warn("Subject fetch failed", e); }

                try {
                    const groupRes = await api.get(`/v1/groups/${groupId}/`);
                    setGroupName(groupRes.data.name);
                } catch (e) { console.warn("Group fetch failed", e); }


            } catch (error) {
                console.error("Error fetching initial data", error);
                showError("Failed to load class data.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [groupId, subjectId]);

    // Fetch Evaluations and Grades when Active Midterm Changes
    useEffect(() => {
        const fetchEvalData = async () => {
            if (!activeMidtermId || !groupId) return;
            try {
                const { default: api } = await import('../../api/client');

                // Fetch Evaluations (with nested activities)
                const evalsRes = await api.get(`/v1/evaluations/?midterm=${activeMidtermId}`);
                const rawEvals = evalsRes.data;

                const mappedEvals: Evaluation[] = rawEvals.map((e: any) => ({
                    id: String(e.id),
                    name: e.name,
                    midtermId: String(e.midterm),
                    weightPercentage: Number(e.weight_percentage)
                }));
                setEvaluations(mappedEvals);

                const actsMap: Record<string, Activity[]> = {};
                rawEvals.forEach((e: any) => {
                    actsMap[String(e.id)] = (e.activities || []).map((a: any) => ({
                        id: String(a.id),
                        name: a.name,
                        evaluationId: String(e.id),
                        maxScore: Number(a.max_score || 10) // Default max score
                    }));
                });
                setActivities(actsMap);

                // Fetch Grades for the group
                const gradesRes = await api.get(`/v1/grades/?group=${groupId}`);
                const map: Record<string, Record<string, { id: number; score: number }>> = {};
                gradesRes.data.forEach((g: any) => {
                    const sId = String(g.student);
                    const aId = String(g.activity);
                    if (!map[sId]) map[sId] = {};
                    map[sId][aId] = { id: g.id, score: Number(g.score) };
                });
                setGradesMap(map);

            } catch (error) {
                console.error("Error fetching eval/grades", error);
                showError("Failed to load evaluations and grades.");
            }
        };
        fetchEvalData();
    }, [activeMidtermId, groupId]);


    // Handlers
    const handleAddEvaluation = () => {
        setIsEvalOverlayOpen(true);
    };

    const handleSaveEvaluation = async (data: { name: string; isFixed: boolean; weight: number }) => {
        if (!activeMidtermId) return;
        try {
            const { default: api } = await import('../../api/client');
            await api.post('/v1/evaluations/', {
                midterm: activeMidtermId,
                name: data.name,
                is_fixed: data.isFixed,
                weight_percentage: data.weight
            });
            setIsEvalOverlayOpen(false);
            // Refresh
            const tempM = activeMidtermId;
            setActiveMidtermId(null);
            setTimeout(() => setActiveMidtermId(tempM), 10); // Trigger refresh hack or refactor to fetch function
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddActivity = (evalId: string) => {
        setTargetEvalIdForActivity(evalId);
        setIsActivityOverlayOpen(true);
    };

    const handleSaveActivity = async (data: any) => {
        if (!targetEvalIdForActivity) return;
        try {
            const { default: api } = await import('../../api/client');
            // Parse scale "0/30" => max_score=30?
            // Assuming max_score is derived or passed directly. For now default 10 or parse.
            let maxScore = 10;
            if (data.scale && data.scale.includes('/')) {
                maxScore = Number(data.scale.split('/')[1]);
            } else if (data.scale) {
                maxScore = Number(data.scale);
            }

            await api.post('/v1/activities/', {
                evaluation: targetEvalIdForActivity,
                name: data.name,
                description: data.description,
                is_fixed: data.isFixed,
                weight_percentage: data.weight,
                max_score: maxScore,
                is_extra_points: data.isExtra
            });

            setIsActivityOverlayOpen(false);
            // Refresh logic (simple toggle for now)
            const tempM = activeMidtermId;
            setActiveMidtermId(null);
            setTimeout(() => setActiveMidtermId(tempM), 10);
        } catch (error) {
            console.error(error);
        }
    };


    // Build a flat column structure for selection logic
    const columnStructure = useMemo(() => {
        const cols: Array<{ type: 'activity' | 'plus' | 'final'; evalId?: string; actId?: string; maxScore?: number; globalColIndex: number }> = [];
        let globalIdx = 0;

        evaluations.forEach(ev => {
            const acts = activities[ev.id] || [];
            acts.forEach(act => {
                cols.push({ type: 'activity', evalId: ev.id, actId: act.id, maxScore: act.maxScore, globalColIndex: globalIdx });
                globalIdx++;
            });
            // Plus column (not selectable) - Used for adding activity
            cols.push({ type: 'plus', evalId: ev.id, globalColIndex: globalIdx });
            globalIdx++;
        });
        // Final grade column (not selectable)
        cols.push({ type: 'final', globalColIndex: globalIdx });

        return cols;
    }, [evaluations, activities]);

    const totalCols = columnStructure.length;
    const [selectionMode, setSelectionMode] = useState<'activity' | 'final' | null>(null);
    const [pendingSelection, setPendingSelection] = useState<any>(null);
    const finalColIndex = useMemo(() => columnStructure.findIndex(col => col.type === 'final'), [columnStructure]);

    // Selectable Logic
    const isSelectable = useCallback((_row: number, col: number): boolean => {
        if (col < 0 || col >= columnStructure.length) return false;
        const colInfo = columnStructure[col];
        if (colInfo.type === 'plus') return false;
        if (selectionMode === null) return colInfo.type === 'activity' || colInfo.type === 'final';
        return colInfo.type === selectionMode;
    }, [columnStructure, selectionMode]);

    const { selectedCells, handleCellMouseDown, handleCellMouseEnter, handleMouseUp,
        handleRowSelect, handleColumnSelect, clearSelection, isSelected
    } = useTableSelection({ totalRows: students.length, totalCols, isSelectable });

    // Handle grade change (save to API)
    const handleGradeChange = async (studentId: string, activityId: string, value: string, maxScore: number) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= maxScore) {
            const existingGrade = gradesMap[studentId]?.[activityId];

            try {
                const { default: api } = await import('../../api/client');
                if (existingGrade) {
                    await api.put(`/v1/grades/${existingGrade.id}/`, {
                        student: studentId,
                        activity: activityId,
                        score: numValue
                    });
                } else {
                    const res = await api.post('/v1/grades/', {
                        student: studentId,
                        activity: activityId,
                        score: numValue
                    });
                    // Update map locally to avoid full re-fetch
                    setGradesMap(prev => ({
                        ...prev,
                        [studentId]: {
                            ...prev[studentId],
                            [activityId]: { id: res.data.id, score: numValue }
                        }
                    }));
                }
            } catch (e) {
                console.error("Save grade failed", e);
            }
        }
    };

    // Calculate Final Grades
    const finalGrades = useMemo(() => {
        return students.map((student) => {
            let totalWeightedScore = 0;
            let totalWeight = 0;

            evaluations.forEach(ev => {
                const evActivities = activities[ev.id] || [];
                if (evActivities.length === 0) return;

                let evalSum = 0;
                let evalCount = 0;
                evActivities.forEach(act => {
                    const gradeData = gradesMap[student.id]?.[act.id];
                    if (gradeData) {
                        const normalizedGrade = (gradeData.score / act.maxScore) * gradingConfig.maxGrade;
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
    }, [students, evaluations, activities, gradesMap, gradingConfig]);


    // Wrapper helpers (reuse from previous file)
    const handleCellSelect = useCallback((row: number, col: number, event: React.MouseEvent) => {
        const colInfo = columnStructure[col];
        if (!colInfo) return;
        const newMode = colInfo.type === 'final' ? 'final' : colInfo.type === 'activity' ? 'activity' : null;
        if (newMode && newMode !== selectionMode) {
            setSelectionMode(newMode);
            setPendingSelection({ type: 'cell', row, col, shiftKey: event.shiftKey });
        } else {
            handleCellMouseDown(row, col, event);
        }
    }, [columnStructure, selectionMode, handleCellMouseDown]);

    // ... (Keep handleFinalColumnSelect, handleActivityColumnSelect, handleStudentRowSelect, handleClearSelection etc.)
    // For brevity, using simpler calls in JSX.


    // Handle mouse up globally to end drag selection
    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseUp]);


    return (
        <div className="grades-page" onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            if (!tableContainerRef.current?.contains(target) && !target.closest('.stats-overlay') && target.tagName !== 'INPUT' && target.tagName !== 'BUTTON') {
                clearSelection();
                setEditingCell(null);
            }
        }}>
            <header className="grades-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => navigate('/dashboard')}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>
                    <h1>{subjectName}</h1>
                </div>

                <div className="grades-actions">
                    <button className="add-eval-btn" onClick={handleAddEvaluation}>+ Evaluación</button>
                    <div className="grades-group">Grupo {groupName}</div>
                </div>
            </header>

            <div className="midterm-tabs">
                {midterms.map(midterm => (
                    <div key={midterm.id} className={`midterm-tab ${activeMidtermId === midterm.id ? 'active' : ''}`} onClick={() => setActiveMidtermId(midterm.id)}>
                        {midterm.name}
                    </div>
                ))}
            </div>

            <div className="grades-content">
                <div ref={tableContainerRef} className="unified-table-container">
                    {loading ? <div>Loading...</div> : (
                        <table className="unified-table grades-selectable">
                            <thead>
                                <tr>
                                    <th rowSpan={2} className="student-col-unified">Nombre del Estudiante</th>
                                    {evaluations.map(ev => (
                                        <th key={ev.id} colSpan={(activities[ev.id]?.length || 0) + 1} className="unified-header-main">
                                            {ev.name} ({ev.weightPercentage}%)
                                        </th>
                                    ))}
                                    <th rowSpan={2} className="unified-header-vertical">Final</th>
                                </tr>
                                <tr>
                                    {evaluations.map((ev, evIdx) => (
                                        <React.Fragment key={ev.id}>
                                            {activities[ev.id]?.map((act, actIdx) => (
                                                <th key={act.id} className="unified-header-vertical">
                                                    <div className="vertical-text-wrapper">{act.name}</div>
                                                </th>
                                            ))}
                                            <th className="add-btn-cell" onClick={() => handleAddActivity(ev.id)}>+</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, sIdx) => {
                                    let cIdx = 0;
                                    return (
                                        <tr key={student.id}>
                                            <td className="student-col-unified">{student.lastName}, {student.firstName}</td>
                                            {evaluations.map(ev => (
                                                <React.Fragment key={ev.id}>
                                                    {activities[ev.id]?.map(act => {
                                                        const gradeData = gradesMap[student.id]?.[act.id];
                                                        const score = gradeData?.score;
                                                        const isSelectedCell = isSelected(sIdx, cIdx);
                                                        const currentCIdx = cIdx;
                                                        cIdx++;
                                                        return (
                                                            <td key={act.id}
                                                                className={`unified-cell-hover ${isSelectedCell ? 'cell-selected' : ''}`}
                                                                onMouseDown={(e) => handleCellSelect(sIdx, currentCIdx, e)}
                                                                onMouseEnter={() => handleCellMouseEnter(sIdx, currentCIdx)}
                                                                onDoubleClick={() => setEditingCell(`${student.id}-${act.id}`)}
                                                            >
                                                                <div className="cell-input-wrapper">
                                                                    <input
                                                                        type="number"
                                                                        className="unified-input"
                                                                        value={score ?? ''}
                                                                        readOnly={editingCell !== `${student.id}-${act.id}`}
                                                                        onChange={(e) => {
                                                                            // Local update only visually if needed, but here dependent on map
                                                                            // Real app: update local state, debounce save
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            handleGradeChange(student.id, act.id, e.target.value, act.maxScore);
                                                                            setEditingCell(null);
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleGradeChange(student.id, act.id, (e.target as HTMLInputElement).value, act.maxScore);
                                                                                setEditingCell(null);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                    <td style={{ backgroundColor: '#fafafa' }}>{(() => { cIdx++; return null; })()}</td>
                                                </React.Fragment>
                                            ))}
                                            <td className="total-cell-unified">
                                                {finalGrades[sIdx]?.toFixed(2) || '-'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <footer className="unified-footer">
                <button className="footer-btn-unified" onClick={() => navigate(`/attendance/${subjectId}/${groupId}`)}>Asistencia</button>
                <button className="footer-btn-unified active">Calificaciones</button>
            </footer>

            <NewEvaluationOverlay
                isOpen={isEvalOverlayOpen}
                onClose={() => setIsEvalOverlayOpen(false)}
                onSave={handleSaveEvaluation}
            />

            <NewActivityOverlay
                isOpen={isActivityOverlayOpen}
                onClose={() => setIsActivityOverlayOpen(false)}
                onSave={handleSaveActivity}
            />

            <ErrorOverlay
                isOpen={isErrorOpen}
                onClose={() => setIsErrorOpen(false)}
                message={errorMessage}
            />
        </div>
    );
};

export default GradesPage;
