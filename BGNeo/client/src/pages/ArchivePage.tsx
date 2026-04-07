import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SEO from '../components/SEO';
import Status from '../components/Status';
import PageTransition from '../components/PageTransition';

interface ArchiveItem {
  year: number;
  month: number;
  count: number;
  articles: Array<{
    id: number; title: string; slug: string;
    created_at: string; view_count?: number;
  }>;
}

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export default function ArchivePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  useEffect(() => {
    api.get('/articles/archives').then((res: any) => {
      if (res.success) {
        const data = res.data || [];
        setArchives(data);
        if (data.length > 0) setExpandedYear(data[0].year);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Status type="loading" />;

  const totalArticles = archives.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <SEO
        title={t('nav.archives') || '归档'}
        description="文章归档 - 按时间线浏览所有历史技术文章，涵盖前端开发、后端架构、DevOps 等领域"
        keywords={['文章归档', '时间线', '历史文章', '技术博客', 'Nknaf', '全栈开发']}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        canonicalUrl={typeof window !== 'undefined' ? window.location.href : ''}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: '文章归档',
          description: `共 ${totalArticles} 篇技术文章归档`,
          url: typeof window !== 'undefined' ? window.location.href : '',
          isPartOf: {
            '@type': 'Blog',
            name: "Nknaf's Blog",
            url: typeof window !== 'undefined' ? window.location.origin : ''
          }
        }}
      />

      <div className="archive-page">
        <PageTransition>
          <header className="archive-header">
            <h1 className="archive-title">{t('nav.archives') || '文章归档'}</h1>
            <p className="archive-subtitle">{totalArticles} {t('articleCount') || '篇文章'}</p>
          </header>
          <nav className="timeline" aria-label="文章时间线">
            {archives.length === 0 ? (
              <Status type="empty" description={t('article.noArticles') || '暂无文章'} />
            ) : (
              archives.map((item) => (
                <div key={`${item.year}-${item.month}`} className="timeline-year-group">
                  <button
                    className={`year-toggle ${expandedYear === item.year ? 'expanded' : ''}`}
                    onClick={() => setExpandedYear(expandedYear === item.year ? null : item.year)}
                    aria-expanded={expandedYear === item.year}
                  >
                    <span className="year-label">{item.year}年</span>
                    <span className="year-count">{archives.filter(a => a.year === item.year).reduce((s, a) => s + a.count, 0)}篇</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="toggle-arrow">
                      <polyline points={expandedYear === item.year ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                    </svg>
                  </button>
                  {expandedYear === item.year && (
                    <div className="month-list">
                      {archives.filter(a => a.year === item.year).sort((a, b) => b.month - a.month).map((month) => (
                        <div key={month.month} className="timeline-month-group">
                          <div className="timeline-month-header">
                            <span className="month-dot"></span>
                            <span className="month-name">{MONTH_NAMES[month.month - 1]}</span>
                            <span className="month-count">{month.count}篇</span>
                          </div>
                          <ol className="timeline-articles">
                            {month.articles.map((article) => (
                              <li key={article.id} className="timeline-article-item">
                                <button onClick={() => navigate(`/post/${article.slug}`)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                  <span className="timeline-dot"></span>
                                  <time className="timeline-date" dateTime={article.created_at}>
                                    {new Date(article.created_at).getDate()}日
                                  </time>
                                  <span className="timeline-title">{article.title}</span>
                                  {article.view_count !== undefined && (<span className="timeline-views">{article.view_count}阅</span>)}
                                </button>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </nav>
        </PageTransition>
      </div>
    </>
  );
}
