import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './VerifyEmailPage.css';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage(t('auth.invalidVerificationLink'));
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8000/api/auth/verify-email/?token=${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message || t('auth.emailVerified'));

                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || t('auth.verificationFailedMessage'));
                }
            } catch (err) {
                setStatus('error');
                setMessage(t('auth.connectionError'));
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
                        <h1>{t('auth.verifyingEmail')}</h1>
                        <p>{t('auth.pleaseWait')}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="verify-content success">
                        <div className="success-icon">✓</div>
                        <h1>{t('auth.emailVerified')}</h1>
                        <p>{message}</p>
                        <p className="redirect-message">{t('auth.redirectingToLogin')}</p>
                        <button
                            className="verify-button"
                            onClick={() => navigate('/login')}
                        >
                            {t('auth.goToLogin')}
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="verify-content error">
                        <div className="error-icon">✕</div>
                        <h1>{t('auth.verificationFailed')}</h1>
                        <p>{message}</p>
                        <div className="error-actions">
                            <button
                                className="verify-button"
                                onClick={() => navigate('/login')}
                            >
                                {t('auth.goToLogin')}
                            </button>
                            <button
                                className="verify-button secondary"
                                onClick={() => navigate('/signup')}
                            >
                                {t('auth.registerAgain')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
