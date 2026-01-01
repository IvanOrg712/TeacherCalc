import React, { useState, useEffect } from 'react';
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
import type { Student, Midterm, Evaluation, Activity } from '../../types/models';
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

    const handleGradeChange = (studentId: string, activityId: string, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
            updateStudentGrade(studentId, activityId, numValue);
            // Force re-render to show updated color (in a real app, strict state mgmt would handle this)
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
                    <table className="unified-table">
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
                                {evaluations.map(ev => (
                                    <React.Fragment key={`${ev.id}-activities`}>
                                        {activities[ev.id]?.map(act => (
                                            <th key={act.id} className="unified-header-vertical">
                                                <div className="vertical-text-wrapper">
                                                    {act.name}
                                                </div>
                                            </th>
                                        ))}
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
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td className="student-col-unified">{student.lastName}, {student.firstName}</td>
                                    {evaluations.map(ev => (
                                        <React.Fragment key={`${student.id}-${ev.id}`}>
                                            {activities[ev.id]?.map(act => {
                                                const score = getStudentGrade(student.id, act.id);
                                                return (
                                                    <td key={act.id} className="unified-cell-hover">
                                                        <div className="cell-input-wrapper">
                                                            <input
                                                                id={`grade-${student.id}-${act.id}`}
                                                                type="number"
                                                                className={`unified-input ${getGradeColorClass(score)}`}
                                                                defaultValue={score}
                                                                min="0" max="10" step="0.1"
                                                                onBlur={(e) => handleGradeChange(student.id, act.id, e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td style={{ backgroundColor: '#fafafa' }}></td>
                                        </React.Fragment>
                                    ))}
                                    <td className="total-cell-unified">
                                        {/* Total calculation placeholder */}
                                        -
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="unified-footer">
                <button className="footer-btn-unified" onClick={() => navigate(`/attendance/${subjectId}/${groupId}`)}>Asistencia</button>
                <button className="footer-btn-unified active">Calificaciones</button>
            </footer>
        </div>
    );
};

export default GradesPage;
