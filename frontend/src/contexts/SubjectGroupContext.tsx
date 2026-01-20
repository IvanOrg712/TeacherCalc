import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

// Type definitions
interface Student {
    id: string;
    name: string;
    attendance?: Record<string, any>;
}

interface Midterm {
    id: string;
    name: string;
    groupId: string;
}

interface Evaluation {
    id: string;
    name: string;
    midtermId: string;
    weightPercentage: number;
    isFixed: boolean;
}

interface Activity {
    id: string;
    name: string;
    evaluationId: string;
    maxScore: number;
    weightPercentage: number;
    isFixed: boolean;
    isExtra: boolean;
}

interface GroupData {
    // Basic Info
    subjectId: string;
    subjectName: string;
    groupId: string;
    groupName: string;
    absencesAllowed: number | null;

    // Students
    students: Student[];

    // Midterms
    midterms: Midterm[];

    // Evaluations & Activities (keyed by midterm ID)
    evaluationsByMidterm: Record<string, {
        evaluations: Evaluation[];
        activities: Record<string, Activity[]>; // evalId -> activities
    }>;

    // Grades (studentId -> activityId -> grade)
    gradesMap: Record<string, Record<string, { id: number; score: number }>>;

    // Attendance (studentId -> midtermId -> date -> status)
    attendanceData: Record<string, Record<string, Record<string, number>>>;

    // Attendance dates per midterm
    attendanceDatesByMidterm: Record<string, string[]>;

    // Loading state
    isLoading: boolean;
    isFullyLoaded: boolean;
    error: string | null;
}

interface SubjectGroupContextType {
    data: GroupData | null;
    prefetchAllGroupData: (subjectId: string, groupId: string, force?: boolean) => Promise<void>;
    updateGrade: (studentId: string, activityId: string, gradeId: number, score: number) => void;
    deleteGrade: (studentId: string, activityId: string) => void;
    updateAttendance: (studentId: string, midtermId: string, date: string, status: number) => void;
    refetchAttendance: (groupId: string) => Promise<void>;
    refetchStudents: (groupId: string) => Promise<void>;
    refetchEvaluations: (midtermId: string) => Promise<void>;
    clearData: () => void;
}

const SubjectGroupContext = createContext<SubjectGroupContextType | undefined>(undefined);

export const SubjectGroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setDataState] = useState<GroupData | null>(null);
    // Use a ref to track current groupId without causing re-renders
    const currentGroupIdRef = useRef<string | null>(null);
    const isLoadingRef = useRef(false);

    const prefetchAllGroupData = useCallback(async (subjectId: string, groupId: string, force?: boolean) => {
        // Check if already loaded using ref (avoids dependency on data)
        if (!force && currentGroupIdRef.current === groupId && !isLoadingRef.current) {
            return; // Already have all data for this group
        }

        // Prevent duplicate requests
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        setDataState(prev => prev ? { ...prev, isLoading: true, error: null } : null);

        try {
            const { default: api } = await import('../api/client');

            // Fetch all data in parallel for maximum speed
            const [
                subjectRes,
                groupRes,
                studentsRes,
                midtermsRes,
                gradesRes,
                attendanceRes
            ] = await Promise.all([
                api.get(`/v1/subjects/${subjectId}/`),
                api.get(`/v1/groups/${groupId}/`),
                api.get(`/v1/students/?group=${groupId}`),
                api.get(`/v1/midterms/?group=${groupId}`),
                api.get(`/v1/grades/?group=${groupId}`),
                api.get(`/v1/attendance/?group=${groupId}`)
            ]);

            // Process students
            const students: Student[] = studentsRes.data.map((s: any) => ({
                id: String(s.id),
                name: s.name,
                attendance: {}
            })).sort((a: Student, b: Student) => a.name.localeCompare(b.name));

            // Process midterms
            const midterms: Midterm[] = midtermsRes.data.map((m: any) => ({
                id: String(m.id),
                name: m.name,
                groupId: String(m.group)
            }));

            // Fetch evaluations for all midterms in parallel
            const evaluationsPromises = midterms.map((m: Midterm) =>
                api.get(`/v1/evaluations/?midterm=${m.id}`)
            );
            const evaluationsResults = await Promise.all(evaluationsPromises);

            // Process evaluations and activities
            const evaluationsByMidterm: Record<string, { evaluations: Evaluation[]; activities: Record<string, Activity[]> }> = {};
            midterms.forEach((m: Midterm, idx: number) => {
                const evalsData = evaluationsResults[idx].data;
                const evaluations: Evaluation[] = evalsData.map((e: any) => ({
                    id: String(e.id),
                    name: e.name,
                    midtermId: String(e.midterm),
                    weightPercentage: Number(e.weight_percentage),
                    isFixed: Boolean(e.is_fixed)
                }));

                const activities: Record<string, Activity[]> = {};
                evalsData.forEach((e: any) => {
                    activities[String(e.id)] = (e.activities || []).map((a: any) => ({
                        id: String(a.id),
                        name: a.name,
                        evaluationId: String(e.id),
                        maxScore: Number(a.max_score || 10),
                        weightPercentage: Number(a.weight_percentage),
                        isFixed: Boolean(a.is_fixed),
                        isExtra: Boolean(a.is_extra_points)
                    }));
                });

                evaluationsByMidterm[m.id] = { evaluations, activities };
            });

            // Process grades
            const gradesMap: Record<string, Record<string, { id: number; score: number }>> = {};
            gradesRes.data.forEach((g: any) => {
                const sId = String(g.student);
                const aId = String(g.activity);
                if (!gradesMap[sId]) gradesMap[sId] = {};
                gradesMap[sId][aId] = { id: g.id, score: Number(g.score) };
            });

            // Process attendance
            const attendanceData: Record<string, Record<string, Record<string, number>>> = {};
            const attendanceDatesByMidterm: Record<string, Set<string>> = {};

            attendanceRes.data.forEach((att: any) => {
                const sId = String(att.student);
                const mId = String(att.midterm);
                const timestamp = att.date;
                const status = att.status;

                if (!attendanceData[sId]) attendanceData[sId] = {};
                if (!attendanceData[sId][mId]) attendanceData[sId][mId] = {};
                attendanceData[sId][mId][timestamp] = status;

                if (!attendanceDatesByMidterm[mId]) attendanceDatesByMidterm[mId] = new Set();
                attendanceDatesByMidterm[mId].add(timestamp);
            });

            // Convert sets to sorted arrays
            const attendanceDatesArrays: Record<string, string[]> = {};
            Object.entries(attendanceDatesByMidterm).forEach(([mId, dates]) => {
                attendanceDatesArrays[mId] = Array.from(dates).sort();
            });

            // Update ref to track current group
            currentGroupIdRef.current = groupId;

            // Store everything in context
            setDataState({
                subjectId,
                subjectName: subjectRes.data.name,
                groupId,
                groupName: groupRes.data.name,
                absencesAllowed: subjectRes.data.absences_allowed,
                students,
                midterms,
                evaluationsByMidterm,
                gradesMap,
                attendanceData,
                attendanceDatesByMidterm: attendanceDatesArrays,
                isLoading: false,
                isFullyLoaded: true,
                error: null
            });

        } catch (error) {
            console.error('Error prefetching group data:', error);
            setDataState(prev => prev ? {
                ...prev,
                isLoading: false,
                error: 'Failed to load group data'
            } : null);
        } finally {
            isLoadingRef.current = false;
        }
    }, []); // Empty deps - function is stable, uses refs for checks

    // Optimistic update for grade changes
    const updateGrade = useCallback((studentId: string, activityId: string, gradeId: number, score: number) => {
        setDataState(prev => {
            if (!prev) return prev;

            const newGradesMap = { ...prev.gradesMap };
            if (!newGradesMap[studentId]) newGradesMap[studentId] = {};
            newGradesMap[studentId] = {
                ...newGradesMap[studentId],
                [activityId]: { id: gradeId, score }
            };

            return { ...prev, gradesMap: newGradesMap };
        });
    }, []);

    // Optimistic update for grade deletion
    const deleteGrade = useCallback((studentId: string, activityId: string) => {
        setDataState(prev => {
            if (!prev) return prev;

            const newGradesMap = { ...prev.gradesMap };
            if (newGradesMap[studentId]) {
                const newStudentGrades = { ...newGradesMap[studentId] };
                delete newStudentGrades[activityId];
                newGradesMap[studentId] = newStudentGrades;
            }

            return { ...prev, gradesMap: newGradesMap };
        });
    }, []);

    // Optimistic update for attendance changes
    const updateAttendance = useCallback((studentId: string, midtermId: string, date: string, status: number) => {
        setDataState(prev => {
            if (!prev) return prev;

            const newAttendanceData = { ...prev.attendanceData };
            if (!newAttendanceData[studentId]) newAttendanceData[studentId] = {};
            if (!newAttendanceData[studentId][midtermId]) newAttendanceData[studentId][midtermId] = {};
            newAttendanceData[studentId] = {
                ...newAttendanceData[studentId],
                [midtermId]: {
                    ...newAttendanceData[studentId][midtermId],
                    [date]: status
                }
            };

            // Also update attendanceDatesByMidterm if this date doesn't exist
            let newAttendanceDates = prev.attendanceDatesByMidterm;
            const currentDates = newAttendanceDates[midtermId] || [];
            if (!currentDates.includes(date)) {
                newAttendanceDates = {
                    ...newAttendanceDates,
                    [midtermId]: [...currentDates, date].sort()
                };
            }

            return {
                ...prev,
                attendanceData: newAttendanceData,
                attendanceDatesByMidterm: newAttendanceDates
            };
        });
    }, []);

    // Refetch attendance (for operations like add/delete attendance column)
    const refetchAttendance = useCallback(async (groupId: string) => {
        // Use ref to check if we have data for this group
        if (currentGroupIdRef.current !== groupId) return;

        try {
            const { default: api } = await import('../api/client');
            const attendanceRes = await api.get(`/v1/attendance/?group=${groupId}`);

            const attendanceData: Record<string, Record<string, Record<string, number>>> = {};
            const attendanceDatesByMidterm: Record<string, Set<string>> = {};

            attendanceRes.data.forEach((att: any) => {
                const sId = String(att.student);
                const mId = String(att.midterm);
                const timestamp = att.date;
                const status = att.status;

                if (!attendanceData[sId]) attendanceData[sId] = {};
                if (!attendanceData[sId][mId]) attendanceData[sId][mId] = {};
                attendanceData[sId][mId][timestamp] = status;

                if (!attendanceDatesByMidterm[mId]) attendanceDatesByMidterm[mId] = new Set();
                attendanceDatesByMidterm[mId].add(timestamp);
            });

            // Convert sets to sorted arrays
            const attendanceDatesArrays: Record<string, string[]> = {};
            Object.entries(attendanceDatesByMidterm).forEach(([mId, dates]) => {
                attendanceDatesArrays[mId] = Array.from(dates).sort();
            });

            setDataState(prev => prev ? {
                ...prev,
                attendanceData,
                attendanceDatesByMidterm: attendanceDatesArrays
            } : prev);
        } catch (error) {
            console.error('Error refetching attendance:', error);
        }
    }, []); // Uses ref, no deps needed

    // Refetch students (for complex operations like add/delete student)
    const refetchStudents = useCallback(async (groupId: string) => {
        // Use ref to check if we have data for this group
        if (currentGroupIdRef.current !== groupId) return;

        try {
            const { default: api } = await import('../api/client');
            const studentsRes = await api.get(`/v1/students/?group=${groupId}`);

            const students: Student[] = studentsRes.data.map((s: any) => ({
                id: String(s.id),
                name: s.name,
                attendance: {}
            })).sort((a: Student, b: Student) => a.name.localeCompare(b.name));

            setDataState(prev => prev ? { ...prev, students } : prev);
        } catch (error) {
            console.error('Error refetching students:', error);
        }
    }, []); // Uses ref, no deps needed

    // Refetch evaluations (for complex operations like add/delete evaluation)
    const refetchEvaluations = useCallback(async (midtermId: string) => {
        // Only proceed if we have data loaded
        if (!currentGroupIdRef.current) return;

        try {
            const { default: api } = await import('../api/client');
            const evalsRes = await api.get(`/v1/evaluations/?midterm=${midtermId}`);
            const evalsData = evalsRes.data;

            const evaluations: Evaluation[] = evalsData.map((e: any) => ({
                id: String(e.id),
                name: e.name,
                midtermId: String(e.midterm),
                weightPercentage: Number(e.weight_percentage),
                isFixed: Boolean(e.is_fixed)
            }));

            const activities: Record<string, Activity[]> = {};
            evalsData.forEach((e: any) => {
                activities[String(e.id)] = (e.activities || []).map((a: any) => ({
                    id: String(a.id),
                    name: a.name,
                    evaluationId: String(e.id),
                    maxScore: Number(a.max_score || 10),
                    weightPercentage: Number(a.weight_percentage),
                    isFixed: Boolean(a.is_fixed),
                    isExtra: Boolean(a.is_extra_points)
                }));
            });

            setDataState(prev => {
                if (!prev) return prev;
                const newEvalsByMidterm = { ...prev.evaluationsByMidterm };
                newEvalsByMidterm[midtermId] = { evaluations, activities };
                return { ...prev, evaluationsByMidterm: newEvalsByMidterm };
            });
        } catch (error) {
            console.error('Error refetching evaluations:', error);
        }
    }, []); // Uses ref, no deps needed

    const clearData = useCallback(() => {
        setDataState(null);
    }, []);

    return (
        <SubjectGroupContext.Provider value={{
            data,
            prefetchAllGroupData,
            updateGrade,
            deleteGrade,
            updateAttendance,
            refetchAttendance,
            refetchStudents,
            refetchEvaluations,
            clearData
        }}>
            {children}
        </SubjectGroupContext.Provider>
    );
};

export const useSubjectGroup = () => {
    const context = useContext(SubjectGroupContext);
    if (context === undefined) {
        throw new Error('useSubjectGroup must be used within a SubjectGroupProvider');
    }
    return context;
};
