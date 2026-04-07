import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { settingApi } from '../../services/api';
import { useTheme, THEMES } from '../../hooks/useTheme';

const SITE_FIELDS = [
  { key: 'site_title', label: '站点标题', type: 'text' },
  { key: 'site_description', label: '站点描述', type: 'text' },
  { key: 'posts_per_page', label: '每页文章数', type: 'number' },
  { key: 'enable_comments', label: '开启评论', type: 'checkbox' },
  { key: 'rss_count', label: 'RSS文章数量', type: 'number' },
] as const;

function ThemeSwatch({ theme, active, onClick }: { theme: (typeof THEMES)[number]; active: boolean; onClick: () => void }) {
  return (
    <button className={`theme-swatch ${active ? 'active' : ''}`} onClick={onClick}
      title={`${theme.nameZh} (${theme.name})`}>
      <span className="swatch-colors" style={{
        background: `linear-gradient(135deg, ${theme.colors.bgPrimary} 0%, ${theme.colors.bgSecondary} 50%, ${theme.colors.accentPrimary} 100%)`
      }} />
      <span className="swatch-name">{theme.nameZh}</span>
      {active && <span className="swatch-check" />}
    </button>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { darkTheme, lightTheme, mode, setTheme, setMode } = useTheme();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'theme' | 'site'>('theme');

  useEffect(() => {
    settingApi.get().then((r: any) => setForm(r.data || {})).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await settingApi.update(form);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
  }

  const darkThemes = THEMES.filter(t => t.mode === 'dark');
  const lightThemes = THEMES.filter(t => t.mode === 'light');

  return (
    <>
      <Helmet><title>{t('admin.settings')} - Admin</title></Helmet>
      <div className="admin-page">
        <div className="page-header">
          <h1>{t('admin.settings')}</h1>
          <div className="settings-tabs">
            <button className={`tab-btn ${tab === 'theme' ? 'active' : ''}`} onClick={() => setTab('theme')}>主题</button>
            <button className={`tab-btn ${tab === 'site' ? 'active' : ''}`} onClick={() => setTab('site')}>站点</button>
          </div>
        </div>
        {saved && <div className="save-success-msg">已保存</div>}

        {tab === 'theme' && (
          <div className="theme-picker">
            <div className="dual-theme-header">
              <p className="dual-theme-desc">同时选择深色与亮色主题，切换时自动应用对应配色</p>
              <div className="mode-preview-toggle">
                <span className={`mode-label ${mode === 'dark' ? 'active' : ''}`}>当前: 深色</span>
                <button
                  className={`mode-switch-btn ${mode === 'light' ? 'light-active' : ''}`}
                  onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  title="预览切换"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {mode === 'dark' ? (
                      <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
                    ) : (
                      <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></>
                    )}
                  </svg>
                </button>
                <span className={`mode-label ${mode === 'light' ? 'active' : ''}`}>当前: 亮色</span>
              </div>
            </div>

            <section className="theme-group">
              <h3 className="group-label">
                暗色主题 / Dark
                <span className="current-badge">{darkTheme.nameZh}</span>
              </h3>
              <div className="theme-grid">
                {darkThemes.map(t => (
                  <ThemeSwatch key={t.id} theme={t} active={darkTheme.id === t.id} onClick={() => setTheme(t)} />
                ))}
              </div>
            </section>

            <section className="theme-group">
              <h3 className="group-label">
                亮色主题 / Light
                <span className="current-badge">{lightTheme.nameZh}</span>
              </h3>
              <div className="theme-grid">
                {lightThemes.map(t => (
                  <ThemeSwatch key={t.id} theme={t} active={lightTheme.id === t.id} onClick={() => setTheme(t)} />
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'site' && (
          <form onSubmit={handleSubmit} className="settings-form">
            {SITE_FIELDS.map(f => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                {f.type === 'checkbox'
                  ? <input type="checkbox" checked={form[f.key] === 'true'}
                    onChange={e => setForm(p => ({ ...p, [f.key]: String(e.target.checked) }))} />
                  : <input type={f.type} value={form[f.key] || ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                }
              </div>
            ))}
            <button type="submit" className="btn-primary btn-lg">保存设置</button>
          </form>
        )}
      </div>
    </>
  );
}
