import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import ReadingProgress from './ReadingProgress';
import BackToTop from './BackToTop';

interface LayoutProps { children: ReactNode; }

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-layout">
      <ReadingProgress />
      <MobileNav open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} onClose={() => setSidebarOpen(false)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main">{children}</main>
      <BackToTop />
    </div>
  );
}
