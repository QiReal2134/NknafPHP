import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articleApi, categoryApi, tagApi } from '../services/api';
import PopularArticles from './PopularArticles';
import FriendLinks from './FriendLinks';

const logoImg = '/logo.png';

export default function RightSidebar() {
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    articleApi.getList({ limit: 5 }).then((r: any) => setRecentArticles(r.data?.list || [])).catch(() => {});
    categoryApi.getTree().then((r: any) => setCategories(r.data || [])).catch(() => {});
    tagApi.getList().then((r: any) => {
      const list = Array.isArray(r.data) ? r.data : (r.data?.list || []);
      setTags(list.slice(0, 15));
    }).catch(() => {});
  }, []);

  return (
    <aside className="right-sidebar">
      <section className="sidebar-card">
        <div className="profile-mini">
          <img src={logoImg} alt="Avatar" className="profile-avatar-placeholder" />
          <h3>Nknaf</h3>
          <p>Developer / Blogger / Open Source Lover</p>
        </div>
      </section>

      <PopularArticles />

      {tags.length > 0 && (
        <section className="sidebar-card">
          <h4 className="sidebar-title">热门标签</h4>
          <div className="tag-cloud">
            {tags.map((t: any) => (
              <Link key={t.id} to={`/tag/${t.slug}`} className="tag-cloud-item">{t.name}</Link>
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="sidebar-card">
          <h4 className="sidebar-title">分类</h4>
          <ul className="category-list">
            {(Array.isArray(categories) ? categories : []).map((c: any) => (
              <li key={c.id}><Link to={`/category/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </section>
      )}

      {recentArticles.length > 0 && (
        <section className="sidebar-card">
          <h4 className="sidebar-title">最新文章</h4>
          <ul className="recent-list">
            {recentArticles.map((a: any) => (
              <li key={a.id}>
                <Link to={`/post/${a.slug}`}>{a.title}</Link>
                <time>{new Date(a.created_at).toLocaleDateString('zh-CN')}</time>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FriendLinks />
    </aside>
  );
}
