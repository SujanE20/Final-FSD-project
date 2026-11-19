import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname === '/register';
  const isLogin = pathname === '/login';

  return (
    <div className="auth-layout">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Workflow Builder home">
          <span className="brand-mark" aria-hidden="true">⌘</span>
          <span>Workflow Builder</span>
        </Link>
        {isRegister && (
          <Link className="topbar-link" to="/login">Already have an account?<strong>Sign in</strong></Link>
        )}
        {isLogin && (
          <Link className="topbar-link" to="/register">New here?<strong>Create account</strong></Link>
        )}
      </header>
      <Outlet />
    </div>
  );
}
