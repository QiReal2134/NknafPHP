import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const { t } = useTranslation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <Helmet><title>404 - Nknaf's Blog</title></Helmet>
      <div className="not-found-page">
        <div 
          className="not-found-glow"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
          }}
        />
        <div className="not-found-content">
          <div className="not-found-illustration">
            <svg viewBox="0 0 200 200" className="not-found-svg">
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--accent-primary)" strokeWidth="2" opacity="0.3" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="var(--accent-primary)" strokeWidth="2" opacity="0.5" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="var(--accent-primary)" strokeWidth="2" opacity="0.7" />
              <text x="100" y="110" textAnchor="middle" fill="var(--accent-primary)" fontSize="48" fontWeight="700">404</text>
            </svg>
          </div>
          <h1 className="not-found-title">页面未找到</h1>
          <p className="not-found-description">
            {t('common.notFound', '抱歉，您访问的页面不存在或已被移除。')}
          </p>
          <div className="not-found-actions">
            <Link to="/" className="not-found-btn-primary">
              返回首页
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className="not-found-btn-secondary"
            >
              返回上一页
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
