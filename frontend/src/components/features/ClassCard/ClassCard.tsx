import React from 'react';
import { useTranslation } from 'react-i18next';
import './ClassCard.css';

interface ClassCardProps {
    name: string;
    sections: { id: string; name: string }[];
    onSectionClick?: (sectionId: string) => void;
    onCardContextMenu?: (event: React.MouseEvent) => void;
    onCopyStructure?: (sectionId: string, sectionName: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({
    name,
    sections,
    onSectionClick,
    onCardContextMenu,
    onCopyStructure
}) => {
    const { t } = useTranslation();

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
                    <div key={section.id} className="section-item">
                        <button
                            className="section-badge"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSectionClick?.(section.id);
                            }}
                        >
                            {section.name}
                        </button>
                        {onCopyStructure && (
                            <button
                                className="copy-structure-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCopyStructure(section.id, section.name);
                                }}
                                title={t('templates.copyStructure')}
                                aria-label={t('templates.copyStructure')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassCard;
