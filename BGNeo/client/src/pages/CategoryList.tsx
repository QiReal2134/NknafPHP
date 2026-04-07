import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { categoryApi } from '../services/api';
import SEO from '../components/SEO';
import Breadcrumb from '../components/Breadcrumb';
import Status from '../components/Status';

interface CategoryItem {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  _count?: { articles: number };
}

export default function CategoryList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.getList()
      .then((r: any) => setCategories(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCategoryClick = (cat: CategoryItem) => {
    navigate(`/category/${cat.slug || cat.id}`);
  };

  return (
    <>
      <SEO
        title={t('nav.categories')}
        description="浏览所有文章分类 - Nknaf's Blog"
        keywords={['分类', '技术文章', '博客', '前端', '后端']}
        url={typeof window !== 'undefined' ? `${window.location.origin}/category` : ''}
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/category` : ''}
      />
      <Breadcrumb items={[{ label: t('nav.categories') }]} />
      <div className="archive-page">
        <h1 className="archive-title">{t('nav.categories')}</h1>
        <p className="archive-desc">按分类浏览所有技术文章</p>
        {loading ? (
          <Status type="loading" />
        ) : categories.length > 0 ? (
          <div className="category-list grid">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="category-card hover-shine"
                onClick={() => handleCategoryClick(cat)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCategoryClick(cat)}
              >
                <h3 className="category-card-name">{cat.name}</h3>
                {cat.description && <p className="category-card-desc">{cat.description}</p>}
                <span className="category-card-count">{cat._count?.articles || 0} 篇文章</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>
        )}
      </div>
    </>
  );
}
