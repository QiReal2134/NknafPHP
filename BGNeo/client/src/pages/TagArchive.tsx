import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { articleApi, tagApi } from '../services/api';
import SEO from '../components/SEO';
import ArticleCard from '../components/ArticleCard';
import Breadcrumb from '../components/Breadcrumb';
import Status from '../components/Status';

export default function TagArchive() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [articles, setArticles] = useState<any[]>([]);
  const [tag, setTag] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      tagApi.getList().then((r: any) => { const tags = r.data || []; return tags.find((tg: any) => tg.slug === slug) || tags.find((tg: any) => tg.name === slug) || null; }),
      articleApi.getList({ tagId: slug }).then((r: any) => r.data?.items || [])
    ]).then(([tg, list]) => { setTag(tg); setArticles(list); }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const tagName = tag?.name || slug;
  const tagUrl = typeof window !== 'undefined' ? `${window.location.origin}/tag/${slug}` : '';

  return (
    <>
      <SEO
        title={`${tagName} - ${t('nav.tags')}`}
        description={`浏览 ${tagName} 标签相关的所有技术文章 - Nknaf's Blog`}
        keywords={[tagName, '标签', '技术文章', '博客', '前端', '后端']}
        url={tagUrl}
        canonicalUrl={tagUrl}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: tagName,
          description: `${tagName} 标签归档`,
          url: tagUrl,
          isPartOf: {
            '@type': 'Blog',
            name: "Nknaf's Blog",
            url: typeof window !== 'undefined' ? window.location.origin : ''
          }
        }}
      />
      <Breadcrumb items={[{ label: t('nav.tags'), path: '/tag' }, { label: tagName }]} />
      <div className="archive-page">
        <div className="tag-header"><span className="tag-badge tag-large">{tagName}</span></div>
        {loading ? <Status type="loading" /> : articles.length > 0 ? <div className="article-grid">{articles.map(a => <ArticleCard key={a.id} article={a} />)}</div> : <p style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>}
      </div>
    </>
  );
}
