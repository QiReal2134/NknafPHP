import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { commentApi } from '../services/api';
import { formatRelativeTime } from '../utils/timeUtils';
import { useToast } from './Toast';

interface CommentItem {
  id: number; content: string; nickname: string | null;
  user_id: number | null; status: string;
  created_at: string; replies?: CommentItem[];
}

interface CommentListProps {
  articleId: number;
  comments: CommentItem[];
  onCommentAdded?: () => void;
}

const EMOJI_LIST = ['(笑)', '(哭)', '(怒)', '(赞)', 'OK', '(想)', '(问)', '(偷笑)', '(汗)'];

function CommentItem({ comment, depth = 0, onReply, onSubmitReply }: {
  comment: CommentItem; depth?: number;
  onReply?: (parentId: number, nickname: string) => void;
  onSubmitReply?: (parentId: number, content: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onSubmitReply?.(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch {}
    setSubmitting(false);
  }

  return (
    <div className="comment-item" style={{ marginLeft: depth > 0 ? `${depth * 28}px` : 0 }}>
      <div className="comment-header">
        <span className="comment-author">{comment.nickname || t('comment.anonymous')}</span>
        {comment.user_id && <span className="admin-badge">博主</span>}
        <time className="comment-time" title={new Date(comment.created_at).toLocaleString('zh-CN')}>{formatRelativeTime(comment.created_at)}</time>
      </div>
      <p className="comment-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }} />
      <div className="comment-actions">
        <button onClick={() => { setShowReplyForm(!showReplyForm); onReply?.(comment.id, comment.nickname || ''); }} className="reply-btn">
          {t('comment.reply')}
        </button>
      </div>
      {showReplyForm && (
        <form className="reply-form" onSubmit={handleReplySubmit}>
          <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
            placeholder={`${t('comment.reply')} ${comment.nickname || ''}...`}
            rows={2} disabled={submitting}
            className="reply-textarea" />
          <div className="reply-actions">
            <button type="submit" disabled={submitting} className={`btn-reply-submit ${submitting ? 'submitting' : ''}`}>
              {submitting ? (
                <span className="btn-loading-inline"><i /><i /><i /></span>
              ) : t('comment.submit')}
            </button>
            <button type="button" onClick={() => setShowReplyForm(false)} className="btn-reply-cancel">{t('comment.cancelReply')}</button>
          </div>
        </form>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} onSubmitReply={onSubmitReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ articleId, comments, onCommentAdded }: CommentListProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState(() => localStorage.getItem('comment_nickname') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('comment_email') || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: number; nickname: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !nickname.trim()) return;
    setSubmitting(true);
    try {
      await commentApi.create({
        content, article_id: articleId, nickname, email,
        parent_id: replyTarget?.id ?? 0,
      });
      localStorage.setItem('comment_nickname', nickname);
      if (email.trim()) localStorage.setItem('comment_email', email);
      setContent('');
      setReplyTarget(null);
      setSuccessMsg('评论已提交，等待审核');
      addToast('评论提交成功，等待审核', 'success');
      setTimeout(() => setSuccessMsg(''), 3000);
      onCommentAdded?.();
    } catch (err) {
      addToast(err instanceof Error ? err.message : t('common.error'), 'error');
    }
    setSubmitting(false);
  }

  function handleReply(parentId: number, nick: string) {
    setReplyTarget({ id: parentId, nickname: nick });
    const textarea = document.querySelector('.comment-form-main textarea') as HTMLTextAreaElement;
    textarea?.focus();
  }

  function insertEmoji(emoji: string) {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  }

  const totalComments = comments.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0);

  return (
    <section className="comment-section" id="comments" aria-label="评论区">
      <h3>{t('comment.title')} <span className="comment-count-badge" aria-label={`共${totalComments}条评论`}>{totalComments}</span></h3>

      {successMsg && <div className="comment-success-msg">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="comment-form-main">
        {replyTarget && (
          <div className="reply-target-bar">
            <span>回复 <strong>@{replyTarget.nickname}</strong></span>
            <button type="button" onClick={() => setReplyTarget(null)} className="reply-target-close">x</button>
          </div>
        )}
        <div className="comment-textarea-wrap">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder={t('comment.placeholder')} rows={4}
            className="comment-main-textarea" />
          <div className="comment-toolbar">
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="表情" className="emoji-trigger">
              ^_^
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {EMOJI_LIST.map((em, i) => (
                    <button key={i} type="button" onClick={() => insertEmoji(em)} className="emoji-item">{em}</button>
                  ))}
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="comment-meta-inputs">
          <input value={nickname} onChange={e => setNickname(e.target.value)}
            placeholder={t('comment.nickname')} required className="comment-input-nickname" />
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder={t('comment.email')} type="email" className="comment-input-email" />
        </div>
        <button type="submit" disabled={submitting} className={`comment-submit-btn ${submitting ? 'submitting' : ''}`}>
          {submitting ? (
            <span className="btn-loading-inline"><i /><i /><i /></span>
          ) : t('comment.submit')}
        </button>
      </form>

      {comments.length > 0 ? (
        <div className="comment-list">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} onReply={handleReply} onSubmitReply={async (pid, rContent) => {
              await commentApi.create({ content: rContent, article_id: articleId, nickname, email, parent_id: pid });
              localStorage.setItem('comment_nickname', nickname);
              if (email.trim()) localStorage.setItem('comment_email', email);
              onCommentAdded?.();
            }} />
          ))}
        </div>
      ) : (
        <p className="no-comments">{t('comment.beFirst')}</p>
      )}
    </section>
  );
}
