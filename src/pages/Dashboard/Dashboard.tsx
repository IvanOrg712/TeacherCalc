import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import SchoolSection from '../../components/SchoolSection/SchoolSection';
import { MOCK_SCHOOLS } from '../../data/mockData';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    // Use centralized mock data
    const [schools] = useState(MOCK_SCHOOLS);

    const handleAddSchool = () => {
        console.log("Add School Clicked");
        // Logic to add school would go here
    };

    const handleAddSubject = (schoolId: string) => {
        console.log(`Add Subject clicked for School ID: ${schoolId}`);
        // Logic to add subject would go here
    };

    const handleGroupClick = (subjectId: string, groupId: string) => {
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
                    />
                ))}

                <button className="add-school-btn" onClick={handleAddSchool}>
                    + Escuela
                </button>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
