import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminLayout from '../components/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

const Home = lazy(() => import('../pages/Home'));
const ArticleDetail = lazy(() => import('../pages/ArticleDetail'));
const CategoryArchive = lazy(() => import('../pages/CategoryArchive'));
const TagArchive = lazy(() => import('../pages/TagArchive'));
const SearchResult = lazy(() => import('../pages/SearchResult'));
const About = lazy(() => import('../pages/About'));
const ArchivePage = lazy(() => import('../pages/ArchivePage'));
const CategoryList = lazy(() => import('../pages/CategoryList'));
const TagList = lazy(() => import('../pages/TagList'));
const NotFound = lazy(() => import('../pages/NotFound'));
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const ArticleManage = lazy(() => import('../pages/admin/ArticleManage'));
const CommentManage = lazy(() => import('../pages/admin/CommentManage'));
const Settings = lazy(() => import('../pages/admin/Settings'));

function Loading() { return <div style={{ textAlign: 'center', padding: '3rem' }}>加载中...</div>; }
function LazyWrapper({ children }: { children: React.ReactNode }) { return <Suspense fallback={<Loading />}>{children}</Suspense>; }

export const router = createBrowserRouter([
  { path: '/', element: (<Layout><LazyWrapper><Home /></LazyWrapper></Layout>) },
  { path: '/post/:slug', element: (<Layout><LazyWrapper><ArticleDetail /></LazyWrapper></Layout>) },
  { path: '/category', element: (<Layout><LazyWrapper><CategoryList /></LazyWrapper></Layout>) },
  { path: '/category/:slug', element: (<Layout><LazyWrapper><CategoryArchive /></LazyWrapper></Layout>) },
  { path: '/tag', element: (<Layout><LazyWrapper><TagList /></LazyWrapper></Layout>) },
  { path: '/tag/:slug', element: (<Layout><LazyWrapper><TagArchive /></LazyWrapper></Layout>) },
  { path: '/search', element: (<Layout><LazyWrapper><SearchResult /></LazyWrapper></Layout>) },
  { path: '/about', element: (<Layout><LazyWrapper><About /></LazyWrapper></Layout>) },
  { path: '/archives', element: (<Layout><LazyWrapper><ArchivePage /></LazyWrapper></Layout>) },
  { path: '/admin/login', element: <LazyWrapper><AdminLogin /></LazyWrapper> },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <LazyWrapper><Dashboard /></LazyWrapper> },
      { path: 'articles', element: <LazyWrapper><ArticleManage /></LazyWrapper> },
      { path: 'comments', element: <LazyWrapper><CommentManage /></LazyWrapper> },
      { path: 'settings', element: <LazyWrapper><Settings /></LazyWrapper> },
    ],
  },
  { path: '*', element: (<Layout><LazyWrapper><NotFound /></LazyWrapper></Layout>) },
]);
