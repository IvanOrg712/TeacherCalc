import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
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
            setEmailError(t('auth.invalidEmail'));
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
                setEmailError(t('auth.loginError'));
                setIsUnverified(false);
            }
        }
    };

    const handleResendVerification = async () => {
        if (!email) {
            setResendMessage(t('auth.resendPrompt'));
            return;
        }

        setResendLoading(true);
        setResendMessage('');

        try {
            const { resendVerification } = await import('../../api/auth');
            await resendVerification(email);
            setResendMessage(t('auth.resendSuccess'));
        } catch (error: any) {
            console.error(error);
            setResendMessage(t('auth.resendError'));
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
                        <h1>{t('auth.welcomeBack')}</h1>
                        <p>{t('auth.loginToContinue')}</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label htmlFor="email">{t('auth.email')}</label>
                            <input
                                type="email"
                                id="email"
                                placeholder={t('auth.emailPlaceholder')}
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
                            <label htmlFor="password">{t('auth.password')}</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder={t('auth.passwordPlaceholder')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? t('auth.hide') : t('auth.show')}
                                </button>
                            </div>
                        </div>

                        <div className="forgot-password">
                            {t('auth.forgotPassword')}
                        </div>

                        <button type="submit" className="login-btn">
                            {t('auth.login')}
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
                                    {resendLoading ? t('auth.sendingEmail') : t('auth.resendVerification')}
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
                            {t('auth.dontHaveAccount')}{' '}
                            <a href="/signup" onClick={(e) => {
                                e.preventDefault();
                                navigate('/signup');
                            }} style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
                                {t('auth.signUp')}
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
