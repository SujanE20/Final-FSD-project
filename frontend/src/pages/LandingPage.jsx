import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main className="auth-main">
      <section className="hero">
        <span className="hero-tag">AUTOMATION, WITHOUT THE BUSYWORK</span>
        <h1>Make your workflows <span>work for you.</span></h1>
        <p>
          Connect the steps in your work, automate repetitive tasks, and keep
          everything moving—all from one visual workspace.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/register">Create your account</Link>
          <Link className="secondary-button" to="/login">Sign in</Link>
        </div>
        <div className="feature-row" aria-label="Platform features">
          <span className="feature-pill">Visual workflows</span>
          <span className="feature-pill">Smart conditions</span>
          <span className="feature-pill">Activity tracking</span>
        </div>
      </section>
    </main>
  );
}
