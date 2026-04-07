import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { commentApi } from '../../services/api';
import { useToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatRelativeTime } from '../../utils/timeUtils';

export default function CommentManage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState<{ id: number; status: string } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [fadingId, setFadingId] = useState<number | null>(null);

  const fetchComments = useCallback(() => {
    setLoading(true);
    commentApi.getPending()
      .then((r: any) => setComments(r.data?.items || []))
      .catch(() => addToast(t('common.loadFailed') || '加载失败，请重试', 'error'))
      .finally(() => setLoading(false));
  }, [t, addToast]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  function handleReview(id: number, status: string) {
    if (reviewing) return;
    setReviewId({ id, status });
  }

  async function confirmReview() {
    if (!reviewId || reviewing) return;
    setReviewing(true);
    try {
      await commentApi.review(reviewId.id, reviewId.status);
      setFadingId(reviewId.id);
      setTimeout(() => {
        setComments(prev => prev.filter(c => c.id !== reviewId!.id));
        setFadingId(null);
      }, 350);
      addToast(reviewId.status === 'approved' ? (t('comment.approved') || '评论已通过') : (t('comment.rejected') || '评论已拒绝'), 'success');
    } catch {
      addToast(t('common.operationFailed') || '操作失败', 'error');
    } finally {
      setReviewing(false);
      setReviewId(null);
    }
  }

  return (
    <>
      <Helmet><title>{t('admin.comments')} - Admin</title></Helmet>
      <div className="admin-page">
        <div className="comment-manage-header">
          <h1>
            {t('admin.comments')}
            {!loading && comments.length > 0 && (
              <span className="comment-count-badge">{comments.length}</span>
            )}
          </h1>
          <div className="comment-header-actions">
            <button onClick={fetchComments} className={`btn-refresh ${loading ? 'loading' : ''}`} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              {t('common.refresh') || '刷新'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner-wrapper"><div className="spinner"/></div>
        ) : comments.length > 0 ? (
          <table className="comment-manage-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('comment.title') || '评论内容'}</th>
                <th>{t('article.title') || '文章'}</th>
                <th>{t('comment.nickname') || '昵称'}</th>
                <th>{t('common.date') || '时间'}</th>
                <th>{t('common.edit') || '操作'}</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(c => (
                <tr key={c.id} className={fadingId === c.id ? 'row-fading' : ''}>
                  <td className="comment-id-cell">#{c.id}</td>
                  <td>
                    <div className="comment-cell-content">
                      <span className="comment-cell-text">{c.content}</span>
                      <div className="comment-tooltip">{c.content}</div>
                    </div>
                  </td>
                  <td>
                    {c.article_title ? (
                      <Link to={`/post/${c.article_slug}`} target="_blank" className="comment-article-link">{c.article_title}</Link>
                    ) : (
                      <span className="comment-time-cell">ID: {c.article_id}</span>
                    )}
                  </td>
                  <td className="comment-nickname-cell">{c.nickname || (t('comment.anonymous') || '匿名')}</td>
                  <td className="comment-time-cell">{formatRelativeTime(c.created_at)}</td>
                  <td>
                    <div className="comment-action-group">
                      <button
                        onClick={() => handleReview(c.id, 'approved')}
                        className="btn-approve"
                        disabled={reviewing}
                      >
                        {t('comment.approve') || '通过'}
                      </button>
                      <button
                        onClick={() => handleReview(c.id, 'rejected')}
                        className="btn-reject"
                        disabled={reviewing}
                      >
                        {t('comment.reject') || '拒绝'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="comment-empty-state">
            <svg className="comment-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
              <line x1="12" y1="7" x2="12" y2="13" />
            </svg>
            <p className="comment-empty-title">{t('comment.noComments') || '暂无待审核评论'}</p>
            <p className="comment-empty-desc">{t('comment.emptyDesc') || '所有评论均已处理完毕'}</p>
          </div>
        )}

        <ConfirmDialog
          open={reviewId !== null}
          title={reviewId?.status === 'approved' ? (t('comment.approveTitle') || '通过评论') : (t('comment.rejectTitle') || '拒绝评论')}
          message={reviewId?.status === 'approved'
            ? (t('comment.approveConfirm') || '确定要通过这条评论吗？通过后将公开展示。')
            : (t('comment.rejectConfirm') || '确定要拒绝这条评论吗？拒绝后该评论将不会显示。')
          }
          confirmText={t('common.confirm') || '确认'}
          cancelText={t('common.cancel') || '取消'}
          danger={reviewId?.status === 'rejected'}
          onConfirm={confirmReview}
          onCancel={() => setReviewId(null)}
        />
      </div>
    </>
  );
}
