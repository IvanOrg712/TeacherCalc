import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './VerifyEmailPage.css';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Enlace de verificación inválido. Por favor revisa tu correo e intenta de nuevo.');
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8000/api/auth/verify-email/?token=${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message || '¡Correo verificado exitosamente!');

                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'La verificación falló. Por favor intenta de nuevo.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Error de conexión. Por favor verifica tu conexión e intenta de nuevo.');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="verify-email-page">
            <div className="verify-container">
                {status === 'loading' && (
                    <div className="verify-content">
                        <div className="spinner"></div>
                        <h1>Verificando tu correo...</h1>
                        <p>Por favor espera mientras verificamos tu cuenta.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="verify-content success">
                        <div className="success-icon">✓</div>
                        <h1>¡Correo Verificado!</h1>
                        <p>{message}</p>
                        <p className="redirect-message">Redirigiendo a la página de inicio de sesión...</p>
                        <button
                            className="verify-button"
                            onClick={() => navigate('/login')}
                        >
                            Ir a Iniciar Sesión
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="verify-content error">
                        <div className="error-icon">✕</div>
                        <h1>Verificación Fallida</h1>
                        <p>{message}</p>
                        <div className="error-actions">
                            <button
                                className="verify-button"
                                onClick={() => navigate('/login')}
                            >
                                Ir a Iniciar Sesión
                            </button>
                            <button
                                className="verify-button secondary"
                                onClick={() => navigate('/signup')}
                            >
                                Registrarse de Nuevo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
