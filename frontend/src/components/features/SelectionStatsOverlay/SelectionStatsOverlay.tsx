import React from 'react';
import type { GradeStats } from '../../../utils/statsUtils';
import './SelectionStatsOverlay.css';

interface SelectionStatsOverlayProps {
    stats: GradeStats;
    isVisible: boolean;
}

const SelectionStatsOverlay: React.FC<SelectionStatsOverlayProps> = ({ stats, isVisible }) => {
    if (!isVisible || stats.count === 0) {
        return null;
    }

    return (
        <div className="stats-overlay">
            <div className="stats-overlay-header">
                <span className="stats-title">Estadísticas de Selección</span>
                <span className="stats-count">{stats.count} celdas</span>
            </div>

            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-label">Promedio</span>
                    <span className="stat-value primary">{stats.average.toFixed(2)}</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Mediana</span>
                    <span className="stat-value">{stats.median.toFixed(2)}</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Mín / Máx</span>
                    <span className="stat-value">{stats.min} / {stats.max}</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Desv. Est.</span>
                    <span className="stat-value">{stats.stdDeviation.toFixed(2)}</span>
                </div>

                {stats.mode.length > 0 && (
                    <div className="stat-item">
                        <span className="stat-label">Moda</span>
                        <span className="stat-value">{stats.mode.join(', ')}</span>
                    </div>
                )}

                <div className="stat-item">
                    <span className="stat-label">Suma</span>
                    <span className="stat-value">{stats.sum.toFixed(2)}</span>
                </div>
            </div>

            <div className="stats-divider"></div>

            <div className="stats-pass-fail">
                <div className="pass-fail-item passing">
                    <span className="pf-label">Aprobados (≥{stats.passingGrade})</span>
                    <span className="pf-value">{stats.passCount}</span>
                </div>
                <div className="pass-fail-item failing">
                    <span className="pf-label">Reprobados (&lt;{stats.passingGrade})</span>
                    <span className="pf-value">{stats.failCount}</span>
                </div>
                <div className="pass-fail-item rate">
                    <span className="pf-label">Tasa de Aprobación</span>
                    <span className="pf-value">{stats.passRate}%</span>
                </div>
            </div>
        </div>
    );
};

export default SelectionStatsOverlay;
