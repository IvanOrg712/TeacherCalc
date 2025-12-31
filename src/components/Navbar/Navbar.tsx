import React from 'react';
import './Navbar.css';

interface NavbarProps {
    userName?: string;
}

const Navbar: React.FC<NavbarProps> = ({ userName = "Esteban" }) => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                Logo de la Empresa
            </div>
            <div className="navbar-user">
                Bienvenido, {userName}
            </div>
        </nav>
    );
};

export default Navbar;
