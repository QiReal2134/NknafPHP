import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface FriendLink {
  id: number;
  name: string;
  url: string;
  logo?: string;
  description?: string;
}

export default function FriendLinks() {
  const { t } = useTranslation();
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/friend-links').then((res: any) => {
      if (res.success) setLinks(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (links.length === 0) return null;

  return (
    <div className="friend-links">
      <h3 className="sidebar-title">{t('common.friendLinks') || '友情链接'}</h3>
      <div className="friend-link-list">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="friend-link-item"
            title={link.description || link.name}
          >
            {link.logo && <img src={link.logo} alt={link.name} className="friend-link-logo" loading="lazy" />}
            <span className="friend-link-name">{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
