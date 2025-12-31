export interface Group {
    id: string;
    name: string; // e.g. "710", "711"
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
