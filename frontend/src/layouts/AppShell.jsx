import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: '◫' },
  { to: '/workflows', label: 'My workflows', icon: '◇' },
  { to: '/tasks', label: 'Tasks', icon: '✓' },
  { to: '/executions', label: 'Execution history', icon: '↗' },
  { to: '/notifications', label: 'Notifications', icon: '◉' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

const pageTitles = {
  '/dashboard': 'Overview',
  '/workflows': 'My workflows',
  '/workflows/new': 'Workflow designer',
  '/executions': 'Execution history',
  '/notifications': 'Notifications',
  '/tasks': 'Tasks',
  '/settings': 'Settings',
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || (location.pathname.startsWith('/workflows/') ? 'Edit workflow' : 'Execution details');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand sidebar-brand" to="/dashboard">
          <span className="brand-mark" aria-hidden="true">⌘</span>
          <span>Flowcraft</span>
        </Link>
        <p className="sidebar-caption">WORKSPACE</p>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <span className="avatar">{user?.name?.slice(0, 1).toUpperCase() || 'U'}</span>
            <span className="user-meta"><strong>{user?.name}</strong><small>{user?.email}</small></span>
          </div>
          <button className="sidebar-logout" type="button" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="workspace-header">
          <div><p className="breadcrumb">WORKSPACE <span>/</span> {title.toUpperCase()}</p><h1>{title}</h1></div>
          <div className="header-account"><span className="online-dot" /> All changes saved</div>
        </header>
        <div className="workspace-content"><Outlet /></div>
      </main>
    </div>
  );
}
