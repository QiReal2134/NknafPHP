import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  activeId?: string;
}

export default function TableOfContents({ content, activeId }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const elements = doc.querySelectorAll('h1, h2, h3, h4');
    const items: TocItem[] = [];
    elements.forEach((el, index) => {
      const level = parseInt(el.tagName.charAt(1));
      const text = el.textContent?.trim() || '';
      if (text && level <= 3) {
        items.push({ id: `heading-${index}-${level}`, text, level });
      }
    });
    setHeadings(items);
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc-nav">
      <button className="toc-toggle" onClick={() => setExpanded(!expanded)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform .25s var(--ease-out)', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span>目录</span>
        <span className="toc-count">{headings.length}</span>
      </button>
      {expanded && (
        <ol className="toc-list">
          {headings.map(h => (
            <li key={h.id} className={`toc-item toc-level-${h.level} ${activeId === h.id ? 'toc-active' : ''}`}>
              <a href={`#${h.id}`} data-level={h.level}>{h.text}</a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
