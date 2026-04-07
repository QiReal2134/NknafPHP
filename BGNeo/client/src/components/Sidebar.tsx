import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { categoryApi, tagApi, articleApi } from '../services/api';
import TreeNode, { type TreeNodeData, useTreeExpansion } from './TreeNode';
import { globalEngine } from '../engines/ParallelRenderEngine';

const logoImg = '/logo.png';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface CategoryItem {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
  children?: CategoryItem[];
  _count?: { articles: number };
}

interface TagItem {
  id: number;
  name: string;
  slug?: string;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [recentArticles, setRecentArticles] = useState<{ id: number; title: string; slug: string }[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (sidebarRef.current) {
      globalEngine.promoteToGPULayer(sidebarRef.current);
    }
    return () => {
      if (sidebarRef.current) {
        globalEngine.removeFromGPULayer(sidebarRef.current);
      }
    };
  }, []);

  useEffect(() => {
    Promise.all([
      categoryApi.getTree().then((r: any) => setCategories(r.data || [])),
      tagApi.getList().then((r: any) => setTags(r.data || [])),
      articleApi.getList({ limit: 5, status: 'published' }).then((r: any) => {
        setRecentArticles((r.data?.list || []).map((a: any) => ({ id: a.id, title: a.title, slug: a.slug })));
      }),
    ]).catch((err) => console.error('[Sidebar] 初始化数据失败:', err));
  }, []);

  const { expandedKeys, toggle } = useTreeExpansion(['nav', 'categories']);

  const treeData = useMemo<TreeNodeData[]>(() => [
    {
      id: 'nav',
      label: '导航',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      children: [
        { id: 'home', label: '首页', href: '/', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
        { id: 'archives', label: '归档', href: '/archives', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg> },
        { id: 'about', label: '关于', href: '/about', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
      ],
    },
    {
      id: 'categories',
      label: '分类',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      ),
      children: categories.map((cat) => transformCategory(cat)),
    },
    ...(tags.length > 0 ? [{
      id: 'tags',
      label: '标签',
      badge: tags.length,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
      children: tags.slice(0, 12).map((tag) => ({
        id: `tag-${tag.id}`,
        label: tag.name,
        href: `/tag/${tag.slug || tag.id}`,
      })),
    }] : []),
    ...(recentArticles.length > 0 ? [{
      id: 'recent',
      label: '最近文章',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      children: recentArticles.map((article) => ({
        id: `article-${article.id}`,
        label: article.title,
        href: `/post/${article.slug}`,
      })),
    }] : []),
  ], [categories, tags, recentArticles]);

  const handleSelect = (node: TreeNodeData) => {
    if (node.href) {
      navigate(node.href);
      onClose();
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar parallel-sidebar ${open ? 'open' : ''} ${isMounted ? 'mounted' : ''}`}
      role="navigation"
      aria-label="主导航"
      style={{
        contain: 'layout style paint',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="sb-profile profile-section">
        <div
          className="sb-avatar avatar-gpu"
          role="img"
          aria-label="用户头像"
          style={{ contain: 'layout style paint' }}
        >
          <img src={logoImg} alt="Logo" loading="eager" decoding="async" />
        </div>
        <h1 className="sb-title">BLOG</h1>
        <p className="sb-subtitle">Developer / Blogger</p>
        <nav className="sb-social social-nav" aria-label="社交链接">
          <a href="https://github.com" target="_blank" rel="noreferrer" title="GitHub" className="sb-social-link hover-scale-glow social-link-gpu" aria-label="访问GitHub主页">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <a href="/rss.xml" target="_blank" rel="noreferrer" title="RSS" className="sb-social-link hover-scale-glow social-link-gpu" aria-label="订阅RSS feed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368C10.58 4.813 19.199 13.435 19.188 24h4.812C23.987 10.769 13.235.019 0 0v4.812z"/></svg>
          </a>
        </nav>
      </div>

      <ul className="tree-nav tree-nav-gpu" role="tree" aria-label="树形导航">
        {treeData.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            expandedKeys={expandedKeys}
            onToggle={toggle}
            onSelect={handleSelect}
            onClose={onClose}
          />
        ))}
      </ul>

      <div className="sb-footer footer-gpu"><ThemeToggle /></div>
    </aside>
  );
}

function transformCategory(cat: CategoryItem): TreeNodeData {
  return {
    id: cat.id,
    label: cat.name,
    href: `/category/${cat.slug || cat.id}`,
    count: cat._count?.articles,
    children: cat.children?.map(transformCategory),
  };
}
