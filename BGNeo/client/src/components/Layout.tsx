/**
 * 应用布局组件，包含侧边栏、移动导航、阅读进度和回到顶部按钮
 * @param children 子组件
 */
import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import ReadingProgress from './ReadingProgress';
import BackToTop from './BackToTop';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      <ReadingProgress />
      <MobileNav 
        open={sidebarOpen} 
        onToggle={handleSidebarToggle} 
        onClose={handleSidebarClose} 
      />
      <Sidebar 
        open={sidebarOpen} 
        onClose={handleSidebarClose} 
      />
      <main className="app-main">{children}</main>
      <BackToTop />
    </div>
  );
}
