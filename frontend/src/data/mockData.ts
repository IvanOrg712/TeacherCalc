import type { School, Student, Term, Midterm, Evaluation, Activity } from '../@types/models';

// --- Mock Students ---
export const MOCK_STUDENTS: Record<string, Student> = {};

// Helper to generate students
const generateStudents = (count: number, startIndex: number): string[] => {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
        const id = `student-${startIndex + i}`;
        MOCK_STUDENTS[id] = {
            id,
            firstName: "Student",
            lastName: `${startIndex + i} Name`, // Generic names for now
            attendance: {}
        };
        ids.push(id);
    }
    // Specific override for demo
    if (MOCK_STUDENTS['student-0']) {
        MOCK_STUDENTS['student-0'].firstName = "Ivan";
        MOCK_STUDENTS['student-0'].lastName = "Vivas Garcia";
    }
    return ids;
};

// Generate a pool of students
const allStudentIds = generateStudents(50, 0);

// --- Mock Terms (Parciales) ---
export const MOCK_TERMS: Term[] = [
    { id: 'p1', name: 'Parcial 1', dates: ['10/03/2025', '11/03/2025', '12/03/2025', '13/03/2025', '14/03/2025'] },
    { id: 'p2', name: 'Parcial 2', dates: ['15/05/2025', '16/05/2025', '17/05/2025'] },
    { id: 'p3', name: 'Parcial 3', dates: ['20/07/2025', '21/07/2025'] },
];

// --- Mock Schools ---
export const MOCK_SCHOOLS: School[] = [
    {
        id: '1',
        name: "Universidad Central",
        gradingConfig: {
            passingGrade: 6,
            maxGrade: 10,
            gradeScale: 'numeric'
        },
        subjects: [
            {
                id: 's1',
                name: "Matemáticas Discretas",
                groups: [
                    { id: 'g1', name: "710", studentIds: allStudentIds.slice(0, 10) },
                    { id: 'g2', name: "711", studentIds: allStudentIds.slice(10, 20) },
                    { id: 'g3', name: "712", studentIds: allStudentIds.slice(20, 30) }
                ]
            },
            {
                id: 's2',
                name: "Álgebra Lineal",
                groups: [
                    { id: 'g4', name: "820", studentIds: allStudentIds.slice(0, 15) },
                    { id: 'g5', name: "821", studentIds: allStudentIds.slice(15, 30) }
                ]
            }
        ]
    },
    {
        id: '2',
        name: "Instituto Politécnico",
        gradingConfig: {
            passingGrade: 7,
            maxGrade: 10,
            gradeScale: 'numeric'
        },
        subjects: [
            {
                id: 's3',
                name: "Física Mecánica",
                groups: [{ id: 'g6', name: "101", studentIds: allStudentIds.slice(30, 40) }]
            },
            {
                id: 's4',
                name: "Cálculo Diferencial",
                groups: [{ id: 'g8', name: "201", studentIds: allStudentIds.slice(40, 50) }]
            }
        ]
    }

];

// --- Mock Grades Data Hierarchical ---

export const MOCK_MIDTERMS: Midterm[] = [];
export const MOCK_EVALUATIONS: Evaluation[] = [];
export const MOCK_ACTIVITIES: Activity[] = [];
export const MOCK_GRADES: Record<string, number> = {}; // key: ${studentId}-${activityId}

// Helpers to seeding data
const seedGradesData = () => {
    // Generate data for all groups in all schools
    MOCK_SCHOOLS.forEach(school => {
        school.subjects.forEach(subject => {
            subject.groups.forEach(group => {
                // 1. Create 3 Midterms for each group
                ['Parcial 1', 'Parcial 2', 'Parcial 3'].forEach((mName, mIdx) => {
                    const midtermId = `${group.id}-m${mIdx + 1}`;
                    MOCK_MIDTERMS.push({
                        id: midtermId,
                        name: mName,
                        groupId: group.id
                    });

                    // 2. Create Evaluations for each Midterm
                    // Design implies: Trabajos (Assignments), Proyectos, Examen
                    const evaluationsSpec = [
                        { name: "Trabajos", weight: 40, activitiesCount: 5, prefix: "Practica", maxScore: 10 },
                        { name: "Proyecto", weight: 20, activitiesCount: 1, prefix: "Conclusión", maxScore: 20 },
                        { name: "Examen", weight: 40, activitiesCount: 1, prefix: "Listening", maxScore: 100 }
                    ];

                    evaluationsSpec.forEach((evalSpec, eIdx) => {
                        const evalId = `${midtermId}-e${eIdx + 1}`;
                        MOCK_EVALUATIONS.push({
                            id: evalId,
                            name: evalSpec.name,
                            midtermId: midtermId,
                            weightPercentage: evalSpec.weight
                        });

                        // 3. Create Activities for each Evaluation
                        for (let a = 1; a <= evalSpec.activitiesCount; a++) {
                            const actId = `${evalId}-a${a}`;
                            MOCK_ACTIVITIES.push({
                                id: actId,
                                name: evalSpec.activitiesCount > 1 ? `${evalSpec.prefix} #${a}` : evalSpec.prefix,
                                evaluationId: evalId,
                                maxScore: evalSpec.maxScore
                            });

                            // 4. Generate Grades for Students in Group
                            group.studentIds.forEach(studentId => {
                                const key = `${studentId}-${actId}`;
                                // Random score scaled to maxScore, mostly high (70-100% of max)
                                const percentage = 0.7 + Math.random() * 0.3; // 70-100%
                                const randomScore = Math.round(evalSpec.maxScore * percentage * 10) / 10;
                                MOCK_GRADES[key] = Math.min(randomScore, evalSpec.maxScore);
                            });
                        }
                    });
                });
            });
        });
    });
};

// Initialize the seed
seedGradesData();

// --- Utility Functions ---

export const getSchools = (): School[] => {
    return MOCK_SCHOOLS;
};

export const getSchool = (schoolId: string): School | undefined => {
    return MOCK_SCHOOLS.find(s => s.id === schoolId);
};

export const getSubject = (subjectId: string): { subject: any, school: School } | undefined => {
    for (const school of MOCK_SCHOOLS) {
        const subject = school.subjects.find(s => s.id === subjectId);
        if (subject) return { subject, school };
    }
    return undefined;
};

export const getGroup = (groupId: string): { group: any, subject: any, school: School } | undefined => {
    for (const school of MOCK_SCHOOLS) {
        for (const subject of school.subjects) {
            const group = subject.groups.find(g => g.id === groupId);
            if (group) return { group, subject, school };
        }
    }
    return undefined;
};

export const getStudentsForGroup = (groupId: string): Student[] => {
    const groupData = getGroup(groupId);
    if (!groupData) return [];
    return groupData.group.studentIds.map((id: string) => MOCK_STUDENTS[id]).filter(Boolean);

};

export const getMidtermsForGroup = (groupId: string): Midterm[] => {
    return MOCK_MIDTERMS.filter(m => m.groupId === groupId);
};

export const getEvaluationsForMidterm = (midtermId: string): Evaluation[] => {
    return MOCK_EVALUATIONS.filter(e => e.midtermId === midtermId);
};

export const getActivitiesForEvaluation = (evaluationId: string): Activity[] => {
    return MOCK_ACTIVITIES.filter(a => a.evaluationId === evaluationId);
};

export const getStudentGrade = (studentId: string, activityId: string): number | undefined => {
    return MOCK_GRADES[`${studentId}-${activityId}`];
};

export const updateStudentGrade = (studentId: string, activityId: string, score: number) => {
    MOCK_GRADES[`${studentId}-${activityId}`] = score;
};
