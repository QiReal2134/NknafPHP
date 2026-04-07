import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { authApi, setAuthToken } from '../../services/api';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ username, password }) as unknown as {
        success: boolean;
        data?: { token: string };
        message?: string;
      };
      if (data.success && data.data?.token) {
        setAuthToken(data.data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.message || t('admin.login') + '失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    }
    setLoading(false);
  }

  return (
    <>
      <Helmet><title>{t('admin.loginTitle')} - Admin</title></Helmet>
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <img src="/logo.png" alt="Logo" className="logo-image" />
            </div>
            <h1 className="login-title">BGNeo</h1>
            <p className="login-subtitle">管理后台</p>
          </div>

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">{t('admin.username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                autoFocus
                placeholder="请输入用户名"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('admin.password')}</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="请输入密码"
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <span>{t('admin.login')}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
