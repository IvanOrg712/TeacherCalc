import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SubjectGroupData {
    subjectId: string;
    subjectName: string;
    groupId: string;
    groupName: string;
    absencesAllowed: number | null;
}

interface SubjectGroupContextType {
    data: SubjectGroupData | null;
    setData: (data: SubjectGroupData) => void;
    fetchData: (subjectId: string, groupId: string) => Promise<void>;
    clearData: () => void;
}

const SubjectGroupContext = createContext<SubjectGroupContextType | undefined>(undefined);

export const SubjectGroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setDataState] = useState<SubjectGroupData | null>(null);

    const setData = useCallback((newData: SubjectGroupData) => {
        setDataState(newData);
    }, []);

    const fetchData = useCallback(async (subjectId: string, groupId: string) => {
        // Check if we already have this data
        if (data?.subjectId === subjectId && data?.groupId === groupId) {
            return; // Already have the data, no need to fetch
        }

        try {
            const { default: api } = await import('../api/client');

            // Fetch subject and group data in parallel
            const [subjectRes, groupRes] = await Promise.all([
                api.get(`/v1/subjects/${subjectId}/`),
                api.get(`/v1/groups/${groupId}/`)
            ]);

            setDataState({
                subjectId,
                subjectName: subjectRes.data.name,
                groupId,
                groupName: groupRes.data.name,
                absencesAllowed: subjectRes.data.absences_allowed
            });
        } catch (error) {
            console.error('Error fetching subject/group data:', error);
        }
    }, [data]);

    const clearData = useCallback(() => {
        setDataState(null);
    }, []);

    return (
        <SubjectGroupContext.Provider value={{ data, setData, fetchData, clearData }}>
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
