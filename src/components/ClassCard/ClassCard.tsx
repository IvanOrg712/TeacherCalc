import React from 'react';
import './ClassCard.css';

interface ClassCardProps {
    name: string;
    sections: { id: string; name: string }[];
    onSectionClick?: (sectionId: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ name, sections, onSectionClick }) => {
    return (
        <div className="class-card">
            <div className="class-name">{name}</div>
            <div className="class-sections">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        className="section-badge"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSectionClick?.(section.id);
                        }}
                    >
                        {section.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ClassCard;
