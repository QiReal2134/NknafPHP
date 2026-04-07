import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet><title>404 - Nknaf's Blog</title></Helmet>
      <div className="not-found-page">
        <h1>404</h1>
        <p>{t('common.notFound', '页面未找到')}</p>
        <Link to="/" style={{
          display: 'inline-block', padding: '10px 28px',
          borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)',
          color: 'var(--text-on-accent)', fontWeight: 500
        }}>{t('common.back') || '返回首页'}</Link>
      </div>
    </>
  );
}
