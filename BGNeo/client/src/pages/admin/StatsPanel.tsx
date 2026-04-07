import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface StatData {
  overview: {
    total_articles: number;
    draft_articles: number;
    total_comments: number;
    pending_comments: number;
    total_categories: number;
    total_tags: number;
    total_views: number;
    total_likes: number;
  };
  articlesByMonth: Array<{ month: string; count: number }>;
  commentsByStatus: Array<{ status: string; count: number }>;
  topArticles: Array<{ id: number; title: string; view_count: number; slug: string }>;
  categoryStats: Array<{ name: string; slug: string; count: number }>;
}

export default function StatsPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/statistics').then((res: any) => {
      if (res.success) setData(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="stats-loading">加载统计数据...</div>;
  if (!data) return null;

  const ov = data.overview;

  return (
    <div className="stats-panel">
      <h3 className="stats-title">{t('admin.statistics') || '数据统计'}</h3>

      <div className="stats-grid">
        <StatCard label={t('admin.totalArticles') || '总文章数'} value={ov.total_articles} color="var(--accent-primary)" />
        <StatCard label="草稿" value={ov.draft_articles} color="var(--accent-warning)" />
        <StatCard label={t('admin.totalComments') || '评论数'} value={ov.total_comments} color="var(--accent-secondary)" />
        <StatCard label="待审核" value={ov.pending_comments} color="var(--accent-danger)" />
        <StatCard label="分类" value={ov.total_categories} color="var(--stat-categories)" />
        <StatCard label="标签" value={ov.total_tags} color="var(--stat-tags)" />
        <StatCard label="总浏览" value={ov.total_views || 0} color="var(--stat-views)" />
        <StatCard label="获赞" value={ov.total_likes} color="var(--stat-likes)" />
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h4 className="chart-title">月度发布趋势</h4>
          {(data.articlesByMonth?.length ?? 0) > 0 ? (
            <BarChart data={[...(data.articlesByMonth || [])].reverse()} />
          ) : (
            <p className="no-data">暂无数据</p>
          )}
        </div>

        <div className="chart-box">
          <h4 className="chart-title">评论状态分布</h4>
          {(data.commentsByStatus?.length ?? 0) > 0 ? (
            <DonutChart data={data.commentsByStatus || []} />
          ) : (
            <p className="no-data">暂无数据</p>
          )}
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-box full-width">
          <h4 className="chart-title">热门文章 TOP 6</h4>
          {(data.topArticles?.length ?? 0) > 0 ? (
            <div className="top-articles-list">
              {data.topArticles.map((article, idx) => (
                <div key={article.id} className="top-article-item">
                  <span className={`top-rank ${idx < 3 ? 'top' : ''}`}>{idx + 1}</span>
                  <span className="top-title">{article.title}</span>
                  <span className="top-views">{article.view_count}次</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="stats-panel-card">
      <div className="stat-value" style={{ color }}>{value.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function BarChart({ data }: { data: Array<{ month: string; count: number }> }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bar-chart">
      <div className="bar-chart-bars">
        {data.map((item) => {
          const heightPercent = (item.count / maxCount) * 100;
          return (
            <div key={item.month} className="bar-col">
              <div
                className="bar-fill"
                style={{ height: `${heightPercent}%` }}
                title={`${item.month}: ${item.count}篇`}
              >
                <span className="bar-tooltip">{item.count}</span>
              </div>
              <span className="bar-label">{item.month.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutChart({ data }: { data: Array<{ status: string; count: number }> }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  let cumulativePercent = 0;
  const colors: Record<string, string> = {
    approved: 'var(--accent-success)',
    pending: 'var(--accent-warning)',
    rejected: 'var(--accent-danger)',
  };

  const statusLabels: Record<string, string> = {
    approved: '已通过',
    pending: '待审核',
    rejected: '已拒绝',
  };

  return (
    <div className="donut-chart-wrapper">
      <svg viewBox="0 0 120 120" className="donut-svg">
        {data.map((item) => {
          const percent = item.count / total;
          const startAngle = cumulativePercent * 360;
          cumulativePercent += percent;
          const endAngle = cumulativePercent * 360;

          const largeArcFlag = percent > 0.5 ? 1 : 0;
          const x1 = 60 + 45 * Math.cos((startAngle - 90) * Math.PI / 180);
          const y1 = 60 + 45 * Math.sin((startAngle - 90) * Math.PI / 180);
          const x2 = 60 + 45 * Math.cos((endAngle - 90) * Math.PI / 180);
          const y2 = 60 + 45 * Math.sin((endAngle - 90) * Math.PI / 180);

          const pathD = `M 60 60 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          return (
            <path
              key={item.status}
              d={pathD}
              fill={colors[item.status] || 'var(--text-muted)'}
              opacity={0.85}
              className="donut-segment"
            >
              <title>{statusLabels[item.status] || item.status}: {item.count} ({Math.round(percent * 100)}%)</title>
            </path>
          );
        })}
        <circle cx="60" cy="60" r="30" fill="var(--bg-secondary)" />
        <text x="60" y="65" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="600">{total}</text>
      </svg>
      <div className="donut-legend">
        {data.map((item) => (
          <div key={item.status} className="legend-item">
            <span className="legend-dot" style={{ background: colors[item.status] || 'var(--text-muted)' }}></span>
            <span>{statusLabels[item.status] || item.status}</span>
            <span className="legend-count">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}