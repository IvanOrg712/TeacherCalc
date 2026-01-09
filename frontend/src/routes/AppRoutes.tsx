import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage/LoginPage';
import Dashboard from '../pages/Dashboard/Dashboard';
import AttendancePage from '../pages/Attendance/AttendancePage';
import GradesPage from '../pages/Grades/GradesPage';

/**
 * Application routes configuration
 * Defines all route definitions and navigation guards
 */
function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance/:subjectId/:groupId" element={<AttendancePage />} />
            <Route path="/grades/:subjectId/:groupId" element={<GradesPage />} />
            {/* Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default AppRoutes;
