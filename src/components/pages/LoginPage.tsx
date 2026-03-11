import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import strings from '../ui/strings';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid email or password. Please check your credentials.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">A</div>
          <h1 className="login-title">{strings.appName}</h1>
          <p className="login-subtitle">{strings.appFullName}</p>
        </div>

        <h2 className="login-heading">{strings.auth.loginTitle}</h2>
        <p className="login-desc">{strings.auth.loginSubtitle}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{strings.auth.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{strings.auth.password}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? strings.auth.loggingIn : strings.auth.loginButton}
          </button>
        </form>

        <div className="login-demo">
          <p className="demo-label">Sign in with your university email and password.</p>
          <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.5rem' }}>
            Don't have an account? Ask your system administrator to create one.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
