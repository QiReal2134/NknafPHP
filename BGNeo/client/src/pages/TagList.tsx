import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { tagApi } from '../services/api';
import SEO from '../components/SEO';
import Breadcrumb from '../components/Breadcrumb';
import Status from '../components/Status';

interface TagItem {
  id: number;
  name: string;
  slug?: string;
  _count?: { articles: number };
}

export default function TagList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tagApi.getList()
      .then((r: any) => setTags(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleTagClick = (tag: TagItem) => {
    navigate(`/tag/${tag.slug || tag.id}`);
  };

  return (
    <>
      <SEO
        title={t('nav.tags')}
        description="浏览所有文章标签 - Nknaf's Blog"
        keywords={['标签', '技术文章', '博客', '前端', '后端']}
        url={typeof window !== 'undefined' ? `${window.location.origin}/tag` : ''}
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/tag` : ''}
      />
      <Breadcrumb items={[{ label: t('nav.tags') }]} />
      <div className="archive-page">
        <h1 className="archive-title">{t('nav.tags')}</h1>
        <p className="archive-desc">按标签浏览所有技术文章</p>
        {loading ? (
          <Status type="loading" />
        ) : tags.length > 0 ? (
          <div className="tag-cloud tag-cloud-large">
            {tags.map(tag => (
              <span
                key={tag.id}
                className="tag-badge hover-shine"
                onClick={() => handleTagClick(tag)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleTagClick(tag)}
              >
                {tag.name}
                {tag._count?.articles !== undefined && (
                  <small className="tag-count">({tag._count.articles})</small>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</p>
        )}
      </div>
    </>
  );
}
