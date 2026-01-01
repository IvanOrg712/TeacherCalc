export interface AttendanceRecord {
    date: string; // ISO date string or just "DD/MM/YYYY" as per design
    present: boolean;
}

export interface Student {
    id: string;
    firstName: string;
    lastName: string; // "Ivan Vivas Garcia"
    // In a real app we might store attendance in a separate collection,
    // but for mock purposes, we can keep it here or in a separate map.
    // Let's store a simple map of date->status for now.
    attendance: Record<string, boolean>;
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

export interface School {
    id: string;
    name: string; // e.g. "Universidad Tecnológica"
    subjects: Subject[];
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
