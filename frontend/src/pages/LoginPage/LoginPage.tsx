import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate }
    from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setEmailError('Por favor ingresa un correo válido');
            return;
        }
        setEmailError('');

        // Real Backend Call
        try {
            const { login } = await import('../../api/auth');
            const data = await login({ email, password });

            // Store tokens
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);

            // Navigate to Dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            // Basic error handling
            setEmailError('Error al iniciar sesión. Verifique sus credenciales.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-visual">
                {/* Abstract geometric shapes or branding visual could go here */}
            </div>

            <div className="login-form-section">
                <div className="logo-placeholder">
                    Logo Futuro
                </div>

                <div className="login-form-card">
                    <div className="form-header">
                        <h1>Bienvenido</h1>
                        <p>Inicia sesión para continuar</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label htmlFor="email">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="nombre@ejemplo.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError('');
                                }}
                                required
                                className={emailError ? 'error' : ''}
                            />
                            {emailError && <span className="error-text">{emailError}</span>}
                        </div>

                        <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label htmlFor="password">Contraseña</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>

                        <div className="forgot-password">
                            Olvidé mi contraseña
                        </div>

                        <button type="submit" className="login-btn">
                            Iniciar Sesión
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
