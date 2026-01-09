import React from 'react';
import './ClassCard.css';

interface ClassCardProps {
    name: string;
    sections: { id: string; name: string }[];
    onSectionClick?: (sectionId: string) => void;
    onCardContextMenu?: (event: React.MouseEvent) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ name, sections, onSectionClick, onCardContextMenu }) => {
    return (
        <div
            className="class-card"
            onContextMenu={onCardContextMenu}
            style={{ cursor: onCardContextMenu ? 'context-menu' : 'default' }}
            title={onCardContextMenu ? 'Right-click to edit subject' : ''}
        >
            <div className="class-name">
                {name}
            </div>
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
