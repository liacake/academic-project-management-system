import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Kanban, Users, Shield, LogOut, Menu, X, Compass } from 'lucide-react';
import './Navbar.css';
import strings from './strings';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const location = useLocation();
  const { isAuthenticated, user, logout, hasRole } = useAuth();

  const navItems = [
    { path: '/',         label: strings.navbar.dashboard, Icon: LayoutDashboard },
    { path: '/projects', label: strings.navbar.projects,  Icon: FolderKanban },
    { path: '/kanban',   label: strings.navbar.kanban,    Icon: Kanban },
    { path: '/team',     label: strings.navbar.team,      Icon: Users },
    ...(hasRole('admin') ? [{ path: '/admin', label: strings.navbar.admin, Icon: Shield }] : []),
  ];

  const isActive = (path: string) =>
    path === '/browse'
      ? location.pathname.startsWith('/browse')
      : location.pathname === path;

  const homePath = isAuthenticated ? '/' : '/browse';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={homePath} className="navbar-brand">
          <div className="navbar-logo-mark"><span>A</span></div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-short">{strings.appName}</span>
            <span className="navbar-brand-full">{strings.appFullName}</span>
          </div>
        </Link>

        <ul className={`nav-links ${open ? 'active' : ''}`}>
          {!isAuthenticated && (
            <li>
              <Link
                to="/browse"
                className={`nav-link ${isActive('/browse') ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Compass size={15} className="nav-link-icon" />
                <span>{strings.navbar.browse}</span>
              </Link>
            </li>
          )}
          {isAuthenticated && navItems.map(({ path, label, Icon }) => (
            <li key={path}>
              <Link
                to={path}
                className={`nav-link ${isActive(path) ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={15} className="nav-link-icon" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="navbar-user">
              <div className="user-avatar">{user?.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{strings.roles[user?.role || 'guest']}</span>
              </div>
              <button className="btn-logout" onClick={logout} title={strings.auth.logout}>
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">{strings.auth.login}</Link>
          )}

          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label={strings.navbar.toggleMenu}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
