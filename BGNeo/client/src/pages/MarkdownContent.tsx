import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:') || trimmed.startsWith('data:text/html')) {
    return '';
  }
  return url;
}

const components: Components = {
  code({ className, children, ...props }) {
    const isInline = !(className || '').includes('language-');
    if (isInline) return <code className={className} {...(props as any)}>{children}</code>;
    const lang = (className || '').replace('language-', '') || 'text';
    return <div className="code-block-wrapper"><span className="code-block-lang">{lang}</span><pre {...(props as any)}><code className={className}>{children}</code></pre></div>;
  },
  a({ href, children, ...props }) {
    const safeHref = sanitizeUrl(href || '');
    if (!safeHref) return <span {...(props as any)}>{children}</span>;
    return <a href={safeHref} target="_blank" rel="noopener noreferrer" {...(props as any)}>{children}</a>;
  },
  img({ src, alt, ...props }) {
    const safeSrc = sanitizeUrl(src || '');
    if (!safeSrc) return null;
    return <img src={safeSrc} alt={alt || ''} loading="lazy" {...(props as any)} />;
  },
  span({ style, children, ...props }) {
    let safeStyle: React.CSSProperties | undefined;
    if (style && typeof style === 'object') {
      const s = style as Record<string, unknown>;
      safeStyle = {};
      const allowedProps = new Set(['color', 'backgroundColor', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration']);
      for (const [key, value] of Object.entries(s)) {
        if (allowedProps.has(key)) {
          (safeStyle as Record<string, unknown>)[key] = value;
        }
      }
      if (Object.keys(safeStyle).length === 0) safeStyle = undefined;
    }
    return <span style={safeStyle} {...(props as any)}>{children}</span>;
  },
  script() { return null; },
  iframe() { return null; },
  object() { return null; },
  embed() { return null; },
  form() { return null; },
  input() { return null; },
};

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const sanitizedContent = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');

  return (
    <div className="article-content markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={components}
        allowedElements={[
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'a', 'em', 'strong', 'del', 's', 'strike',
          'img', 'figure', 'figcaption',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'sup', 'sub', 'abbr',
          'span', 'div',
        ]}
        unwrapDisallowed
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
