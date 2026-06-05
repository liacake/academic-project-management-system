import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAllowedSignupEmail } from '../../lib/authErrors';
import strings from '../ui/strings';
import './LoginPage.css';

type Mode = 'login' | 'signup';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Derived student ID preview
  const studentIdPreview = email.includes('@') ? email.split('@')[0] : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (mode === 'signup') {
      if (!isAllowedSignupEmail(email)) { setError(strings.auth.domainNotAllowed); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      setLoading(true);
      const result = await signup(email, password, name || studentIdPreview);
      setLoading(false);
      if (!result.success) { setError(result.error ?? 'Sign up failed.'); return; }
      setSuccess(strings.auth.signupSuccess);
      setMode('login');
      setPassword(''); setConfirm(''); setName('');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) { navigate('/'); }
    else { setError(result.error ?? strings.auth.loginError); }
  };

  const switchMode = (m: Mode) => { setMode(m); setError(''); setSuccess(''); };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">A</div>
          <h1 className="login-title">{strings.appName}</h1>
          <p className="login-subtitle">{strings.appFullName}</p>
        </div>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button className={`login-tab ${mode === 'login' ? 'login-tab--active' : ''}`} onClick={() => switchMode('login')} type="button">Sign in</button>
          <button className={`login-tab ${mode === 'signup' ? 'login-tab--active' : ''}`} onClick={() => switchMode('signup')} type="button">Create account</button>
        </div>

        {success && <div className="login-success">{success}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Full name <span className="form-optional">(optional)</span></label>
              <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Alice Santos" autoComplete="name" />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{strings.auth.email}</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu" required autoComplete="email" />
          </div>

          {mode === 'signup' && (
            <p className="login-domain-hint">
              Use your <strong>@esg.ipsantarem.pt</strong> university email to register.
            </p>
          )}

          {mode === 'signup' && studentIdPreview && (
            <div className="login-student-id-hint">
              {strings.auth.studentIdHint.replace('{id}', studentIdPreview)}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">{strings.auth.password}</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" required autoComplete="new-password" />
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (mode === 'signup' ? 'Creating account…' : strings.auth.loggingIn)
                     : (mode === 'signup' ? 'Create account' : strings.auth.loginButton)}
          </button>
        </form>

        <div className="login-guest-link">
          <a href="/" onClick={e => { e.preventDefault(); navigate('/browse'); }}>
            Browse public projects without signing in →
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
