import React from 'react';
import './ClassCard.css';

interface ClassCardProps {
    name: string;
    sections: string[];
    onClick?: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ name, sections, onClick }) => {
    return (
        <div className="class-card">
            <div className="class-name">{name}</div>
            <div className="class-sections">
                {sections.map((section, index) => (
                    <button
                        key={index}
                        className="section-badge"
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log(`Clicked section ${section}`);
                            // Navigate logic here
                        }}
                    >
                        {section}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ClassCard;
