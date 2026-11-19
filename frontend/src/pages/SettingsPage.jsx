import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { getApiError } from '../utils/format.js';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const { data } = await api.patch('/settings/profile', { name, email });
      updateUser(data.user);
      setMessage('Your profile was updated.');
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not update profile.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <p className="page-intro">Manage the profile details for your account.</p>
      <section className="surface-card settings-card">
        <div className="section-heading"><div><h2>Profile information</h2><p>Your name and email are shown in your workspace.</p></div></div>
        <form className="settings-form" onSubmit={saveProfile}>
          <label className="inspector-field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} /></label>
          <label className="inspector-field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
        <div className="security-note"><strong>Password security</strong><p>Your password is stored as a bcrypt hash and is never returned by the API.</p></div>
      </section>
    </div>
  );
}
