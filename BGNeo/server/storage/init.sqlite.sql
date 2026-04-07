-- ============================================================
-- 个人博客系统 - SQLite 数据库初始化脚本
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. users 用户表
-- ============================================================
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS article_categories;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

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

-- ============================================================
-- 2. categories 分类表
-- ============================================================
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. tags 标签表
-- ============================================================
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE,
    slug VARCHAR(40) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. articles 文章表
-- ============================================================
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

-- ============================================================
-- 5. article_categories 文章-分类关联表
-- ============================================================
CREATE TABLE article_categories (
    article_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (article_id, category_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. article_tags 文章-标签关联表
-- ============================================================
CREATE TABLE article_tags (
    article_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. comments 评论表
-- ============================================================
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

-- ============================================================
-- 8. settings 系统设置表
-- ============================================================
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(200),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. article_likes 文章点赞表
-- ============================================================
CREATE TABLE article_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, ip_address),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. friend_links 友情链接表
-- ============================================================
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

-- ============================================================
-- 预设数据
-- ============================================================

-- 示例分类
INSERT INTO categories (name, slug, description, parent_id, sort_order) VALUES
('技术',     'tech',      '技术相关文章',   0, 1),
('生活',     'life',      '生活随笔',       0, 2),
('随笔',     'essay',     '杂谈随感',       0, 3),
('前端',     'frontend',  '前端开发',       1, 1),
('后端',     'backend',   '后端开发',       1, 2);

-- 示例标签
INSERT INTO tags (name, slug) VALUES
('JavaScript', 'javascript'),
('Python',     'python'),
('MySQL',      'mysql'),
('Vue',        'vue'),
('Linux',      'linux'),
('随笔',       'essay');

-- 站点默认设置
INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_title',       '我的博客',              '站点标题'),
('site_description', '一个简洁的个人博客系统', '站点描述'),
('posts_per_page',   '10',                    '每页显示文章数'),
('enable_comments',  '1',                     '是否开启评论：1 开 0 关'),
('rss_count',        '20',                    'RSS 输出条数'),
('site_keywords',    '博客，技术，生活',         '站点 SEO 关键词'),
('icp_number',       '',                      'ICP 备案号'),
('analytics_code',   '',                      '统计代码 (GA/CNZZ 等)'),
('profile_avatar',   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAA7EAAAOxAGVKw4bAAACGElEQVR4nO2au0oEQRBFp1/zFyKCyS6CsEbqJgbid6gY+gg1ER+BgZEoGIjfIWK6oibCBrKgC+KPOAYmVi120czgle06WTtdXXcvNf1yzMTqTVX8wBhTJFFVtJ0YX7H4v85v07KNH2oAWgAan/zOcWrGo/NnXwFqAFoAGt/0gB/XK9Hnk+u3TaeM5pfyZV8BagBaABpvXbMeTG3ckfb71XK0f9P5Oc460jaFzgEENQAtAI13Pu04MLxcij5PHU/sX3Of4hwbn8VnXwFqAFoAGh9coH+peRYIno7X2uyR9uC8S/uL+dMEtbbu6fgh/NLzm+wrQA1AC0DjjaN7Zcv+18bP05z2zgNpO0vXXSl+cEHnhJntx2j8y9l8dDy+9/9k3w/w35d9BagBaAFofCjLaIf+6Vz0eQjx+FRcGV+3xXi27ruRHjoHENQAtAA0nq/bqZbwdbewbO/OtgGdvT5pP5/M0vH4/UB8G1F0dul4YrzeB1DUALQANF46L0sk7wOE4z2/T3g6bif1TyX7ClAD0ALQeMfuA6RvbxcOXklbjk+72JfeeY507y+RfQWoAWgBaLzl77CAtc161j0aknZvfzqpf93vC7KvADUALQCNWTx8E07c4032FaAGoAWgUQPQAtCoAWgBaL4A6VdKp+NJ7lgAAAAASUVORK5CYII=', '默认头像');

INSERT INTO users (username, password, role) VALUES ('admin', '$2y$10$ placeholder_admin_password_hash', 'admin');
