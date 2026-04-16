import { useState, useEffect, lazy, Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { router } from './router';
import i18n, { i18nInitPromise } from './i18n';
import { ToastProvider } from './components/Toast';
import ThemeTransition from './components/ThemeTransition';
import './styles/global.css';

function InitializingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0F0F1A' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #2A2A45', borderTopColor: '#5B8DEF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#C8C8E0', fontSize: '.9rem' }}>初始化中...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AppContent() {
  const { ready } = useTranslation();
  if (!ready) return <InitializingSpinner />;
  return <RouterProvider router={router} />;
}

export default function App() {
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18nInitPromise.then(() => setReady(true));
    }
  }, []);

  if (!ready) return <InitializingSpinner />;

  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <ToastProvider>
          <ThemeTransition />
          <AppContent />
        </ToastProvider>
      </HelmetProvider>
    </I18nextProvider>
  );
}
