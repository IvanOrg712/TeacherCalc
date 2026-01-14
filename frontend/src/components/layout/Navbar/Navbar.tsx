import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

interface NavbarProps {
    userName?: string;
}

const Navbar: React.FC<NavbarProps> = ({ userName }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [displayName, setDisplayName] = useState<string>('');

    useEffect(() => {
        // Get user name from localStorage if not provided via props
        if (userName) {
            setDisplayName(userName);
        } else {
            const storedName = localStorage.getItem('userName');

            if (storedName) {
                setDisplayName(storedName);
            } else {
                setDisplayName(t('dashboard.welcome'));
            }
        }
    }, [userName]);

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
                <span className="navbar-user">{t('dashboard.welcome')}, {displayName}</span>
                <span className="navbar-separator">|</span>
                <button className="signout-button" onClick={handleSignOut}>
                    {t('nav.logout')}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
