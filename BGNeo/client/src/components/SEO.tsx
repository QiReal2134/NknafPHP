import { Helmet } from 'react-helmet-async';

interface FAQItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  type?: 'website' | 'article';
  url?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  authorName?: string;
  structuredData?: Record<string, unknown> | null;
  breadcrumb?: BreadcrumbItem[];
  faqItems?: FAQItem[];
  howToSteps?: HowToStep[];
  readingTime?: number;
}

const SITE_NAME = "Nknaf's Blog";
const SITE_URL = import.meta.env.VITE_SITE_URL || '';
const DEFAULT_DESCRIPTION = '个人技术博客，专注于前端、后端开发经验分享，涵盖 React、Vue、Node.js、TypeScript 等技术栈';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = '@Nknaf';

function buildJsonLd(props: SEOProps): Record<string,unknown>[] {
  const schemas: Record<string,unknown>[] = [];
  const baseUrl = props.url || (typeof window !== 'undefined' ? window.location.origin : '');

  if (props.type === 'article' && props.title) {
    const articleSchema: Record<string,unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: props.title,
      description: props.description,
      datePublished: props.publishedTime,
      dateModified: props.modifiedTime || props.publishedTime,
      author: {
        '@type': 'Person',
        name: props.authorName || 'Nknaf',
        url: `${baseUrl}/about`
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` }
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': props.canonicalUrl || props.url || '' },
      keywords: (props.tags || props.keywords || []).join(', '),
      image: props.ogImage ? [props.ogImage] : undefined,
      dateCreated: props.publishedTime
    };
    if (props.section) {
      articleSchema.articleSection = props.section;
    }
    if (props.readingTime) {
      articleSchema.timeRequired = `PT${props.readingTime}M`;
    }
    schemas.push(articleSchema);

    if (props.breadcrumb && props.breadcrumb.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: props.breadcrumb.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: item.url
        }))
      });
    }
  }

  if (props.type === 'website') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      description: props.description || DEFAULT_DESCRIPTION,
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Nknaf',
      url: `${baseUrl}/about`,
      jobTitle: 'Full Stack Developer',
      knowsAbout: ['React', 'Vue', 'Node.js', 'TypeScript', 'Python', 'MySQL', 'Docker', 'Linux']
    });
  }

  if (props.faqItems && props.faqItems.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: props.faqItems.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    });
  }

  if (props.howToSteps && props.howToSteps.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: props.title || '教程指南',
      description: props.description,
      step: props.howToSteps.map((step, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: step.name,
        text: step.text
      }))
    });
  }

  if (props.structuredData) {
    schemas.push(props.structuredData);
  }

  return schemas.filter(s => Object.keys(s).length > 0);
}

export default function SEO({
  title = "Nknaf's Blog",
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  ogImage,
  type = 'website',
  url,
  canonicalUrl,
  noIndex = false,
  publishedTime,
  modifiedTime,
  section,
  tags,
  authorName,
  structuredData,
  breadcrumb,
  faqItems,
  howToSteps,
  readingTime
}: SEOProps) {
  const siteTitle = title.includes(' - ') ? title : `${title} - ${SITE_NAME}`;
  const finalOgImage = ogImage || DEFAULT_OG_IMAGE;
  const finalCanonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const jsonLdSchemas = buildJsonLd({ title, description, keywords, ogImage, type, url, canonicalUrl, noIndex, publishedTime, modifiedTime, section, tags, authorName, structuredData, breadcrumb, faqItems, howToSteps, readingTime });

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(',')} />}
      <link rel="canonical" href={finalCanonical} />

      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content="zh_CN" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:site_name" content={SITE_NAME} />
      {type === 'article' && publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {type === 'article' && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {type === 'article' && section && <meta property="article:section" content={section} />}
      {type === 'article' && tags && tags.length > 0 && tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      {type === 'article' && authorName && <meta property="article:author" content={authorName} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalOgImage} />
      <meta name="twitter:image:alt" content={title} />

      <link rel="alternate" type="application/rss+xml" title={`${SITE_NAME} RSS Feed`} href={`${SITE_URL}/rss.xml`} />
      <link rel="alternate" hrefLang="zh-CN" href={finalCanonical} />
      <link rel="alternate" hrefLang="en" href={finalCanonical.replace('/zh-CN/', '/en/').replace('?lang=zh-CN', '?lang=en')} />

      {jsonLdSchemas.map((schema, idx) => (
        <script key={idx} type="application/ld+json">{JSON.stringify(schema)}</script>
      ))}
    </Helmet>
  );
}
