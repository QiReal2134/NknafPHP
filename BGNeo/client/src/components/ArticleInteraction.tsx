import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useToast } from './Toast';

interface ArticleInteractionProps {
  articleId: number;
  title: string;
  slug: string;
}

export default function ArticleInteraction({ articleId, title, slug }: ArticleInteractionProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/articles/${articleId}/like-status`).then((res: any) => {
      if (res.success) {
        setLiked(res.data?.liked || false);
        setLikeCount(res.data?.count || 0);
      }
    }).catch(() => {});
  }, [articleId]);

  const handleLike = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res: any = await api.post(`/articles/${articleId}/like`);
      if (res.success) {
        setLiked(res.data?.liked);
        setLikeCount(res.data?.count);
        addToast(res.data?.liked ? '点赞成功' : '已取消点赞', 'success');
      }
    } catch {
      addToast('操作失败，请重试', 'error');
    }
    setLoading(false);
  }, [articleId, loading, addToast]);

  const handleShare = useCallback(async (platform: string) => {
    const url = `${window.location.origin}/post/${slug}`;
    const text = title;

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      weibo: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      qq: `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      copy: '',
    };

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        addToast(t('article.linkCopied') || '链接已复制到剪贴板', 'success');
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        addToast(t('article.linkCopied') || '链接已复制到剪贴板', 'success');
      }
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=500');
    }
  }, [title, slug, t, addToast]);

  return (
    <div className="article-interaction" role="group" aria-label="文章互动">
      <button
        className={`interaction-btn like-btn ${liked ? 'liked' : ''}`}
        onClick={handleLike}
        disabled={loading}
        title={liked ? '取消点赞' : '点赞'}
        aria-pressed={liked}
        aria-label={`${liked ? '取消' : ''}点赞, 当前${likeCount}人点赞`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        <span>{likeCount}</span>
      </button>

      <div className="share-dropdown">
        <button className="interaction-btn share-btn" title={t('article.share') || '分享'} aria-label="分享文章" aria-haspopup="true" aria-expanded="false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
        <div className="share-menu">
          <button onClick={() => handleShare('twitter')} className="share-item">Twitter / X</button>
          <button onClick={() => handleShare('weibo')} className="share-item">微博</button>
          <button onClick={() => handleShare('qq')} className="share-item">QQ</button>
          <button onClick={() => handleShare('copy')} className="share-item">{t('article.copyLink') || '复制链接'}</button>
        </div>
      </div>
    </div>
  );
}
