import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { svgPaths } from './symbols';
import { getAuthToken, clearAuthToken } from '../services/api';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: 'home', labelKey: 'admin.dashboard' },
  { path: '/admin/articles', icon: 'file', labelKey: 'admin.articles' },
  { path: '/admin/comments', icon: 'comment', labelKey: 'admin.comments' },
  { path: '/admin/settings', icon: 'settings', labelKey: 'admin.settings' },
];

const NavIcon = ({ type }: { type: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={svgPaths[type as keyof typeof svgPaths] || ''} />
  </svg>
);

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, mode, toggleMode } = useTheme();
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!getAuthToken() && !location.pathname.includes('/login')) {
      navigate('/admin/login', { replace: true });
    }
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={`admin-layout ${mounted ? 'layout-mounted' : ''}`}>
      <aside
        className={`admin-sidebar ${sidebarHovered ? 'sidebar-hovered' : ''}`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="admin-logo" onClick={() => navigate('/admin/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          <span className="logo-text">BGNeo</span>
          <span className="logo-version">v2.0</span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="nav-icon"><NavIcon type={item.icon} /></span>
              <span className="nav-label">{t(item.labelKey)}</span>
              {location.pathname === item.path && <span className="nav-indicator" />}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="sidebar-user-info">
            <div className="user-avatar-ring">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span className="user-status">Online</span>
          </div>
          <button
            onClick={() => { clearAuthToken(); navigate('/admin/login'); }}
            className="admin-logout-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t('admin.logout')}
          </button>
        </div>
      </aside>

      <div className="admin-right">
        <header className="admin-topbar">
          <div className="topbar-left-section">
            <div className="breadcrumb-nav">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="topbar-path">{location.pathname}</span>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="cur-theme-tag" style={{ background: theme.colors.accentPrimary }}>{theme.nameZh}</span>
            <button className="theme-toggle-btn" onClick={toggleMode}
              title={mode === 'light' ? t('theme.dark') : t('theme.light')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mode === 'light'
                  ? <path d={svgPaths.moon} />
                  : <path d={svgPaths.sun} />
                }
              </svg>
            </button>
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
