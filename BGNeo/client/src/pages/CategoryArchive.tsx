import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { articleApi, categoryApi } from '../services/api';
import SEO from '../components/SEO';
import ArticleCard from '../components/ArticleCard';
import Breadcrumb from '../components/Breadcrumb';
import Status from '../components/Status';

export default function CategoryArchive() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [articles, setArticles] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      categoryApi.getList().then((r: any) => (r.data || []).find((c: any) => c.slug === slug) || null),
      articleApi.getList({ categoryId: slug }).then((r: any) => r.data?.list || [])
    ]).then(([cat, list]) => { setCategory(cat); setArticles(list); }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const categoryName = category?.name || slug;
  const categoryUrl = typeof window !== 'undefined' ? `${window.location.origin}/category/${slug}` : '';

  return (
    <>
      <SEO
        title={`${categoryName} - ${t('nav.categories')}`}
        description={category?.description || `浏览 ${categoryName} 分类下的所有技术文章 - Nknaf's Blog`}
        keywords={[categoryName, '分类', '技术文章', '博客', '前端', '后端']}
        url={categoryUrl}
        canonicalUrl={categoryUrl}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: categoryName,
          description: category?.description || `${categoryName} 分类归档`,
          url: categoryUrl,
          isPartOf: {
            '@type': 'Blog',
            name: "Nknaf's Blog",
            url: typeof window !== 'undefined' ? window.location.origin : ''
          }
        }}
      />
      <Breadcrumb items={[{ label: t('nav.categories'), path: '/category' }, { label: categoryName }]} />
      <div className="archive-page">
        <h1 className="archive-title">{categoryName}</h1>
        {category?.description && <p className="archive-desc">{category.description}</p>}
        {loading ? <Status type="loading" /> : articles.length > 0 ? <div className="article-grid">{articles.map(a => <ArticleCard key={a.id} article={a} />)}</div> : <p style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>}
      </div>
    </>
  );
}
