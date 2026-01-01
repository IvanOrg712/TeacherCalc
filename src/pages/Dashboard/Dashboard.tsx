import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import SchoolSection from '../../components/SchoolSection/SchoolSection';
import type { School } from '../../types/models';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    // Extended Mock Data to simulate database content
    const [schools] = useState<School[]>([
        {
            id: '1',
            name: "Universidad Central",
            subjects: [
                {
                    id: 's1',
                    name: "Matemáticas Discretas",
                    groups: [{ id: 'g1', name: "710" }, { id: 'g2', name: "711" }, { id: 'g3', name: "712" }]
                },
                {
                    id: 's2',
                    name: "Álgebra Lineal",
                    groups: [{ id: 'g4', name: "820" }, { id: 'g5', name: "821" }]
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
                    groups: [{ id: 'g6', name: "101" }, { id: 'g7', name: "102" }]
                },
                {
                    id: 's4',
                    name: "Cálculo Diferencial",
                    groups: [{ id: 'g8', name: "201" }]
                },
                {
                    id: 's5',
                    name: "Estadística Básica",
                    groups: [{ id: 'g9', name: "301" }]
                }
            ]
        }
    ]);

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
