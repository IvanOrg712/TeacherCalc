import React, { type ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="dashboard-layout">
            <Navbar />
            <main className="dashboard-content">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
