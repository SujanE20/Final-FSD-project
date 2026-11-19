import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
    return 'Could not reach the server. Check that the backend is running and try again.';
  }
  return 'Sign in failed. Please try again.';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-main">
      <section className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue to your workspace.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Your password" required minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footnote">New to Workflow Builder? <Link to="/register">Create an account</Link></p>
        <p className="auth-footnote"><button className="topbar-link" type="button" onClick={async () => { try { const { data } = await api.get('/health'); setError(`API is ${data.status}; database is ${data.database}.`); } catch { setError('Cannot reach the API. Start the server and try again.'); } }}>Check connection</button></p>
      </section>
    </main>
  );
}
