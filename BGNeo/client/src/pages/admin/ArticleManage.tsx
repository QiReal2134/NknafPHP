import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { articleApi } from '../../services/api';
import { useToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { CSSProperties } from 'react';

export default function ArticleManage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: pageSize };
    if (keyword.trim()) {
      params.q = keyword.trim();
      params.status = '';
    } else {
      params.status = 'published';
    }
    articleApi.getList(params).then((r: any) => {
      let list = r.data?.items || [];
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        list = list.filter((a: any) => a.title?.toLowerCase().includes(kw) || a.slug?.toLowerCase().includes(kw));
        setTotal(list.length);
      } else {
        setTotal(r.data?.pagination?.total || 0);
      }
      setArticles(list);
    }).catch(() => {}).finally(() => { setLoading(false); setTimeout(() => setMounted(true), 100); });
  }, [page, keyword]);

  function handleSearch() {
    if (page === 1) {
      setLoading(true);
      const params: Record<string, any> = { page: 1, limit: pageSize };
      if (keyword.trim()) params.q = keyword.trim();
      articleApi.getList(params).then((r: any) => {
        let list = r.data?.items || [];
        if (keyword.trim()) {
          const kw = keyword.toLowerCase();
          list = list.filter((a: any) => a.title?.toLowerCase().includes(kw) || a.slug?.toLowerCase().includes(kw));
        }
        setArticles(list);
        setTotal(list.length);
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      setPage(1);
    }
  }

  async function handleDelete(id: number) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (deleteId === null) return;
    try {
      await articleApi.delete(deleteId);
      setArticles(prev => prev.filter(a => a.id !== deleteId));
      setTotal(t => Math.max(0, t - 1));
      addToast(t('admin.deleteSuccess'), 'success');
    } catch {
      addToast(t('admin.deleteFailed'), 'error');
    } finally {
      setDeleteId(null);
    }
  }

  async function changeStatus(id: number, status: string) {
    try {
      await articleApi.update(id, { status });
      setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      addToast(t('admin.updateSuccess'), 'success');
    } catch {
      addToast(t('admin.updateFailed'), 'error');
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <>
      <Helmet><title>{t('admin.articles')} - Admin</title></Helmet>
      <div className={`admin-page ${mounted ? 'page-mounted' : ''}`}>
        <div className="page-header enhanced-header">
          <h1>
            <span className="header-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </span>
            {t('admin.articles')}
            <span className="total-badge">{total}</span>
          </h1>
          <div className="article-manage-actions">
            <div className="article-search-box enhanced-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input value={keyword} onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={t('admin.searchPlaceholder') || '搜索标题/slug...'}
                className="article-search-input" />
              {keyword && (
                <button onClick={() => { setKeyword(''); setPage(1); }} className="search-clear-btn" title="清除">x</button>
              )}
              <button onClick={handleSearch} className="article-search-btn">{t('common.search') || '搜索'}</button>
            </div>
            <Link to="/admin/article/new" className="btn-primary btn-success create-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {t('common.publish') || '新建'}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-state-enhanced">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-row">
                <div className="sk-cell sk-id" />
                <div className="sk-cell sk-title" />
                <div className="sk-cell sk-slug" />
                <div className="sk-cell sk-status" />
                <div className="sk-cell sk-views" />
                <div className="sk-cell sk-actions" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <>
            <table className="dash-table manage-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('article.title')}</th>
                  <th>Slug</th>
                  <th>{t('article.status')}</th>
                  <th>{t('article.views')}</th>
                  <th>{t('common.edit')}</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a, idx) => (
                  <tr key={a.id} style={{ '--row-index': idx } as CSSProperties}>
                    <td><span className="cell-id">#{a.id}</span></td>
                    <td className="title-cell">
                      <Link to={`/post/${a.slug}`} target="_blank">{a.title}</Link>
                    </td>
                    <td className="cell-mono cell-slug">{a.slug}</td>
                    <td>
                      <select value={a.status} onChange={e => changeStatus(a.id, e.target.value)}
                        className="status-select enhanced-select">
                        <option value="draft">{t('common.draft')}</option>
                        <option value="published">{t('common.publish')}</option>
                        <option value="archived">{t('common.archived')}</option>
                      </select>
                    </td>
                    <td><span className="view-count-cell">{a.view_count || 0}</span></td>
                    <td>
                      <div className="action-btns enhanced-actions">
                        <Link to={`/admin/article/edit/${a.id}`} className="action-edit-link">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          {t('common.edit')}
                        </Link>
                        <button onClick={() => handleDelete(a.id)} className="btn-danger-sm enhanced-delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-pagination enhanced-pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="pagination-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                {t('common.prev') || '上一页'}
              </button>
              <div className="pagination-info">
                <span className="current-page">{page}</span>
                <span className="page-divider">/</span>
                <span>{totalPages}</span>
              </div>
              <button disabled={page >= totalPages || articles.length < pageSize} onClick={() => setPage(p => p + 1)} className="pagination-btn">
                {t('common.next') || '下一页'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state-enhanced">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
            <p>{t('article.noArticles')}</p>
          </div>
        )}

        <ConfirmDialog
          open={deleteId !== null}
          title={t('admin.confirmDelete') || '确认删除'}
          message={t('admin.deleteWarning') || '确定要删除这篇文章吗？此操作不可撤销。'}
          confirmText={t('common.confirm') || '确认'}
          cancelText={t('common.cancel') || '取消'}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </>
  );
}
