import { memo, useMemo } from 'react';
import { useTilt3D } from '../hooks/useTilt3D';
import { svgPaths } from './symbols';

interface ArticleCardProps {
  article: {
    id: number; slug: string; title: string; excerpt: string; cover_image?: string;
    categories?: { id: number; name: string; slug?: string }[];
    tags?: { id: number; name: string }[];
    created_at: string; view_count: number;
  };
}

const ArticleCard = ({ article }: ArticleCardProps) => {
  const date = useMemo(() => new Date(article.created_at).toLocaleDateString('zh-CN'), [article.created_at]);
  const firstCat = article.categories?.[0];
  const tiltRef = useTilt3D({ maxTilt: 8, glare: true });

  return (
    <a href={`/post/${article.slug}`} className="ac-link" aria-label={`阅读文章: ${article.title}`}>
      <article ref={tiltRef} className="article-card hover-shine glow-border">
        {article.cover_image ? (
          <div className="ac-cover"><img src={article.cover_image} alt={article.title} loading="lazy" decoding="async" /></div>
        ) : (
          <div className="ac-cover ac-cover-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d={svgPaths.image} />
            </svg>
          </div>
        )}
        <div className="ac-body">
          <h3 className="ac-title">{article.title}</h3>
          <p className="ac-excerpt">{article.excerpt}</p>
          <div className="ac-meta">
            {firstCat && <span className="ac-cat">{firstCat.name}</span>}
            <span className="ac-info">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={svgPaths.search} />
              </svg>
              {article.view_count}
            </span>
            <time className="ac-time">{date}</time>
          </div>
        </div>
      </article>
    </a>
  );
};

export default memo(ArticleCard);
