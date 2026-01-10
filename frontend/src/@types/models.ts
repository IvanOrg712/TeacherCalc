export interface AttendanceRecord {
    date: string; // ISO date string or just "DD/MM/YYYY" as per design
    present: boolean;
}

export interface Student {
    id: string;
    firstName: string;
    lastName: string; // "Ivan Vivas Garcia"
    // In a real app we might store attendance in a separate collection.
    // attendance: Record<string, boolean>; // Deprecated
    attendance?: Record<string, boolean>;
}

export interface Group {
    id: string;
    name: string; // e.g. "710", "711"
    studentIds: string[]; // List of students in this group
}

export interface Subject {
    id: string;
    name: string; // e.g. "Matemáticas #1"
    groups: Group[];
}

export interface GradingConfig {
    passingGrade: number; // Minimum grade to pass (e.g., 6, 7, or 60 for percentage-based)
    maxGrade: number; // Maximum possible grade (e.g., 10 or 100)
    gradeScale: 'numeric' | 'percentage'; // Type of grading scale
}

export interface School {
    id: string;
    name: string; // e.g. "Universidad Tecnológica"
    subjects: Subject[];
    gradingConfig?: GradingConfig; // School-specific grading configuration
    // API fields
    passingGrade?: number;
    midtermCount?: number;
}

export interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    schoolIds: string[]; // List of schools this teacher belongs to
}

export interface Term {
    id: string;
    name: string;
    dates: string[];
}

// Grades Hierarchy
export interface Midterm {
    id: string;
    name: string; // "Parcial 1"
    groupId: string;
}

export interface Evaluation {
    id: string;
    name: string; // "Trabajos", "Examen"
    midtermId: string;
    weightPercentage: number; // 0-100
    isFixed: boolean;
}

export interface Activity {
    id: string;
    name: string; // "Tarea 1"
    evaluationId: string;
    maxScore: number;
    weightPercentage: number;
    isFixed: boolean;
    isExtra: boolean;
}

export interface Grade {
    studentId: string;
    activityId: string;
    score: number;
}
