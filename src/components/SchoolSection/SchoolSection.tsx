import ClassCard from '../ClassCard/ClassCard';
import type { Subject } from '../../types/models';
import './SchoolSection.css';

interface SchoolSectionProps {
    schoolName: string;
    subjects: Subject[];
    onAddClass?: () => void;
}

const SchoolSection: React.FC<SchoolSectionProps> = ({ schoolName, subjects, onAddClass }) => {
    return (
        <div className="school-section">
            <h2 className="school-name">{schoolName}</h2>

            <div className="school-classes-list">
                {subjects.map((subject) => (
                    <ClassCard
                        key={subject.id}
                        name={subject.name}
                        sections={subject.groups.map(g => g.name)}
                    />
                ))}

                {/* Render "Add Class" button to look exactly like a ClassCard container but with centered content */}
                <div className="add-class-btn" onClick={onAddClass}>
                    +
                </div>
            </div>
        </div>
    );
};

export default SchoolSection;
