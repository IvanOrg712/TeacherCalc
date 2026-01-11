import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        lastName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError('El correo y la contraseña son obligatorios');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return false;
        }

        if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
            setError('La contraseña debe contener letras y números');
            return false;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
            setError('Por favor ingresa un correo válido');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.toLowerCase().trim(),
                    password: formData.password,
                    name: formData.name.trim(),
                    last_name: formData.lastName.trim()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || '¡Registro exitoso! Por favor revisa tu correo para verificar tu cuenta.');
                navigate('/login');
            } else {
                setError(data.error || 'Error en el registro. Por favor intenta de nuevo.');
            }
        } catch (err) {
            setError('Error de conexión. Por favor verifica tu conexión e intenta de nuevo.');
        } finally {
            setLoading(false);
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
                        <h1>Crear cuenta</h1>
                        <p>Únete a TeacherCalc y simplifica la gestión de calificaciones</p>
                    </div>

                    <form onSubmit={handleSubmit} className="signup-form">
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Nombre (Opcional)</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Juan"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Apellido (Opcional)</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Pérez"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="nombre@ejemplo.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Mínimo 8 caracteres"
                            />
                            <small className="form-hint">
                                Debe tener al menos 8 caracteres con letras y números
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Vuelve a ingresar tu contraseña"
                            />
                        </div>

                        <button
                            type="submit"
                            className="signup-button"
                            disabled={loading}
                        >
                            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>

                        <div className="login-link">
                            ¿Ya tienes una cuenta?{' '}
                            <a href="/login" onClick={(e) => {
                                e.preventDefault();
                                navigate('/login');
                            }}>
                                Inicia sesión
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
