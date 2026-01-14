import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import './SignupPage.css';

const SignupPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        lastName: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError(t('auth.emailRequired'));
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.passwordsMismatch'));
            return false;
        }

        if (formData.password.length < 8) {
            setError(t('auth.passwordTooShort'));
            return false;
        }

        if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
            setError(t('auth.passwordRequirements'));
            return false;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
            setError(t('auth.invalidEmail'));
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/register/', {
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
                name: formData.name.trim(),
                last_name: formData.lastName.trim()
            });

            alert(response.data.message || t('auth.registrationSuccess'));
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.registrationError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-visual">
                {/* Abstract geometric shapes or branding visual */}
            </div>

            <div className="signup-form-section">
                <div className="logo-placeholder">
                    Logo Futuro
                </div>

                <div className="signup-form-card">
                    <div className="signup-header">
                        <h1>{t('auth.createAccount')}</h1>
                        <p>{t('auth.joinTeacherCalc')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="signup-form">
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">{t('auth.name')} {t('auth.optional')}</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={t('auth.namePlaceholder')}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">{t('auth.lastName')} {t('auth.optional')}</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder={t('auth.lastNamePlaceholder')}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">{t('auth.email')}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder={t('auth.emailPlaceholder')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t('auth.password')}</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder={t('auth.passwordMinimum')}
                            />
                            <small className="form-hint">
                                {t('auth.passwordHint')}
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder={t('auth.reenterPassword')}
                            />
                        </div>

                        <button
                            type="submit"
                            className="signup-button"
                            disabled={isLoading}
                        >
                            {isLoading ? t('auth.creatingAccount') : t('auth.createAccountButton')}
                        </button>

                        <div className="login-link">
                            {t('auth.alreadyHaveAccount')}{' '}
                            <a href="/login" onClick={(e) => {
                                e.preventDefault();
                                navigate('/login');
                            }}>
                                {t('auth.signIn')}
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
