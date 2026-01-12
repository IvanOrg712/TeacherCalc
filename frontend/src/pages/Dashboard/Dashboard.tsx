import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import SchoolSection from '../../components/features/SchoolSection/SchoolSection';
import SchoolConfigOverlay from '../../components/overlays/SchoolConfigOverlay/SchoolConfigOverlay';
import SubjectConfigOverlay from '../../components/overlays/SubjectConfigOverlay/SubjectConfigOverlay';
import ErrorOverlay from '../../components/overlays/ErrorOverlay/ErrorOverlay';
import ContextMenu from '../../components/common/ContextMenu/ContextMenu';
import { useSubjectGroup } from '../../contexts/SubjectGroupContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { prefetchAllGroupData } = useSubjectGroup();

    const [schools, setSchools] = useState<any[]>([]); // Start empty, fetch from API
    const [isSchoolOverlayOpen, setIsSchoolOverlayOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);

    // Subject Overlay State
    const [isSubjectOverlayOpen, setIsSubjectOverlayOpen] = useState(false);
    const [selectedSchoolIdForSubject, setSelectedSchoolIdForSubject] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isErrorOpen, setIsErrorOpen] = useState(false);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; subject: any; schoolId: string } | null>(null);

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setIsErrorOpen(true);
    };

    const fetchSchools = async () => {
        try {
            const { default: api } = await import('../../api/client');
            const response = await api.get('/v1/schools/');
            // Map API data to Frontend Model
            const mappedSchools = response.data.map((s: any) => ({
                id: s.id,
                name: s.name,
                passingGrade: Number(s.passing_grade),
                midtermCount: s.midterm_count,
                subjects: s.subjects || [], // Nested Serializer should provide this
                gradingConfig: { // Backwards compat if needed by other components
                    passingGrade: Number(s.passing_grade),
                    maxGrade: 10,
                    gradeScale: 'numeric'
                }
            }));
            setSchools(mappedSchools);
        } catch (error) {
            console.error("Error fetching schools:", error);
            showError("Error fetching schools. Please try again.");
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const handleAddSchool = () => {
        setSelectedSchool(null);
        setIsSchoolOverlayOpen(true);
    };

    const handleEditSchool = (school: any) => {
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
                const response = await api.put(`/v1/schools/${selectedSchool.id}/`, payload);

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
            showError("Failed to save school.");
        }
    };

    const handleAddSubject = (schoolId: string) => {
        setSelectedSchoolIdForSubject(schoolId);
        setSelectedSubject(null); // Clear any previous selection
        setIsSubjectOverlayOpen(true);
    };

    const handleEditSubject = (subject: any, schoolId: string) => {
        setSelectedSchoolIdForSubject(schoolId);
        setSelectedSubject(subject);
        setIsSubjectOverlayOpen(true);
        setContextMenu(null); // Close context menu
    };

    const handleSubjectContextMenu = (event: React.MouseEvent, subject: any, schoolId: string) => {
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
                                )
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
            showError("Failed to save subject.");
        }
    };

    const handleDeleteSubject = async (subjectId: string) => {
        try {
            const { default: api } = await import('../../api/client');
            await api.delete(`/v1/subjects/${subjectId}/`);
            setIsSubjectOverlayOpen(false);
            setSelectedSubject(null);
            fetchSchools(); // Refresh list
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
                        subjects={school.subjects} // Passing the structured data
                        onAddClass={() => handleAddSubject(school.id)}
                        onGroupClick={handleGroupClick}
                        onEditSchool={() => handleEditSchool(school)}
                        onSubjectContextMenu={(e, subject) => handleSubjectContextMenu(e, subject, school.id)}
                    />
                ))}

                <button className="add-school-btn" onClick={handleAddSchool}>
                    + Escuela
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
                    initialData={selectedSubject}
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
                                label: 'Editar Materia',
                                onClick: () => handleEditSubject(contextMenu.subject, contextMenu.schoolId)
                            },
                            {
                                label: 'Eliminar Materia',
                                onClick: () => {
                                    if (contextMenu.subject.id) {
                                        handleDeleteSubject(contextMenu.subject.id);
                                    }
                                },
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
