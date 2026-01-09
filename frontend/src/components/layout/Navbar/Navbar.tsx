import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

interface NavbarProps {
    userName?: string;
}

const Navbar: React.FC<NavbarProps> = ({ userName = "Esteban" }) => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        // Clear any auth tokens/data here if needed
        localStorage.clear();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                Logo de la Empresa
            </div>
            <div className="navbar-right">
                <span className="navbar-user">Bienvenido, {userName}</span>
                <span className="navbar-separator">|</span>
                <button className="signout-button" onClick={handleSignOut}>
                    Cerrar Sesión
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
