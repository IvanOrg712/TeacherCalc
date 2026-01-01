import type { School, Student, Term } from '../types/models';

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
        subjects: [
            {
                id: 's1',
                name: "Matemáticas Discretas",
                groups: [
                    { id: 'g1', name: "710", studentIds: allStudentIds.slice(0, 10) },
                    { id: 'g2', name: "711", studentIds: allStudentIds.slice(10, 20) }, // Ivan is here if sliced correctly? No, 0-10 has Ivan.
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
