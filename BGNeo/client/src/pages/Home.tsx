import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articleApi } from '../services/api';
import SEO from '../components/SEO';
import ArticleCard from '../components/ArticleCard';
import Pagination from '../components/Pagination';
import Status from '../components/Status';
import PageTransition from '../components/PageTransition';
import AnimatedText from '../components/AnimatedText';

interface ArticleItem {
  id: number; slug: string; title: string; excerpt: string;
  cover_image?: string; categories?: { id: number; name: string }[];
  tags?: { id: number; name: string }[]; created_at: string; view_count: number;
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const totalPages = Math.ceil(total / pageSize);
  const currentUrl = `${baseUrl}/?page=${page}`;

  useEffect(() => {
    setLoading(true);
    articleApi.getList({ page, limit: pageSize, status: 'published' })
      .then((res: any) => {
        setArticles(res.data?.list || []);
        setTotal(res.data?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <>
      <SEO
        title={t('nav.home')}
        description="Nknaf 个人技术博客首页 - 分享前端 React/Vue、后端 Node.js/Python 开发经验与深度思考"
        keywords={['技术博客', '前端开发', '后端开发', 'React', 'Vue', 'Node.js', 'TypeScript', '全栈开发']}
        url={currentUrl}
        canonicalUrl={page === 1 ? baseUrl : currentUrl}
        noIndex={page > 1}
        structuredData={page === 1 ? {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: "Nknaf's Blog",
          description: '个人技术博客，专注前端后端开发经验分享',
          url: baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: '/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          },
          blogPost: []
        } : null}
      />
      {page > 1 && <Helmet><link rel="prev" href={`${baseUrl}/?page=${page - 1}`} /><link rel="next" href={page < totalPages ? `${baseUrl}/?page=${page + 1}` : ''} /></Helmet>}
      <div className="home-page">
        <PageTransition>
          <header className="home-topbar" role="banner">
            <div className="topbar-left">
              <button className="topbar-icon anim-elastic" title="设置" aria-label="设置">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06-.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </button>
            </div>
            <button className="topbar-search-btn hover-scale-glow" onClick={() => navigate('/search')} aria-label="搜索文章">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <span className="topbar-title"><AnimatedText text={t('common.latestArticles')} mode="words" stagger={60} /></span>
          </header>
          <main className="home-content" role="main">
            {loading ? (
              <Status type="skeleton" />
            ) : articles.length === 0 ? (
              <Status type="empty" description={t('article.noArticles')} />
            ) : (
              <>
                <div className="article-list" itemScope itemType="https://schema.org/Blog">
                  {articles.map((a, i) => (
                    <article key={a.id} className="stagger-child" style={{ animationDelay: `${i * 70}ms` }}>
                      <ArticleCard article={a} />
                    </article>
                  ))}
                </div>
                <Pagination current={page} total={total} pageSize={pageSize} onChange={(p) => setSearchParams({ page: String(p) })} />
              </>
            )}
          </main>
        </PageTransition>
      </div>
    </>
  );
}
