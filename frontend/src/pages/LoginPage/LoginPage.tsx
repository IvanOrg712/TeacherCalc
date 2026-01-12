import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate }
    from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isUnverified, setIsUnverified] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
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
        setIsUnverified(false);
        setResendMessage('');

        // Real Backend Call
        try {
            const { login } = await import('../../api/auth');
            const data = await login({ email, password });

            // Store tokens
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);

            // Store user information
            localStorage.setItem('userName', data.user.name || '');
            localStorage.setItem('userLastName', data.user.last_name || '');
            localStorage.setItem('userEmail', data.user.email);

            // Navigate to Dashboard
            navigate('/dashboard');
        } catch (error: any) {
            console.error(error);

            // Check if error is due to unverified email
            if (error?.response?.data?.detail) {
                const errorMessage = error.response.data.detail;

                // Check if it's an email verification error
                if (errorMessage.includes('verificado') || errorMessage.includes('verifica')) {
                    setEmailError(errorMessage);
                    setIsUnverified(true);
                } else {
                    setEmailError(errorMessage);
                    setIsUnverified(false);
                }
            } else if (error?.message) {
                setEmailError(error.message);
                setIsUnverified(false);
            } else {
                setEmailError('Error al iniciar sesión. Verifique sus credenciales.');
                setIsUnverified(false);
            }
        }
    };

    const handleResendVerification = async () => {
        if (!email) {
            setResendMessage('Por favor ingresa tu correo electrónico');
            return;
        }

        setResendLoading(true);
        setResendMessage('');

        try {
            const { resendVerification } = await import('../../api/auth');
            await resendVerification(email);
            setResendMessage('✓ Correo de verificación enviado. Por favor revisa tu bandeja de entrada.');
        } catch (error: any) {
            console.error(error);
            setResendMessage('Error al enviar el correo. Por favor intenta de nuevo.');
        } finally {
            setResendLoading(false);
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

                        {isUnverified && (
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    style={{
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: resendLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        opacity: resendLoading ? 0.6 : 1
                                    }}
                                >
                                    {resendLoading ? 'Enviando...' : 'Reenviar Correo de Verificación'}
                                </button>
                                {resendMessage && (
                                    <p style={{
                                        marginTop: '10px',
                                        fontSize: '14px',
                                        color: resendMessage.includes('✓') ? '#10b981' : '#ef4444'
                                    }}>
                                        {resendMessage}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="signup-link" style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#718096' }}>
                            ¿No tienes una cuenta?{' '}
                            <a href="/signup" onClick={(e) => {
                                e.preventDefault();
                                navigate('/signup');
                            }} style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
                                Regístrate
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
