import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { router } from './router';
import i18n from './i18n';
import { ToastProvider } from './components/Toast';
import ThemeTransition from './components/ThemeTransition';
import './styles/global.css';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <ToastProvider>
          <ThemeTransition />
          <RouterProvider router={router} />
        </ToastProvider>
      </HelmetProvider>
    </I18nextProvider>
  );
}
