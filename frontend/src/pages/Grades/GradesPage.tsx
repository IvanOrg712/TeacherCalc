import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GradingConfig } from '../../@types/models';
import { useTableSelection } from '../../hooks/useTableSelection';
import NewEvaluationOverlay from '../../components/overlays/NewEvaluationOverlay/NewEvaluationOverlay';
import NewActivityOverlay from '../../components/overlays/NewActivityOverlay/NewActivityOverlay';
import ErrorOverlay from '../../components/overlays/ErrorOverlay/ErrorOverlay';
import { useSubjectGroup } from '../../contexts/SubjectGroupContext';
import './GradesPage.css';

const GradesPage: React.FC = () => {
    const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data: groupData, prefetchAllGroupData, updateGrade, deleteGrade, refetchEvaluations } = useSubjectGroup();

    // Derived values from context
    const students = groupData?.students || [];
    const midterms = groupData?.midterms || [];

    const [activeMidtermId, setActiveMidtermId] = useState<string | null>(null);

    // Get evaluations and activities for active midterm from context
    const evaluations = groupData?.evaluationsByMidterm[activeMidtermId || '']?.evaluations || [];
    const activities = groupData?.evaluationsByMidterm[activeMidtermId || '']?.activities || {};
    const gradesMap = groupData?.gradesMap || {};

    const [gradingConfig] = useState<GradingConfig>({
        passingGrade: 6,
        maxGrade: 10,
        gradeScale: 'numeric'
    });

    // Trigger prefetch if data not loaded
    useEffect(() => {
        if (!subjectId || !groupId) return;

        // If data not loaded or different group, trigger prefetch
        if (!groupData?.isFullyLoaded || groupData.groupId !== groupId) {
            prefetchAllGroupData(subjectId, groupId);
        }
    }, [subjectId, groupId, groupData, prefetchAllGroupData]);

    // Set first midterm as active when midterms load
    useEffect(() => {
        if (midterms.length > 0 && !activeMidtermId) {
            setActiveMidtermId(midterms[0].id);
        }
    }, [midterms, activeMidtermId]);

    // Overlays State
    const [isEvalOverlayOpen, setIsEvalOverlayOpen] = useState(false);
    const [isActivityOverlayOpen, setIsActivityOverlayOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [targetEvalIdForActivity, setTargetEvalIdForActivity] = useState<string | null>(null);

    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isErrorOpen, setIsErrorOpen] = useState(false);

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setIsErrorOpen(true);
    };

    // Track which cell is currently being edited (null = none)
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    // Tooltip State
    const [tooltipData, setTooltipData] = useState<{
        type: 'evaluation' | 'activity';
        data: any;
        x: number;
        y: number
    } | null>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const navigationRef = useRef(false);

    const handleTooltipEnter = (e: React.MouseEvent, type: 'evaluation' | 'activity', data: any) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        // Position centered below
        const x = rect.left + rect.width / 2;
        const y = rect.bottom;

        hoverTimeoutRef.current = setTimeout(() => {
            setTooltipData({ type, data, x, y });
        }, 1000);
    };

    const handleTooltipLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setTooltipData(null);
    };

    // Evaluation Editing & Context Menu State
    const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
    const [evalMenu, setEvalMenu] = useState<{ x: number; y: number; evalId: string } | null>(null);

    // Activity Context Menu State
    const [activityMenu, setActivityMenu] = useState<{ x: number; y: number; activityId: string; evalId: string } | null>(null);

    // Ref for the table container to detect clicks outside
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const [loading] = useState(false);

    // Close context menus on click elsewhere
    useEffect(() => {
        const handleClick = () => {
            setEvalMenu(null);
            setActivityMenu(null);
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Old fetch useEffects removed - all data now comes from context via prefetchAllGroupData


    // Handlers
    const handleAddEvaluation = () => {
        setEditingEvalId(null);
        setIsEvalOverlayOpen(true);
    };

    const handleEvaluationContextMenu = (e: React.MouseEvent, evalId: string) => {
        e.preventDefault();
        setEvalMenu({ x: e.pageX, y: e.pageY, evalId });
    };

    const handleEditEvaluation = () => {
        if (evalMenu) {
            setEditingEvalId(evalMenu.evalId);
            setEvalMenu(null);
            setIsEvalOverlayOpen(true);
        }
    };

    const handleDeleteEvaluation = async () => {
        if (!evalMenu) return;
        if (!window.confirm(t('grades.confirmDeleteEvaluation'))) {
            setEvalMenu(null);
            return;
        }

        try {
            const { default: api } = await import('../../api/client');
            await api.delete(`/v1/evaluations/${evalMenu.evalId}/`);

            // Refetch evaluations to remove deleted one
            if (activeMidtermId) {
                await refetchEvaluations(activeMidtermId);
            }
        } catch (e) {
            console.error(e);
            showError(t('grades.failedToDeleteEvaluation'));
        }
        setEvalMenu(null);
    };

    const handleActivityContextMenu = (e: React.MouseEvent, evalId: string, activityId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setActivityMenu({ x: e.pageX, y: e.pageY, activityId, evalId });
    };

    const handleEditActivity = () => {
        if (!activityMenu) return;

        // Find the activity data
        const activity = activities[activityMenu.evalId]?.find(a => a.id === activityMenu.activityId);
        if (!activity) return;

        setSelectedActivity(activity);
        setTargetEvalIdForActivity(activityMenu.evalId);
        setIsActivityOverlayOpen(true);
        setActivityMenu(null);
    };

    const handleDeleteActivity = async () => {
        if (!activityMenu) return;
        if (!window.confirm(t('grades.confirmDeleteActivity'))) {
            setActivityMenu(null);
            return;
        }

        try {
            const { default: api } = await import('../../api/client');
            await api.delete(`/v1/activities/${activityMenu.activityId}/`);

            // Refetch evaluations to update activity list
            if (activeMidtermId) {
                await refetchEvaluations(activeMidtermId);
            }
        } catch (e) {
            console.error(e);
            showError(t('grades.failedToDeleteActivity'));
        }
        setActivityMenu(null);
    };

    const handleSaveEvaluation = async (data: { name: string; isFixed: boolean; weight: number }) => {
        if (!activeMidtermId) return;

        // Validation: Check total fixed weight
        let currentFixedWeight = 0;
        evaluations.forEach(ev => {
            if (editingEvalId && ev.id === editingEvalId) return;
            if (ev.isFixed) currentFixedWeight += ev.weightPercentage;
        });

        // 1. Check if sum of fixed weights > 100
        const newWeight = data.isFixed ? Number(data.weight) : 0;
        if (currentFixedWeight + newWeight > 100) {
            showError("Total fixed weight cannot exceed 100%.");
            return;
        }

        // 2. Check if adding new when already 100% total (and not replacing logic)
        // If currentTotal (fixed + auto) is 100%, and we add a new one... 
        // Logic: If automatic exists, it shrinks. If all fixed = 100%, we can't add another fixed > 0 or auto.
        // If currentFixedWeight == 100, we can't add anything with weight > 0 or even auto (0 weight?).
        if (currentFixedWeight >= 100 && newWeight > 0) {
            showError("Fixed weights already sum to 100%. Cannot add more weight.");
            return;
        }

        // If adding automatic, check if fixed is 100
        if (!data.isFixed && currentFixedWeight >= 100) {
            alert("Warning: Fixed weights sum to 100%. This evaluation will have 0% weight.");
        }


        try {
            const { default: api } = await import('../../api/client');

            if (editingEvalId) {
                await api.put(`/v1/evaluations/${editingEvalId}/`, {
                    midterm: activeMidtermId,
                    name: data.name,
                    is_fixed: data.isFixed,
                    weight_percentage: data.isFixed ? data.weight : 0
                });
            } else {
                await api.post('/v1/evaluations/', {
                    midterm: activeMidtermId,
                    name: data.name,
                    is_fixed: data.isFixed,
                    weight_percentage: data.weight
                });
            }

            setIsEvalOverlayOpen(false);
            setEditingEvalId(null);

            // Refetch evaluations to show new evaluation
            if (activeMidtermId) {
                await refetchEvaluations(activeMidtermId);
            }
        } catch (error) {
            console.error(error);
            showError("Failed to save evaluation.");
        }
    };

    const handleAddActivity = (evalId: string) => {
        setSelectedActivity(null); // Clear any previous selection
        setTargetEvalIdForActivity(evalId);
        setIsActivityOverlayOpen(true);
    };

    const handleSaveActivity = async (data: any) => {
        if (!targetEvalIdForActivity) return;

        // Weight Validation Logic
        const currentActs = activities[targetEvalIdForActivity] || [];
        let currentFixedWeight = 0;
        currentActs.forEach(a => {
            if (a.isFixed) currentFixedWeight += a.weightPercentage;
        });

        const newWeight = (data.isFixed || data.isExtra) ? Number(data.weight) : 0;

        // Skip check for extra points? "This activity won't be included in the calculation of the final grade" implies it's outside 100%.
        // "Suppose we have an extra activity worth 10%... Student grade 9/10 + 10% = 10."
        // So extra points do NOT count towards the 100% sum limit of the evaluation weights breakdown?
        // Prompt check: "sum... must be 100%... system will warn...".
        // Usually Extra Points are additive, so they don't consume the 100% pie.
        // I will assume Extra Points are EXCLUDED from the 100% sum check.

        if (!data.isExtra) {
            if (data.isFixed) {
                if (currentFixedWeight + newWeight > 100) {
                    showError(t('grades.totalFixedWeightExceeded'));
                    return;
                }
            } else {
                if (currentFixedWeight >= 100) {
                    alert(t('grades.warningFixedWeightFull'));
                }
            }
        }

        try {
            const { default: api } = await import('../../api/client');

            // Parse max_score from scale input (handles: "30", "0/30", "0-30", etc.)
            let maxScore = 10;
            if (data.scale) {
                const match = data.scale.match(/(\d+)$/); // Extract last number
                if (match) {
                    maxScore = Number(match[1]);
                }
            }

            const payload = {
                evaluation: targetEvalIdForActivity,
                name: data.name,
                description: data.description,
                is_fixed: data.isFixed || data.isExtra, // Force fixed if extra
                weight_percentage: data.weight,
                max_score: maxScore,
                is_extra_points: data.isExtra
            };

            // Check if editing or creating
            if (selectedActivity) {
                // Edit existing activity
                await api.put(`/v1/activities/${selectedActivity.id}/`, payload);
            } else {
                // Create new activity
                await api.post('/v1/activities/', payload);
            }

            setIsActivityOverlayOpen(false);
            setSelectedActivity(null); // Clear selection

            // Refetch evaluations to show changes
            if (activeMidtermId) {
                await refetchEvaluations(activeMidtermId);
            }
        } catch (error) {
            console.error(error);
            showError(t('grades.failedToSaveActivity'));
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
    const [, setPendingSelection] = useState<{ type: string; row: number; col: number; shiftKey: boolean } | null>(null);

    // Selectable Logic
    const isSelectable = useCallback((_row: number, col: number): boolean => {
        if (col < 0 || col >= columnStructure.length) return false;
        const colInfo = columnStructure[col];
        if (colInfo.type === 'plus') return false;
        if (selectionMode === null) return colInfo.type === 'activity' || colInfo.type === 'final';
        return colInfo.type === selectionMode;
    }, [columnStructure, selectionMode]);

    const { handleCellMouseDown, handleCellMouseEnter, handleMouseUp,
        clearSelection, isSelected
    } = useTableSelection({ totalRows: students.length, totalCols, isSelectable });

    // Handle grade change (save to API)
    const handleGradeChange = async (studentId: string, activityId: string, value: string, maxScore: number) => {
        // Handle Deletion (empty string)
        if (value === '') {
            const existingGrade = gradesMap[studentId]?.[activityId];
            if (existingGrade && existingGrade.id) {
                try {
                    const { default: api } = await import('../../api/client');
                    await api.delete(`/v1/grades/${existingGrade.id}/`);
                    // Delete grade using context helper
                    deleteGrade(studentId, activityId);
                } catch (e) {
                    console.error("Delete grade failed", e);
                }
            }
            return;
        }

        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= maxScore) {
            const existingGrade = gradesMap[studentId]?.[activityId];

            try {
                const { default: api } = await import('../../api/client');
                if (existingGrade && existingGrade.id) {
                    // Update grade using context helper
                    updateGrade(studentId, activityId, existingGrade.id, numValue);
                } else {
                    const res = await api.post('/v1/grades/', {
                        student: studentId,
                        activity: activityId,
                        score: numValue
                    });
                    // Update grade using context helper
                    updateGrade(studentId, activityId, res.data.id, numValue);
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


            evaluations.forEach(ev => {
                const evActivities = activities[ev.id] || [];
                if (evActivities.length === 0) return;

                // Separate fixed (including extra) and automatic activities
                const fixedActs = evActivities.filter(a => a.isFixed);
                const autoActs = evActivities.filter(a => !a.isFixed);

                let currentWeightUsed = 0;
                fixedActs.forEach(a => currentWeightUsed += a.weightPercentage);

                // Calculate weight for automatic activities
                // Remaining weight divided by count of automatic activities
                let autoWeight = 0;
                if (autoActs.length > 0) {
                    autoWeight = Math.max(0, (100 - currentWeightUsed) / autoActs.length);
                }



                // We need to sum (score * weight) for all activities
                // Normalizing score to 0-1 (percentage of maxScore) then multiply by weightPercentage (0-100)
                // Result is contribution to grade (0-100 scale within evaluation)

                let totalContribution = 0; // Sum of (grade/max * weight)

                // Helper to process activity
                const processActivity = (act: { id: string; maxScore: number; isExtra: boolean }, weight: number) => {
                    const gradeData = gradesMap[student.id]?.[act.id];
                    if (gradeData) {
                        const scoreRatio = gradeData.score / act.maxScore; // 0 to 1
                        // Contribution is Ratio * Weight. 
                        // E.g. 9/10 * 10% = 0.9 points out of 100 total evaluation points
                        totalContribution += scoreRatio * weight;
                    }
                    // If no grade, contribution is 0 (assumed 0 or missing)
                };

                // Process Fixed (Normal)
                fixedActs.filter(a => !a.isExtra).forEach(a => processActivity(a, a.weightPercentage));

                // Process Automatic
                autoActs.forEach(a => processActivity(a, autoWeight));

                // Calculate Base Grade (before Extra)
                // If total weights sum to 100, `totalContribution` is the grade on 0-100 scale.
                // We want result on `gradingConfig.maxGrade` scale (e.g. 10).
                // So (TotalContrib / 100) * MaxGrade

                let currentScore100 = totalContribution; // 0-100

                // Process Extra Points
                // "Only matter... if student doesn't have max grade"
                // Logic: Add extra points purely to the score? 
                // Ex: "Student has 9/10, extra is 10/10 worth 10%. Final is 10."
                // 9/10 is 90 points. Extra is 10% => 10 points. 90+10 = 100.

                fixedActs.filter(a => a.isExtra).forEach(a => {
                    const gradeData = gradesMap[student.id]?.[a.id];
                    if (gradeData) {
                        const scoreRatio = gradeData.score / a.maxScore;
                        const extraPoints = scoreRatio * a.weightPercentage;
                        currentScore100 += extraPoints;
                    }
                });

                // Cap at 100% (Implied by "Final grade will be 10" max)
                currentScore100 = Math.min(currentScore100, 100);

                // Convert to Grade Scale
                const finalEvalGrade = (currentScore100 / 100) * gradingConfig.maxGrade;

                // Add to Total Midterm
                totalWeightedScore += finalEvalGrade * (ev.weightPercentage / 100);
            });

            // Return accumulated points (0-10 scale)
            return Math.round(totalWeightedScore * 100) / 100;
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
                    <h1>{groupData?.subjectName || "Loading..."}</h1>
                </div>

                <div className="grades-group">{t('grades.group')} {groupData?.groupName || ""}</div>
            </header>

            <div className="grades-content">
                <div ref={tableContainerRef} className="unified-table-container">
                    {loading ? <div>{t('common.loading')}</div> : (
                        <table className="unified-table grades-selectable">
                            <thead>
                                <tr>
                                    <th rowSpan={2} className="student-col-unified">{t('grades.studentName')}</th>
                                    {evaluations.map(ev => (
                                        <th key={ev.id}
                                            colSpan={(activities[ev.id]?.length || 0) + 1}
                                            className="unified-header-main"
                                            onContextMenu={(e) => handleEvaluationContextMenu(e, ev.id)}
                                            onMouseEnter={(e) => handleTooltipEnter(e, 'evaluation', ev)}
                                            onMouseLeave={handleTooltipLeave}
                                            style={{ cursor: 'context-menu' }}
                                            title={t('grades.rightClickToEditDelete')}
                                        >
                                            {ev.name} ({ev.weightPercentage}%)
                                        </th>
                                    ))}
                                    <th rowSpan={2} className="unified-header-vertical">
                                        <div className="add-eval-header-btn" onClick={handleAddEvaluation}>{t('grades.addEvaluation')}</div>
                                    </th>
                                    <th rowSpan={2} className="unified-header-vertical final-header">
                                        <div className="vertical-text-wrapper">{t('grades.final')}</div>
                                    </th>
                                </tr>
                                <tr>
                                    {evaluations.map((ev) => (
                                        <React.Fragment key={ev.id}>
                                            {activities[ev.id]?.map((act) => (
                                                <th key={act.id} className="unified-header-vertical"
                                                    onContextMenu={(e) => handleActivityContextMenu(e, ev.id, act.id)}
                                                    onMouseEnter={(e) => handleTooltipEnter(e, 'activity', { ...act, parentEvalId: ev.id })}
                                                    onMouseLeave={handleTooltipLeave}
                                                    style={{ cursor: 'context-menu' }}
                                                    title={t('grades.rightClickToDelete')}
                                                >
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
                                            <td className="student-col-unified">{student.name}</td>
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
                                                                onClick={() => {
                                                                    setEditingCell(`${student.id}-${act.id}`);
                                                                    setEditingValue(String(score ?? ''));
                                                                }}
                                                            >
                                                                <div className="cell-input-wrapper">
                                                                    <input
                                                                        type="number"
                                                                        className="unified-input"
                                                                        min="0"
                                                                        max={act.maxScore || 10}
                                                                        step="0.01"
                                                                        ref={(input) => {
                                                                            if (input && editingCell === `${student.id}-${act.id}` && document.activeElement !== input) {
                                                                                input.focus();
                                                                            }
                                                                        }}
                                                                        value={editingCell === `${student.id}-${act.id}` ? editingValue : (score ?? '')}
                                                                        readOnly={editingCell !== `${student.id}-${act.id}`}
                                                                        onFocus={() => {
                                                                            navigationRef.current = false;
                                                                        }}
                                                                        onChange={(e) => {
                                                                            const newValue = e.target.value;
                                                                            setEditingValue(newValue);

                                                                            // Validate range
                                                                            const numVal = parseFloat(newValue);
                                                                            const maxAllowed = act.maxScore || 10;
                                                                            if (!isNaN(numVal) && numVal > maxAllowed) {
                                                                                showError(t('grades.maxValueError', { max: maxAllowed }));
                                                                            }
                                                                            if (!isNaN(numVal) && numVal < 0) {
                                                                                showError(t('grades.minValueError'));
                                                                            }
                                                                            // Note: Live update removed - gradesMap is now read-only from context
                                                                            // Actual save happens in handleGradeChange on blur/enter
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            if (navigationRef.current) return;
                                                                            handleGradeChange(student.id, act.id, e.target.value, act.maxScore);
                                                                            setEditingCell(null);
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                const val = (e.target as HTMLInputElement).value;
                                                                                handleGradeChange(student.id, act.id, val, act.maxScore);

                                                                                // Vertical Navigation: Find next empty cell
                                                                                let found = false;
                                                                                navigationRef.current = true;
                                                                                for (let i = sIdx + 1; i < students.length; i++) {
                                                                                    const nextS = students[i];
                                                                                    // Check if empty (no grade in map)
                                                                                    if (!gradesMap[nextS.id]?.[act.id]) {
                                                                                        setEditingCell(`${nextS.id}-${act.id}`);
                                                                                        setEditingValue('');
                                                                                        found = true;
                                                                                        break;
                                                                                    }
                                                                                }
                                                                                if (!found) {
                                                                                    (e.target as HTMLInputElement).blur();
                                                                                    setEditingCell(null);
                                                                                    if (clearSelection) clearSelection();
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="add-btn-cell" style={{ backgroundColor: '#e0e0e0' }}>{(() => { cIdx++; return null; })()}</td>
                                                </React.Fragment>
                                            ))}
                                            {/* Empty cell to align with + Evaluation header */}
                                            <td style={{ backgroundColor: '#f9f9f9', borderRight: '1px solid #ccc' }}></td>
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

            <div className="footer-container">
                <div className="midterm-tabs-footer">
                    {midterms.map(midterm => (
                        <div key={midterm.id} className={`midterm-tab-footer ${activeMidtermId === midterm.id ? 'active' : ''}`} onClick={() => setActiveMidtermId(midterm.id)}>
                            {midterm.name.replace(/Parcial/i, t('midterm.midterm'))}
                        </div>
                    ))}
                </div>
                <footer className="unified-footer">
                    <button className="footer-btn-unified" onClick={() => navigate(`/attendance/${subjectId}/${groupId}`)}>{t('dashboard.attendance')}</button>
                    <button className="footer-btn-unified active">{t('dashboard.grades')}</button>
                </footer>
            </div>

            <NewEvaluationOverlay
                isOpen={isEvalOverlayOpen}
                onClose={() => setIsEvalOverlayOpen(false)}
                onSave={handleSaveEvaluation}
                initialData={editingEvalId ? evaluations.find(e => e.id === editingEvalId)?.weightPercentage ? {
                    name: evaluations.find(e => e.id === editingEvalId)!.name,
                    isFixed: true, // Assuming if editing we enable fixed? Re-fetch needed for accuracy?
                    // Actually we don't have isFixed in frontend model for Evals yet... 
                    // Best effort: set weight
                    weight: evaluations.find(e => e.id === editingEvalId)!.weightPercentage
                } : undefined : undefined}
            // isEditing prop is just visual helpers if needed
            />

            {evalMenu && (
                <div
                    className="context-menu-unified"
                    style={{ top: evalMenu.y, left: evalMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-item-unified" onClick={() => {
                        handleEditEvaluation();
                        setEvalMenu(null);
                    }}>
                        {t('grades.editEvaluation')}
                    </div>
                    <div className="context-menu-item-unified danger" onClick={() => {
                        handleDeleteEvaluation();
                        setEvalMenu(null);
                    }}>
                        {t('grades.deleteEvaluation')}
                    </div>
                </div>
            )}

            {activityMenu && (
                <div
                    className="context-menu-unified"
                    style={{ top: activityMenu.y, left: activityMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-item-unified" onClick={() => {
                        handleEditActivity();
                    }}>
                        {t('grades.editActivity')}
                    </div>
                    <div className="context-menu-item-unified danger" onClick={handleDeleteActivity}>
                        {t('grades.deleteActivity')}
                    </div>
                </div>
            )}

            <NewActivityOverlay
                isOpen={isActivityOverlayOpen}
                onClose={() => {
                    setIsActivityOverlayOpen(false);
                    setSelectedActivity(null);
                }}
                onSave={handleSaveActivity}
                initialData={selectedActivity ? {
                    name: selectedActivity.name,
                    description: selectedActivity.description || '',
                    isFixed: selectedActivity.isFixed,
                    weight: selectedActivity.weightPercentage,
                    scale: selectedActivity.maxScore?.toString() || '10',
                    isExtra: selectedActivity.isExtra
                } : undefined}
            />

            <ErrorOverlay
                isOpen={isErrorOpen}
                onClose={() => setIsErrorOpen(false)}
                message={errorMessage}
            />

            {tooltipData && (
                <div style={{
                    position: 'fixed',
                    top: tooltipData.y + 8,
                    left: tooltipData.x,
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid #e0e0e0',
                    minWidth: '200px',
                    fontSize: '14px',
                    pointerEvents: 'none',
                    color: '#333'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '6px', fontSize: '15px' }}>
                        {tooltipData.data.name}
                    </div>
                    {tooltipData.type === 'evaluation' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#666' }}>
                            <div><strong>{t('grades.weight')}:</strong> {tooltipData.data.weightPercentage}% {tooltipData.data.isFixed ? `(${t('grades.fixed')})` : `(${t('grades.automatic')})`}</div>
                        </div>
                    )}
                    {tooltipData.type === 'activity' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#666' }}>
                            <div><strong>{t('grades.scale')}:</strong> 0-{tooltipData.data.maxScore || 10}</div>
                            <div>
                                <strong>{t('grades.weight')}:</strong> {(() => {
                                    if (tooltipData.data.isFixed) return tooltipData.data.weightPercentage;
                                    // Calculate effective weight
                                    if (!tooltipData.data.parentEvalId) return '0';
                                    const siblings = activities[tooltipData.data.parentEvalId] || [];
                                    const fixed = siblings.filter(a => a.isFixed);
                                    const auto = siblings.filter(a => !a.isFixed);
                                    const used = fixed.reduce((sum, a) => sum + (a.weightPercentage || 0), 0);
                                    const remaining = Math.max(0, 100 - used);
                                    if (auto.length === 0) return 0;
                                    return (remaining / auto.length).toFixed(2);
                                })()}% {tooltipData.data.isFixed ? `(${t('grades.fixed')})` : `(${t('grades.automatic')})`}
                            </div>
                            {tooltipData.data.isExtra && <div style={{ color: '#2e7d32', fontWeight: 600 }}>{t('grades.extraPoints')}</div>}
                            {tooltipData.data.description && <div style={{ marginTop: '6px', fontStyle: 'italic', background: '#f9f9f9', padding: '4px', borderRadius: '4px' }}>" {tooltipData.data.description}"</div>}
                        </div>
                    )}
                </div>
            )}


        </div>
    );
};

export default GradesPage;
