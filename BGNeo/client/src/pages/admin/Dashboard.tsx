import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { articleApi, commentApi, getAuthToken } from '../../services/api';
import { svgPaths } from '../../components/symbols';
import type { ReactNode, CSSProperties } from 'react';
import StatsPanel from './StatsPanel';
import { formatRelativeTime } from '../../utils/timeUtils';

interface StatCardDef {
  label: string; value: number; icon: string; color: string; trend?: number;
}

const StatIcon = ({ type }: { type: string }): ReactNode => {
  const icons: Record<string, ReactNode> = {
    articles: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={svgPaths.file} /></svg>,
    comments: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={svgPaths.search} /></svg>,
    pending: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  };
  return icons[type] || null;
};

function AnimatedNumber({ value, loading }: { value: number; loading: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    if (loading) return;
    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value, loading]);

  return <span>{loading ? '-' : displayValue}</span>;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ articles: 0, comments: 0, pendingComments: 0 });
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) { navigate('/admin/login'); return; }
    setLoadingStats(true);
    Promise.all([
      articleApi.getList({ limit: 5 }).then((r: any) => {
        setRecentArticles(r.data?.list || []);
        setStats(prev => ({ ...prev, articles: r.data?.total || 0 }));
      }).catch(() => {}),
      commentApi.getStats().then((r: any) => {
        setStats(p => ({ ...p, comments: r.data?.total || 0, pendingComments: r.data?.pending || 0 }));
      }).catch(() => {}),
    ]).finally(() => { setLoadingStats(false); setTimeout(() => setMounted(true), 100); });
  }, []);

  const statCards: StatCardDef[] = [
    { label: t('admin.totalArticles'), value: stats.articles, icon: 'articles', color: 'var(--accent-primary)' },
    { label: t('admin.totalComments'), value: stats.comments, icon: 'comments', color: 'var(--accent-success)' },
    { label: t('admin.pendingComments'), value: stats.pendingComments, icon: 'pending', color: 'var(--accent-warning)' },
  ];

  return (
    <>
      <Helmet><title>{t('admin.dashboard')} - Admin</title></Helmet>
      <div className={`dashboard-page ${mounted ? 'dash-mounted' : ''}`}>
        <div className="dash-header">
          <div className="dash-header-left">
            <h1>
              <span className="header-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </span>
              {t('admin.dashboard')}
            </h1>
          </div>
          <span className="dash-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div className="stat-cards">
          {statCards.map((s, index) => (
            <div key={s.label} className="stat-card" style={{
              '--card-color': s.color,
              '--card-index': index
            } as CSSProperties}>
              <div className="stat-card-glow" />
              <div className="stat-icon-wrap" style={{ color: s.color }}>
                <StatIcon type={s.icon} />
              </div>
              <div className="stat-info">
                <span className="stat-value"><AnimatedNumber value={s.value} loading={loadingStats} /></span>
                <span className="stat-label">{s.label}</span>
              </div>
              {!loadingStats && s.trend !== undefined && (
                <span className={`stat-trend ${s.trend >= 0 ? 'trend-up' : 'trend-down'}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    {s.trend >= 0 ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                  </svg>
                  {s.trend >= 0 ? '+' : ''}{s.trend}%
                </span>
              )}
            </div>
          ))}
        </div>

        <section className="dash-section">
          <div className="section-header">
            <h2>
              <span className="section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </span>
              {t('admin.recentArticles') || '最近文章'}
            </h2>
            <Link to="/admin/articles" className="section-link">
              {t('admin.viewAll') || '查看全部'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
          {recentArticles.length > 0 ? (
            <table className="dash-table enhanced-table">
              <thead>
                <tr>
                  <th>{t('article.title') || '标题'}</th>
                  <th>{t('common.status') || '状态'}</th>
                  <th>{t('admin.views') || '浏览'}</th>
                  <th>{t('common.date') || '日期'}</th>
                </tr>
              </thead>
              <tbody>
                {recentArticles.map((a, idx) => (
                  <tr key={a.id} style={{ '--row-index': idx } as CSSProperties}>
                    <td className="title-cell">
                      <Link to={`/post/${a.slug}`} target="_blank">{a.title}</Link>
                    </td>
                    <td>
                      <span className={`status-badge status-${a.status} status-enhanced`}>
                        <span className="status-dot" />
                        {t(`common.${a.status}`) || a.status}
                      </span>
                    </td>
                    <td>
                      <span className="view-count-cell">{a.view_count || 0}</span>
                    </td>
                    <td><span className="date-cell">{formatRelativeTime(a.created_at)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="dash-empty-text">{t('article.noArticles')}</p>}
        </section>

        <section className="dash-section quick-actions">
          <h3>
            <span className="section-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </span>
            {t('admin.quickActions') || '快捷操作'}
          </h3>
          <div className="quick-action-grid">
            <Link to="/admin/articles" className="quick-action-card">
              <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 75%, var(--text-primary)))' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-accent)" strokeWidth="2"><path d={svgPaths.file} /></svg>
              </div>
              <span>{t('admin.manageArticles') || '管理文章'}</span>
              <div className="action-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
            <Link to="/admin/comments" className="quick-action-card">
              <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, var(--accent-secondary), color-mix(in srgb, var(--accent-secondary) 75%, var(--text-primary)))' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-accent)" strokeWidth="2"><path d={svgPaths.comment} /></svg>
              </div>
              <span>{t('admin.reviewComments') || '审核评论'}</span>
              <div className="action-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
            <Link to="/admin/settings" className="quick-action-card">
              <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, var(--accent-warning), color-mix(in srgb, var(--accent-warning) 70%, var(--text-primary)))' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-warning)" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </div>
              <span>{t('admin.settings') || '系统设置'}</span>
              <div className="action-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
          </div>
        </section>

        <StatsPanel />
      </div>
    </>
  );
}
