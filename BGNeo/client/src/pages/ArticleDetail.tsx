import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { articleApi, commentApi, invalidateCache } from '../services/api';
import SEO from '../components/SEO';
import Status from '../components/Status';
import CommentSection from '../components/CommentSection';
import ArticleInteraction from '../components/ArticleInteraction';
import ReadingToolbar from '../components/ReadingToolbar';
import TableOfContents from '../components/TableOfContents';

const MarkdownContent = lazy(() => import('./MarkdownContent'));

interface ArticleDetailData {
  id: number; title: string; slug: string; content: string;
  excerpt?: string; cover_image?: string; published_at?: string;
  updated_at?: string; created_at?: string;
  view_count?: number; categories?: { id: number; name: string; slug?: string }[];
  tags?: { id: number; name: string; slug?: string }[];
}

interface CommentItem {
  id: number; content: string; nickname: string | null;
  user_id: number | null; status: string;
  created_at: string; replies?: CommentItem[];
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [article, setArticle] = useState<ArticleDetailData | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [isImmersive, setIsImmersive] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setLoadErr('');
    articleApi.getBySlug(slug).then((res: any) => {
      setArticle(res.data || null);
      if (res.data?.id) {
        commentApi.getList(res.data.id).then((cr: any) => {
          setComments(cr.data || []);
        }).catch(() => {});
      }
    }).catch(() => { setLoadErr('文章加载失败'); }).finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (isImmersive) {
      document.body.classList.add('immersive-mode');
    } else {
      document.body.classList.remove('immersive-mode');
    }
    return () => { document.body.classList.remove('immersive-mode'); };
  }, [isImmersive]);

  if (loading) return <Status type="loading" />;
  if (loadErr || !article) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>404</h2>
        <p>{loadErr || '文章不存在'}</p>
        <a href="/">{t('common.back')}</a>
      </div>
    );
  }

  const handleCommentAdded = () => {
    if (!article?.id) return;
    invalidateCache(`/articles/${article.id}/comments`);
    commentApi.getList(article.id).then((cr: any) => setComments(cr.data || []));
  };

  const categoryNames = (article.categories || []).map(c => c.name);
  const tagNames = (article.tags || []).map(tg => tg.name);
  const articleUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${slug}` : '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const contentStyle = { fontSize: `${fontSize}px` };
  const readingTime = Math.max(1, Math.ceil(article.content.length / 400));

  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt || `阅读《${article.title}》- Nknaf's Blog 技术博客文章`}
        keywords={tagNames.length > 0 ? [...categoryNames, ...tagNames] : categoryNames}
        ogImage={article.cover_image}
        type="article"
        url={articleUrl}
        canonicalUrl={articleUrl}
        publishedTime={article.published_at || article.created_at}
        modifiedTime={article.updated_at || undefined}
        section={categoryNames[0]}
        tags={tagNames}
        authorName="Nknaf"
        readingTime={readingTime}
        breadcrumb={[
          { name: '首页', url: baseUrl },
          { name: article.title, url: articleUrl }
        ]}
      />

      <div className={`reading-wrapper ${isImmersive ? 'immersive-active' : ''}`}>
        <ReadingToolbar
          onFontSizeChange={setFontSize}
          onImmersiveToggle={() => setIsImmersive(prev => !prev)}
          isImmersive={isImmersive}
        />

        {isImmersive ? (
          <article className="article-detail" style={contentStyle}>
            <div className={`article-content markdown-body immersive-content`} style={contentStyle}>
              <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>}>
                <MarkdownContent content={article.content} />
              </Suspense>
            </div>
          </article>
        ) : (
          <div className="article-detail-wrapper">
            <TableOfContents content={article.content} />
            <article className="article-detail" itemScope itemType="https://schema.org/BlogPosting">
              <header className="article-header">
                <h1 className="article-detail-title" itemProp="headline">{article.title}</h1>
                <div className="article-detail-meta">
                  <time dateTime={article.published_at || article.created_at || ''} itemProp="datePublished">
                    {new Date(article.published_at || article.created_at || '').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  {(article.categories || []).map((c) => <a key={c.id} href={`/category/${c.slug}`} className="tag-badge">{c.name}</a>)}
                  <span className="reading-time" itemProp="timeRequired">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {Math.max(1, Math.ceil(article.content.length / 400))} min
                  </span>
                </div>
              </header>

              {article.cover_image && (
                <img src={article.cover_image} alt={article.title} className="article-cover-img" loading="lazy" itemProp="image" />
              )}

              <div className="article-content markdown-body" itemProp="articleBody" style={contentStyle}>
                <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>}>
                  <MarkdownContent content={article.content} />
                </Suspense>
              </div>

              <footer className="article-footer">
                <ArticleInteraction articleId={article.id} title={article.title} slug={article.slug} />
                <div className="article-tags" itemProp="keywords">
                  {(article.tags || []).map((tg) => <a key={tg.id} href={`/tag/${tg.slug}`} className="tag-badge tag-outline">{tg.name}</a>)}
                </div>
                <nav className="article-nav">
                  <a href="/" className="article-nav-link nav-prev">
                    <span className="nav-label">返回</span>
                    <span className="nav-title">首页</span>
                  </a>
                  <a href="/" className="article-nav-link nav-next">
                    <span className="nav-label">更多</span>
                    <span className="nav-title">全部文章</span>
                  </a>
                </nav>
              </footer>

              {article.id && (
                <CommentSection
                  articleId={article.id}
                  comments={comments}
                  onCommentAdded={handleCommentAdded}
                />
              )}
            </article>
          </div>
        )}
      </div>
    </>
  );
}
