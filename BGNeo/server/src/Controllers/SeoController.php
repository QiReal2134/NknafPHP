<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Models\Setting;
use App\Request;
use App\Response;

class SeoController
{
    private static function escapeXml(string $str): string
    {
        return htmlspecialchars($str, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    public function generateRSS(Request $request): Response
    {
        try {
            $siteTitle = self::escapeXml(Setting::get('site_title') ?? "Nknaf's Blog");
            $siteDesc = self::escapeXml(Setting::get('site_description') ?? '个人技术博客');
            $siteUrl = $_ENV['SITE_URL'] ?? 'http://localhost:3000';
            $rssCount = (int) (Setting::get('rss_count') ?? 20);

            $articles = Database::query(
                "SELECT title, slug, excerpt, published_at, created_at
                 FROM articles WHERE status = 'published'
                 ORDER BY published_at DESC LIMIT ?",
                [$rssCount]
            );

            $items = '';
            foreach ($articles as $article) {
                $pubDate = gmdate('D, d M Y H:i:s T', strtotime($article['published_at'] ?: $article['created_at']));
                $link = "{$siteUrl}/post/{$article['slug']}";
                $excerpt = $article['excerpt'] ?? '';

                $items .= "    <item>" .
                    "<title>" . self::escapeXml($article['title']) . "</title>" .
                    "<link>{$link}</link>" .
                    "<description><![CDATA[{$excerpt}]]></description>" .
                    "<pubDate>{$pubDate}</pubDate>" .
                    "<guid isPermaLink=\"true\">{$link}</guid>" .
                    "</item>\n";
            }

            $now = gmdate('D, d M Y H:i:s T');
            $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" .
                "<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n" .
                "  <channel>\n" .
                "    <title>{$siteTitle}</title>\n" .
                "    <link>{$siteUrl}</link>\n" .
                "    <description>{$siteDesc}</description>\n" .
                "    <language>zh-cn</language>\n" .
                "    <lastBuildDate>{$now}</lastBuildDate>\n" .
                "    <atom:link href=\"{$siteUrl}/rss.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n" .
                "{$items}" .
                "  </channel>\n" .
                "</rss>";

            return Response::html($xml)->withHeader('Content-Type', 'application/xml; charset=utf-8');
        } catch (\Throwable $e) {
            return Response::text('<?xml version="1.0"?><error/>')->withHeader('Content-Type', 'application/xml');
        }
    }

    public function generateSitemap(Request $request): Response
    {
        try {
            $siteUrl = $_ENV['SITE_URL'] ?? 'http://localhost:3000';
            $today = date('Y-m-d');

            $articles = Database::query(
                "SELECT slug, updated_at, published_at FROM articles WHERE status = 'published'"
            );

            $categories = Database::query("SELECT slug FROM categories");
            $tags = Database::query("SELECT slug FROM tags");

            $articleUrls = '';
            foreach ($articles as $article) {
                $lastmod = substr($article['updated_at'] ?: $article['published_at'] ?: $today, 0, 10);
                $articleUrls .= "  <url><loc>{$siteUrl}/post/{$article['slug']}</loc>" .
                    "<lastmod>{$lastmod}</lastmod>" .
                    "<changefreq>weekly</changefreq>" .
                    "<priority>0.9</priority></url>\n";
            }

            $categoryUrls = '';
            foreach ($categories as $cat) {
                $categoryUrls .= "  <url><loc>{$siteUrl}/category/{$cat['slug']}</loc>" .
                    "<lastmod>{$today}</lastmod>" .
                    "<changefreq>weekly</changefreq>" .
                    "<priority>0.7</priority></url>\n";
            }

            $tagUrls = '';
            foreach ($tags as $tag) {
                $tagUrls .= "  <url><loc>{$siteUrl}/tag/{$tag['slug']}</loc>" .
                    "<lastmod>{$today}</lastmod>" .
                    "<changefreq>weekly</changefreq>" .
                    "<priority>0.6</priority></url>\n";
            }

            $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" .
                "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" " .
                "xmlns:xhtml=\"http://www.w3.org/1999/xhtml\" " .
                "xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\n" .
                "<url><loc>{$siteUrl}/</loc><lastmod>{$today}</lastmod>" .
                "<changefreq>daily</changefreq><priority>1.0</priority></url>\n" .
                "<url><loc>{$siteUrl}/about</loc><lastmod>{$today}</lastmod>" .
                "<changefreq>monthly</changefreq><priority>0.8</priority></url>\n" .
                "<url><loc>{$siteUrl}/archives</loc><lastmod>{$today}</lastmod>" .
                "<changefreq>weekly</changefreq><priority>0.7</priority></url>\n" .
                "<url><loc>{$siteUrl}/search</loc><lastmod>{$today}</lastmod>" .
                "<changefreq>monthly</changefreq><priority>0.5</priority></url>\n" .
                "{$articleUrls}" .
                "{$categoryUrls}" .
                "{$tagUrls}" .
                "</urlset>";

            return Response::html($xml)->withHeader('Content-Type', 'application/xml; charset=utf-8');
        } catch (\Throwable $e) {
            return Response::text('<?xml version="1.0"?><error/>')->withHeader('Content-Type', 'application/xml');
        }
    }

    public function robotsTxt(Request $request): Response
    {
        $siteUrl = $_ENV['SITE_URL'] ?? 'http://localhost:3000';

        $content = "User-agent: *\nAllow: /\nSitemap: {$siteUrl}/sitemap.xml\n";

        return Response::text($content);
    }
}
