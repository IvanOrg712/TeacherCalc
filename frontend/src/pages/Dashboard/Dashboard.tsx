import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import SchoolSection from '../../components/features/SchoolSection/SchoolSection';
import SchoolConfigOverlay from '../../components/overlays/SchoolConfigOverlay/SchoolConfigOverlay';
import SubjectConfigOverlay from '../../components/overlays/SubjectConfigOverlay/SubjectConfigOverlay';
import ErrorOverlay from '../../components/overlays/ErrorOverlay/ErrorOverlay';
import ContextMenu from '../../components/common/ContextMenu/ContextMenu';
import { useSubjectGroup } from '../../contexts/SubjectGroupContext';
import './Dashboard.css';

// Types for Dashboard data
interface DashboardGroup {
    id: string;
    name: string;
}

interface DashboardSubject {
    id: string;
    name: string;
    groups?: DashboardGroup[];  // Optional because API may not always return groups
    absencesAllowed?: number;   // Used by SubjectConfigOverlay
}

interface DashboardSchool {
    id: string;
    name: string;
    passingGrade: number;
    midtermCount: number;
    subjects: DashboardSubject[];
    gradingConfig: {
        passingGrade: number;
        maxGrade: number;
        gradeScale: 'numeric' | 'percentage';
    };
}

interface ApiSchoolResponse {
    id: string;
    name: string;
    passing_grade: string | number;
    midterm_count: number;
    subjects?: Array<{
        id: string;
        name: string;
        groups?: Array<{ id: string; name: string }>;
    }>;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { prefetchAllGroupData } = useSubjectGroup();

    const [schools, setSchools] = useState<DashboardSchool[]>([]);
    const [isSchoolOverlayOpen, setIsSchoolOverlayOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<DashboardSchool | null>(null);

    // Subject Overlay State
    const [isSubjectOverlayOpen, setIsSubjectOverlayOpen] = useState(false);
    const [selectedSchoolIdForSubject, setSelectedSchoolIdForSubject] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<DashboardSubject | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isErrorOpen, setIsErrorOpen] = useState(false);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; subject: DashboardSubject; schoolId: string } | null>(null);

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setIsErrorOpen(true);
    };

    const fetchSchools = useCallback(async () => {
        try {
            const { default: api } = await import('../../api/client');
            const response = await api.get('/v1/schools/');
            // Map API data to Frontend Model
            const mappedSchools: DashboardSchool[] = response.data.map((s: ApiSchoolResponse) => ({
                id: s.id,
                name: s.name,
                passingGrade: Number(s.passing_grade),
                midtermCount: s.midterm_count,
                subjects: s.subjects || [],
                gradingConfig: {
                    passingGrade: Number(s.passing_grade),
                    maxGrade: 10,
                    gradeScale: 'numeric' as const
                }
            }));
            setSchools(mappedSchools);
        } catch (error) {
            console.error("Error fetching schools:", error);
            showError(t('dashboard.errorFetchingSchools'));
        }
    }, [t]);

    useEffect(() => {
        fetchSchools();
    }, [fetchSchools]);

    const handleAddSchool = () => {
        setSelectedSchool(null);
        setIsSchoolOverlayOpen(true);
    };

    const handleEditSchool = (school: DashboardSchool) => {
        setSelectedSchool(school);
        setIsSchoolOverlayOpen(true);
    };

    const handleSaveSchool = async (data: { name: string; passingGrade: number; midtermCount: number }) => {
        try {
            const { default: api } = await import('../../api/client');
            const payload = {
                name: data.name,
                passing_grade: data.passingGrade,
                midterm_count: data.midtermCount
            };

            if (selectedSchool) {
                // Update existing school
                await api.put(`/v1/schools/${selectedSchool.id}/`, payload);

                // Update school in place to maintain order
                setSchools(prevSchools =>
                    prevSchools.map(school =>
                        school.id === selectedSchool.id
                            ? {
                                ...school,
                                name: data.name,
                                passingGrade: data.passingGrade,
                                midtermCount: data.midtermCount,
                                gradingConfig: {
                                    passingGrade: data.passingGrade,
                                    maxGrade: 10,
                                    gradeScale: 'numeric' as const
                                }
                            }
                            : school
                    )
                );
            } else {
                // Create new school
                const response = await api.post('/v1/schools/', payload);
                const newSchool = {
                    id: response.data.id,
                    name: data.name,
                    passingGrade: data.passingGrade,
                    midtermCount: data.midtermCount,
                    subjects: [],
                    gradingConfig: {
                        passingGrade: data.passingGrade,
                        maxGrade: 10,
                        gradeScale: 'numeric' as const
                    }
                };
                setSchools(prevSchools => [...prevSchools, newSchool]);
            }

            setIsSchoolOverlayOpen(false);
        } catch (error) {
            console.error("Error saving school:", error);
            showError(t('dashboard.errorSavingSchool'));
        }
    };

    const handleAddSubject = (schoolId: string) => {
        setSelectedSchoolIdForSubject(schoolId);
        setSelectedSubject(null); // Clear any previous selection
        setIsSubjectOverlayOpen(true);
    };

    const handleEditSubject = (subject: DashboardSubject, schoolId: string) => {
        setSelectedSchoolIdForSubject(schoolId);
        setSelectedSubject(subject);
        setIsSubjectOverlayOpen(true);
        setContextMenu(null); // Close context menu
    };

    const handleSubjectContextMenu = (event: React.MouseEvent, subject: DashboardSubject, schoolId: string) => {
        event.preventDefault();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            subject,
            schoolId
        });
    };

    const handleSaveSubject = async (data: { name: string; absencesAllowed: number; groupCount: number; groupNames: string }) => {
        if (!selectedSchoolIdForSubject) return;

        try {
            const { default: api } = await import('../../api/client');
            // Create array of group objects
            const groupNameList = data.groupNames.split(',').map(n => n.trim()).filter(n => n.length > 0);
            const groups = groupNameList.map(name => ({ name }));

            const payload = {
                name: data.name,
                school: selectedSchoolIdForSubject,
                absences_allowed: data.absencesAllowed,
                groups: groups
            };

            if (selectedSubject) {
                // Update existing subject
                const response = await api.put(`/v1/subjects/${selectedSubject.id}/`, payload);

                // Update subject in place to maintain order
                setSchools(prevSchools =>
                    prevSchools.map(school =>
                        school.id === selectedSchoolIdForSubject
                            ? {
                                ...school,
                                subjects: school.subjects.map(subject =>
                                    subject.id === selectedSubject.id
                                        ? {
                                            ...subject,
                                            name: data.name,
                                            groups: response.data.groups || groups
                                        }
                                        : subject
                                ) as DashboardSubject[]
                            }
                            : school
                    )
                );
            } else {
                // Create new subject
                const response = await api.post('/v1/subjects/', payload);
                const newSubject = {
                    id: response.data.id,
                    name: data.name,
                    groups: response.data.groups || groups
                };

                // Add new subject to the school
                setSchools(prevSchools =>
                    prevSchools.map(school =>
                        school.id === selectedSchoolIdForSubject
                            ? {
                                ...school,
                                subjects: [...school.subjects, newSubject]
                            }
                            : school
                    )
                );
            }

            setIsSubjectOverlayOpen(false);
            setSelectedSubject(null);
        } catch (error) {
            console.error("Error saving subject:", error);
            showError(t('dashboard.errorSavingSubject'));
        }
    };

    const handleDeleteSubject = async () => {
        if (!contextMenu) return;
        if (!window.confirm(t('dashboard.confirmDeleteSubject'))) {
            return;
        }

        const subjectIdToDelete = contextMenu.subject.id;

        try {
            const { default: api } = await import('../../api/client');
            await api.delete(`/v1/subjects/${subjectIdToDelete}/`);
            setIsSubjectOverlayOpen(false);
            setSelectedSubject(null);
            fetchSchools(); // Refresh list
            setContextMenu(null); // Close context menu after deletion
        } catch (error) {
            console.error("Error deleting subject:", error);
            showError("Failed to delete subject.");
        }
    };

    const handleGroupClick = (subjectId: string, groupId: string) => {
        // Start prefetching all group data immediately
        prefetchAllGroupData(subjectId, groupId);

        // Navigate to attendance page
        navigate(`/attendance/${subjectId}/${groupId}`);
    };

    return (
        <DashboardLayout>
            <div className="dashboard-container">
                {schools.map((school) => (
                    <SchoolSection
                        key={school.id}
                        schoolName={school.name}
                        subjects={school.subjects as unknown as import('../../@types/models').Subject[]} // Type coercion for component prop
                        onAddClass={() => handleAddSubject(school.id)}
                        onGroupClick={handleGroupClick}
                        onEditSchool={() => handleEditSchool(school)}
                        onSubjectContextMenu={(e, subject) => handleSubjectContextMenu(e, subject, school.id)}
                    />
                ))}

                <button className="add-school-btn" onClick={handleAddSchool}>
                    {t('dashboard.addSchool')}
                </button>

                <SchoolConfigOverlay
                    isOpen={isSchoolOverlayOpen}
                    onClose={() => setIsSchoolOverlayOpen(false)}
                    onSave={handleSaveSchool}
                    initialData={selectedSchool}
                />

                <SubjectConfigOverlay
                    isOpen={isSubjectOverlayOpen}
                    onClose={() => {
                        setIsSubjectOverlayOpen(false);
                        setSelectedSubject(null);
                    }}
                    onSave={handleSaveSubject}
                    initialData={selectedSubject as { id?: string; name: string; absencesAllowed: number; groups?: { id: string; name: string }[] } | undefined}
                />

                <ErrorOverlay
                    isOpen={isErrorOpen}
                    onClose={() => setIsErrorOpen(false)}
                    message={errorMessage}
                />

                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        options={[
                            {
                                label: t('dashboard.editSubject'),
                                onClick: () => {
                                    handleEditSubject(contextMenu.subject, contextMenu.schoolId);
                                    setContextMenu(null);
                                }
                            },
                            {
                                label: t('dashboard.deleteSubject'),
                                onClick: handleDeleteSubject,
                                danger: true
                            }
                        ]}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
