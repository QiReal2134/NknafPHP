# BGNeo 系统架构文档

## 系统概述

BGNeo 是一个前后端分离的个人博客系统，采用 React + PHP 8.5 技术栈实现。前端提供用户界面，后端提供 RESTful API 服务，数据库采用 SQLite。

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端浏览器                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     React 前端应用                           │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌─────────────┐   │
│  │  页面    │  │  组件库   │  │ Hooks │  │   状态管理   │   │
│  └─────────┘  └──────────┘  └────────┘  └─────────────┘   │
│                          │                                   │
│                    ┌─────┴─────┐                             │
│                    │  Axios   │                             │
│                    └─────┬─────┘                             │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     PHP 8.5 后端服务                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    入口 (public/index.php)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  中间件层 (Middleware)                │   │
│  │   Auth │ CORS │ CSRF │ RateLimiter │ SecurityHeaders │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 控制器层 (Controllers)                │   │
│  │  Article │ Category │ Tag │ Comment │ Like │ Auth  │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   模型层 (Models)                     │   │
│  │      Article │ Category │ Tag │ Comment │ User      │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               数据库层 (SQLite)                       │   │
│  │                  blog.db                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 前端架构

### 目录结构

```
client/src/
├── components/          # 可复用组件
│   ├── Layout.tsx      # 主布局组件
│   ├── AdminLayout.tsx # 管理后台布局
│   ├── ArticleCard.tsx # 文章卡片
│   ├── CommentSection  # 评论组件
│   └── ...
├── pages/              # 页面组件
│   ├── Home.tsx       # 首页
│   ├── ArticleDetail  # 文章详情
│   ├── admin/         # 管理页面
│   └── ...
├── hooks/             # 自定义 React Hooks
│   ├── useTheme.ts   # 主题切换
│   ├── useMagnetic.ts # 磁性效果
│   └── ...
├── router/            # 路由配置
├── services/          # API 服务层
├── utils/             # 工具函数
├── i18n/              # 国际化
└── themes/            # 主题配置
```

### 路由设计

| 路径 | 页面 | 权限 |
|------|------|------|
| `/` | 首页 | 公开 |
| `/post/:slug` | 文章详情 | 公开 |
| `/category/:slug` | 分类归档 | 公开 |
| `/tag/:slug` | 标签归档 | 公开 |
| `/search` | 搜索结果 | 公开 |
| `/about` | 关于页面 | 公开 |
| `/archives` | 归档页面 | 公开 |
| `/admin/login` | 登录页 | 公开 |
| `/admin/*` | 管理后台 | 需认证 |

### 状态管理

采用 React 原生 Context + Hooks 方式进行状态管理：

- **ThemeContext**: 主题状态（明/暗模式）
- **AuthContext**: 用户认证状态
- **LanguageContext**: 国际化语言状态

## 后端架构

### 目录结构

```
server/src/
├── Core/              # 核心类
│   └── Application.php # 应用主类
├── controllers/       # 控制器
│   ├── ArticleController.php
│   ├── AuthController.php
│   ├── CategoryController.php
│   ├── CommentController.php
│   └── ...
├── middleware/       # 中间件
│   ├── Auth.php     # JWT 认证
│   ├── Cors.php     # 跨域处理
│   ├── Csrf.php     # CSRF 防护
│   ├── RateLimiter.php # 限流
│   └── SecurityHeaders.php # 安全头
├── models/          # 数据模型
├── enums/           # 枚举定义
├── routes/          # 路由定义
│   └── api.php     # API 路由注册
└── utils/           # 工具类
    ├── ClientIP.php
    ├── ContentFilter.php
    ├── SecurityLogger.php
    └── TokenHelper.php
```

### 请求生命周期

1. 请求进入 `public/index.php`
2. 加载自动加载器和环境配置
3. 创建应用实例并运行
4. 中间件链处理：
   - CORS 头处理
   - 安全头处理
   - CSRF 验证
   - 限流检查
   - JWT 认证（如需要）
5. 路由匹配并分发到控制器
6. 控制器处理业务逻辑
7. 模型层数据操作
8. 返回 JSON 响应
9. 日志记录

### 中间件说明

| 中间件 | 功能 | 适用场景 |
|--------|------|----------|
| Auth | JWT Token 验证 | 受保护路由 |
| Cors | 跨域资源共享 | 所有 API |
| Csrf | CSRF 令牌验证 | POST/PUT/DELETE |
| RateLimiter | 请求频率限制 | 所有 API |
| SecurityHeaders | 安全响应头 | 所有响应 |
| ErrorHandler | 异常捕获处理 | 全局 |

## 数据库架构

### ER 关系图

```
┌──────────┐       ┌──────────────────┐       ┌──────────┐
│   User   │       │     Article      │       │  Tag     │
├──────────┤       ├──────────────────┤       ├──────────┤
│ id (PK)  │──┐    │ id (PK)          │    ┌──│ id (PK)  │
│ username │  │    │ title            │    │  │ name     │
│ password │  │    │ slug             │    │  │ slug     │
│ email    │  └───│ author_id (FK)   │    │  └──────────┘
│ role     │       │ view_count       │    │      │
└──────────┘       │ status           │    │      │
      │           └──────────────────┘    │      │
      │                  │              │      ▼
      │                  │         ┌────────────┐
      │                  │         │article_tags│
      │                  │         ├────────────┤
      │                  │         │ article_id │
      │                  │         │ tag_id     │
      │                  │         └────────────┘
      │                  │
      ▼                  ▼
┌──────────┐     ┌──────────────────┐
│ Comment  │     │    Category      │
├──────────┤     ├──────────────────┤
│ id (PK)  │     │ id (PK)          │
│ content  │     │ name             │
│ article_id│◄───┤ slug             │
│ user_id  │     │ parent_id        │
│ status   │     └──────────────────┘
│ nickname │            ▲
└──────────┘            │
                        │
              ┌──────────────────┐
              │article_categories│
              ├──────────────────┤
              │ article_id       │
              │ category_id      │
              └──────────────────┘
```

### 数据表说明

| 表名 | 说明 | 关联 |
|------|------|------|
| users | 用户表 | 1:N → articles, comments |
| articles | 文章表 | N:1 → users, N:N → categories, tags |
| categories | 分类表 | N:N → articles |
| tags | 标签表 | N:N → articles |
| comments | 评论表 | N:1 → articles, users |
| article_likes | 点赞表 | N:1 → articles |
| friend_links | 友情链接表 | - |
| settings | 系统设置表 | - |

## 安全机制

### 认证流程

```
客户端                    服务端                     认证流程
  │                         │                           │
  │────── 登录请求 ─────────>│                           │
  │    (username, password) │                           │
  │                         │──── 验证凭据 ──────────────>│
  │                         │<─── 返回 JWT Token ─────────│
  │<───── JWT Token ────────│                           │
  │                         │                           │
  │────── API 请求 ─────────>│                           │
  │   + Authorization:     │                           │
  │     Bearer {token}      │                           │
  │                         │──── 验证 Token ───────────>│
  │                         │<─── 验证结果 ──────────────│
  │<───── 响应数据 ──────────│                           │
```

### CSRF 防护

1. 客户端首次访问获取 CSRF Token
2. 后续所有写操作需携带 Token
3. 服务端验证 Token 有效性

### 限流策略

| 端点类型 | 限制 |
|----------|------|
| 登录接口 | 5次/分钟 |
| 评论接口 | 10次/分钟 |
| 其他 API | 60次/分钟 |

## SEO 实现

### Meta 标签

每个页面通过 React Helmet Async 动态设置：

- `<title>` - 页面标题
- `<meta name="description">` - 页面描述
- `<meta name="keywords">` - 关键词
- Open Graph 标签

### 站点地图

- `/sitemap.xml` - 自动生成 XML 站点地图
- 包含所有已发布文章、分类、标签页

### RSS 订阅

- `/rss.xml` - 提供 RSS 2.0 格式订阅源
- 默认输出最近 20 篇已发布文章

## 扩展性设计

### 中间件扩展

新增中间件只需：

1. 在 `middleware/` 目录创建类
2. 实现 `MiddlewareInterface`
3. 在路由注册时添加

### 控制器扩展

1. 在 `controllers/` 创建控制器
2. 继承 `BaseController`
3. 在 `routes/api.php` 注册路由

### 模型扩展

1. 在 `models/` 创建模型类
2. 继承 `BaseModel`
3. 使用查询构建器

### 推荐的 Redis 扩展

当 `ext-redis` 可用时，系统会自动启用：

- JWT 黑名单存储
- 文章阅读量缓存
- API 限流计数
