<?php
$pdo = new PDO('sqlite:storage/blog.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$sql = "
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS article_categories;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS article_likes;
DROP TABLE IF EXISTS friend_links;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(20) DEFAULT 'visitor' CHECK(role IN ('admin', 'visitor')),
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE,
    slug VARCHAR(40) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    cover_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
    view_count INTEGER DEFAULT 0,
    author_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE article_categories (
    article_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (article_id, category_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE article_tags (
    article_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    article_id INTEGER NOT NULL,
    user_id INTEGER,
    parent_id INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    nickname VARCHAR(50),
    email VARCHAR(100),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(200),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE article_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255),
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, ip_address),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE friend_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    logo VARCHAR(500),
    description VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug, description, parent_id, sort_order) VALUES
('技术',     'tech',      '技术相关文章',   0, 1),
('生活',     'life',      '生活随笔',       0, 2),
('随笔',     'essay',     '杂谈随感',       0, 3),
('前端',     'frontend',  '前端开发',       1, 1),
('后端',     'backend',   '后端开发',       1, 2);

INSERT INTO tags (name, slug) VALUES
('JavaScript', 'javascript'),
('Python',     'python'),
('MySQL',      'mysql'),
('Vue',        'vue'),
('Linux',      'linux'),
('随笔',       'essay');

INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_title',       'Nknaf',                 '站点标题'),
('site_description', '一个简洁的个人博客系统', '站点描述'),
('posts_per_page',   '10',                    '每页显示文章数'),
('enable_comments',  '1',                     '是否开启评论: 1开 0关'),
('rss_count',        '20',                    'RSS输出条数'),
('site_keywords',    '博客,技术,生活',         '站点SEO关键词'),
('icp_number',       '',                      'ICP备案号'),
('analytics_code',   '',                      '统计代码(GA/CNZZ等)'),
('profile_avatar',   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAABFUlEQVR4nJRRu04EMQx0HDt/QUF5Vx4ddw0V30FBCaKEjkdJCRIV30FBC0KUW50E1/AlYbzOZnfFctJNsqvJyLE9juydvIQQyJEzdTznPKlLrwID/p/ONMbP8zE2/UEVZVLdAqZM0/ny+Agj7WKOXAF1//S1ZBrrQOQISJTS1ebpyNTuWAjqdIYRDM4aVcW2qyCzszcjrmtSSTjOzt9xgMKhrYNqUOcXH5EFXYKvH1ct5/XD0vsJ1pKIJkvQ3B9YVk1D6zFpz1UtDeEW9zbMlgi+xVXjNqxvosVl49wWGqtp+gqh+Pm8mzupMbgX/eUPr786Xkbj0XU+ZdzowidtA48+fPuvbjceATJ8k7C8+aZdILQjfgEAAP//AMlX8gAAAAZJREFUAwB0uTTLLyxx9QAAAABJRU5ErkJggg==', '默认头像');

$adminPassword = password_hash('Admin@2026Secure!', PASSWORD_BCRYPT);
$pdo->exec("INSERT INTO users (username, password, role) VALUES ('admin', '{$adminPassword}', 'admin')");
";

try {
    $pdo->exec($sql);
    echo 'SQLite database initialized successfully!' . PHP_EOL;
    
    $count = $pdo->query("SELECT COUNT(*) as cnt FROM categories")->fetch();
    echo "Categories: " . $count['cnt'] . PHP_EOL;
    
    $count = $pdo->query("SELECT COUNT(*) as cnt FROM tags")->fetch();
    echo "Tags: " . $count['cnt'] . PHP_EOL;
    
    $count = $pdo->query("SELECT COUNT(*) as cnt FROM settings")->fetch();
    echo "Settings: " . $count['cnt'] . PHP_EOL;
} catch (PDOException $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
