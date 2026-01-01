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

        // SIMULATED BACKEND CALL
        // In a real app, this would be: const response = await api.login(email, password);
        console.log("Attempting login...");

        // Mocking network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock response from backend
        const mockResponse = {
            token: "abc-123-jwt-token",
            teacher: {
                id: "teacher-001", // This is the ID linked to everything
                firstName: "Esteban",
                lastName: "Dido",
                email: email,
                schoolIds: ["1", "2"]
            }
        };

        console.log("Login Successful!");
        console.log("Teacher ID:", mockResponse.teacher.id);
        console.log("Auth Token:", mockResponse.token);

        // Store context (e.g. Redux, Context API, or LocalStorage for now)
        localStorage.setItem('teacherId', mockResponse.teacher.id);

        navigate('/dashboard');
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
