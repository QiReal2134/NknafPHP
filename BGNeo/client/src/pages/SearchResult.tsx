import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { articleApi } from '../services/api';
import SEO from '../components/SEO';
import ArticleCard from '../components/ArticleCard';
import Status from '../components/Status';

const SEARCH_HISTORY_KEY = 'bgneo_search_history';
const MAX_HISTORY = 8;
const HOT_SEARCHES = ['React', 'TypeScript', 'Node.js', '前端工程化', '性能优化'];

export default function SearchResult() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState(q);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      articleApi.search(q).then((res: any) => setResults(res.data || [])).catch(() => setResults([])).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed });
    addToHistory(trimmed);
  }

  function addToHistory(term: string) {
    setHistory(prev => {
      const filtered = prev.filter(h => h !== term);
      const updated = [term, ...filtered].slice(0, MAX_HISTORY);
      try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function removeHistoryItem(item: string) {
    setHistory(prev => {
      const updated = prev.filter(h => h !== item);
      try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch {}
  }

  function quickSearch(term: string) {
    setKeyword(term);
    setSearchParams({ q: term });
    addToHistory(term);
    inputRef.current?.focus();
  }

  function highlightText(text: string): string {
    if (!q.trim()) return text;
    try { return text.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>'); }
    catch { return text; }
  }

  return (
    <>
      <SEO
        title={q ? `${q} - ${t('common.search')}` : t('common.search')}
        description={q ? `搜索结果: ${q} - 在 Nknaf's Blog 中找到 ${results.length} 篇相关文章` : '在 Nknaf 技术博客中搜索文章，涵盖前端 React/Vue、后端 Node.js/Python 等技术内容'}
        keywords={[q, '搜索', '技术博客', '前端开发', '后端开发', '全栈']}
        url={pageUrl}
        canonicalUrl={pageUrl}
        noIndex={false}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SearchResultsPage',
          name: `${q} - 搜索结果`,
          description: `关于 "${q}" 的搜索结果`,
          url: pageUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: '/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }}
      />
      <div className="search-page">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrap">
            <svg className="search-input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input ref={inputRef} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={t('nav.searchPlaceholder')} className="search-input" />
            {keyword && (
              <button type="button" onClick={() => { setKeyword(''); inputRef.current?.focus(); }} className="search-clear">x</button>
            )}
          </div>
          <button type="submit" className="search-btn">{t('common.search')}</button>
        </form>

        {!q.trim() ? (
          <div className="search-empty-state">
            <Status type="empty" description="搜索文章、标签或分类" actionLabel="" />

            {HOT_SEARCHES.length > 0 && (
              <div className="hot-searches">
                <h4>热门搜索</h4>
                <div className="hot-tags">
                  {HOT_SEARCHES.map(term => (
                    <button key={term} type="button" onClick={() => quickSearch(term)} className="hot-tag">{term}</button>
                  ))}
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div className="search-history">
                <div className="history-header">
                  <h4>搜索历史</h4>
                  <button type="button" onClick={clearHistory} className="clear-history-btn">清空</button>
                </div>
                <ul className="history-list">
                  {history.map(item => (
                    <li key={item}>
                      <button type="button" onClick={() => quickSearch(item)} className="history-item">{item}</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeHistoryItem(item); }} className="history-remove">x</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <>
            {q && !loading && (
              <p className="search-result-count">找到 <strong>{results.length}</strong> 篇关于 "<strong>{q}</strong>" 的文章</p>
            )}
            {loading ? <Status type="loading" /> : results.length === 0 ? (
              <div className="search-no-result">
                <Status type="empty" description={`没有找到与 "${q}" 相关的文章`} />
                <div className="hot-searches">
                  <h4>试试这些关键词</h4>
                  <div className="hot-tags">
                    {HOT_SEARCHES.slice(0, 5).map(term => (
                      <button key={term} type="button" onClick={() => quickSearch(term)} className="hot-tag">{term}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="article-grid search-results">
                {results.map((a: any) => <ArticleCard key={a.id} article={{ ...a, excerpt: highlightText(a.excerpt || ''), title: highlightText(a.title) }} />)}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
