import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface PopularArticle {
  id: number;
  title: string;
  slug: string;
  like_count?: number;
  view_count?: number;
}

export default function PopularArticles() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<PopularArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/likes/popular?limit=6').then((res: any) => {
      if (res.success) setArticles(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (articles.length === 0) return null;

  return (
    <div className="popular-articles">
      <h3 className="sidebar-title">{t('common.popular') || '热门文章'}</h3>
      <ul className="popular-list">
        {articles.map((article, index) => (
          <li
            key={article.id}
            className="popular-item"
            onClick={() => navigate(`/post/${article.slug}`)}
          >
            <span className={`popular-rank ${index < 3 ? 'top' : ''}`}>{index + 1}</span>
            <span className="popular-title">{article.title}</span>
            {article.like_count !== undefined && article.like_count > 0 && (
              <span className="popular-likes">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                {article.like_count}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
