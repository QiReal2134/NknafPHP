# BGNeo API 接口文档

## 基础信息

- **基础 URL**: `/api`
- **数据格式**: JSON
- **认证方式**: JWT Bearer Token

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息描述",
  "code": 400
}
```

## 认证接口

### 用户登录

```
POST /api/auth/login
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "avatar": null
    }
  }
}
```

### 用户注册

```
POST /api/auth/register
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 (3-50字符) |
| password | string | 是 | 密码 (最少6字符) |
| email | string | 否 | 邮箱 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 2,
      "username": "newuser",
      "email": "new@example.com",
      "role": "visitor",
      "avatar": null
    }
  }
}
```

### 获取当前用户

```
GET /api/auth/me
```

**认证**: Bearer Token

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "avatar": null
  }
}
```

### 用户登出

```
POST /api/auth/logout
```

**认证**: Bearer Token

**响应示例**

```json
{
  "success": true,
  "data": "Logged out successfully"
}
```

### 修改密码

```
PUT /api/auth/password
```

**认证**: Bearer Token

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| current_password | string | 是 | 当前密码 |
| new_password | string | 是 | 新密码 |

## 文章接口

### 获取文章列表

```
GET /api/articles
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 (默认: 1) |
| per_page | int | 否 | 每页数量 (默认: 10) |
| status | string | 否 | 状态: published/draft/archived |

**响应示例**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "文章标题",
        "slug": "article-slug",
        "excerpt": "文章摘要...",
        "cover_image": "https://...",
        "view_count": 100,
        "like_count": 5,
        "comment_count": 10,
        "status": "published",
        "created_at": "2024-01-01 10:00:00",
        "published_at": "2024-01-01 12:00:00",
        "author": {
          "id": 1,
          "username": "admin"
        },
        "category": {
          "id": 1,
          "name": "技术",
          "slug": "tech"
        },
        "tags": [
          { "id": 1, "name": "PHP", "slug": "php" }
        ]
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "per_page": 10,
      "total_pages": 5
    }
  }
}
```

### 搜索文章

```
GET /api/articles/search
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| page | int | 否 | 页码 |
| per_page | int | 否 | 每页数量 |

### 获取归档列表

```
GET /api/articles/archives
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "2024": {
      "01": [
        { "id": 1, "title": "文章1", "published_at": "2024-01-15" }
      ]
    }
  }
}
```

### 获取文章详情

```
GET /api/articles/{idOrSlug}
```

**参数**: id 或 slug 都可

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "文章标题",
    "slug": "article-slug",
    "content": "完整 Markdown 内容...",
    "excerpt": "文章摘要...",
    "cover_image": "https://...",
    "view_count": 101,
    "like_count": 6,
    "comment_count": 11,
    "status": "published",
    "created_at": "2024-01-01 10:00:00",
    "published_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-02 08:00:00",
    "author": {
      "id": 1,
      "username": "admin",
      "avatar": null
    },
    "category": {
      "id": 1,
      "name": "技术",
      "slug": "tech"
    },
    "tags": [
      { "id": 1, "name": "PHP", "slug": "php" }
    ],
    "is_liked": false
  }
}
```

### 创建文章

```
POST /api/articles
```

**认证**: Bearer Token

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 文章标题 |
| slug | string | 否 | URL slug (自动生成) |
| content | string | 是 | Markdown 内容 |
| excerpt | string | 否 | 文章摘要 |
| cover_image | string | 否 | 封面图 URL |
| status | string | 否 | published/draft/archived |
| category_id | int | 否 | 分类 ID |
| tags | array | 否 | 标签 ID 数组 |

### 更新文章

```
PUT /api/articles/{id}
```

**认证**: Bearer Token

### 删除文章

```
DELETE /api/articles/{id}
```

**认证**: Bearer Token

## 分类接口

### 获取分类列表

```
GET /api/categories
```

**响应示例**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "技术", "slug": "tech", "description": "...", "article_count": 10 },
    { "id": 2, "name": "生活", "slug": "life", "description": "...", "article_count": 5 }
  ]
}
```

### 获取分类详情

```
GET /api/categories/{id}
```

### 创建分类

```
POST /api/categories
```

**认证**: Bearer Token

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 |
| slug | string | 否 | URL slug |
| description | string | 否 | 分类描述 |
| parent_id | int | 否 | 父分类 ID |
| sort_order | int | 否 | 排序 |

### 更新分类

```
PUT /api/categories/{id}
```

**认证**: Bearer Token

### 删除分类

```
DELETE /api/categories/{id}
```

**认证**: Bearer Token

## 标签接口

### 获取标签列表

```
GET /api/tags
```

**响应示例**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "PHP", "slug": "php", "article_count": 15 },
    { "id": 2, "name": "JavaScript", "slug": "javascript", "article_count": 20 }
  ]
}
```

### 获取标签详情

```
GET /api/tags/{id}
```

### 创建标签

```
POST /api/tags
```

**认证**: Bearer Token

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 标签名称 |
| slug | string | 否 | URL slug |

### 更新标签

```
PUT /api/tags/{id}
```

**认证**: Bearer Token

### 删除标签

```
DELETE /api/tags/{id}
```

**认证**: Bearer Token

## 评论接口

### 获取文章评论

```
GET /api/comments/article/{id}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| per_page | int | 否 | 每页数量 |

### 创建评论

```
POST /api/comments
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_id | int | 是 | 文章 ID |
| content | string | 是 | 评论内容 |
| parent_id | int | 否 | 父评论 ID (回复) |
| nickname | string | 否 | 昵称 (游客) |
| email | string | 否 | 邮箱 (游客) |

### 获取待审核评论

```
GET /api/comments/pending
```

**认证**: Bearer Token

### 审核评论

```
PUT /api/comments/{id}/status
```

**认证**: Bearer Token

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | approved/rejected |

### 批量审核评论

```
POST /api/comments/batch-review
```

**认证**: Bearer Token

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 评论 ID 数组 |
| status | string | 是 | approved/rejected |

### 删除评论

```
DELETE /api/comments/{id}
```

**认证**: Bearer Token

## 点赞接口

### 切换点赞

```
POST /api/likes
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_id | int | 是 | 文章 ID |

**响应示例**

```json
{
  "success": true,
  "data": {
    "liked": true,
    "like_count": 7
  }
}
```

## 友情链接接口

### 获取友链列表

```
GET /api/friend-links
```

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "示例网站",
      "url": "https://example.com",
      "logo": "https://example.com/logo.png",
      "description": "这是一个示例网站"
    }
  ]
}
```

### 获取所有友链

```
GET /api/friend-links/all
```

**认证**: Bearer Token (包含未激活的)

### 创建友链

```
POST /api/friend-links
```

**认证**: Bearer Token

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 网站名称 |
| url | string | 是 | 网站 URL |
| logo | string | 否 | 网站 Logo |
| description | string | 否 | 网站描述 |
| sort_order | int | 否 | 排序 |

### 更新友链

```
PUT /api/friend-links/{id}
```

**认证**: Bearer Token

### 删除友链

```
DELETE /api/friend-links/{id}
```

**认证**: Bearer Token

## 设置接口

### 获取设置

```
GET /api/settings
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "site_title": "我的博客",
    "site_description": "一个简洁的个人博客系统",
    "posts_per_page": 10,
    "enable_comments": true,
    "rss_count": 20,
    "site_keywords": "博客,技术,生活",
    "icp_number": "",
    "analytics_code": ""
  }
}
```

### 更新设置

```
PUT /api/settings
```

**认证**: Bearer Token

### 获取个人资料

```
GET /api/profile
```

**认证**: Bearer Token

### 更新个人资料

```
PUT /api/profile
```

**认证**: Bearer Token

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 否 | 邮箱 |
| avatar | string | 否 | 头像 URL |

### 获取统计数据

```
GET /api/statistics
```

**认证**: Bearer Token

**响应示例**

```json
{
  "success": true,
  "data": {
    "total_articles": 50,
    "total_comments": 200,
    "total_views": 10000,
    "total_likes": 500,
    "today_articles": 2,
    "today_comments": 10,
    "today_views": 500
  }
}
```

## 上传接口

### 上传头像

```
POST /api/upload/avatar
```

**认证**: Bearer Token

**请求参数**: multipart/form-data

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| avatar | file | 是 | 图片文件 (最大 2MB) |

**响应示例**

```json
{
  "success": true,
  "data": {
    "url": "/uploads/avatars/xxx.png"
  }
}
```

### 上传图片

```
POST /api/upload/image
```

**认证**: Bearer Token

**请求参数**: multipart/form-data

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| image | file | 是 | 图片文件 (最大 5MB) |

## SEO 接口

### 获取 RSS

```
GET /rss.xml
```

返回 RSS 2.0 XML 格式

### 获取站点地图

```
GET /sitemap.xml
```

返回 XML 格式站点地图

### 获取 Robots

```
GET /robots.txt
```

## 健康检查

### 服务健康状态

```
GET /api/health
```

**响应示例**

```json
{
  "status": "ok",
  "timestamp": 1704067200,
  "version": "1.0.0"
}
```

### CSRF Token

```
GET /api/csrf-token
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "token": "xxx..."
  }
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 405 | 请求方法不允许 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
