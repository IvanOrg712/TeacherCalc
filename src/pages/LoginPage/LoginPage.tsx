import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement actual authentication
        console.log('Logging in with:', email, password);
        navigate('/dashboard');
    };

    return (
        <div className="login-container">
            <div className="login-visual">
                {/* Abstract geometric shapes or branding visual could go here */}
            </div>

            <div className="login-form-section">
                <div className="logo-placeholder">
                    Future Logo
                </div>

                <div className="login-form-card">
                    <div className="form-header">
                        <h1>Welcome Back</h1>
                        <p>Please sign in to continue</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="teacher@school.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn" style={{ marginTop: '2rem' }}>
                            Login
                        </button>

                        <div className="forgot-password">
                            I forgot my password
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
