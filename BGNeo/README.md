# BGNeo 个人博客系统

一款基于 React + PHP 8.5 构建的现代化个人博客系统，采用前后端分离架构，支持 Markdown 编写、内容审核、数据统计等完整博客功能。

## 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **路由**: React Router v7
- **国际化**: i18next
- **Markdown**: @uiw/react-md-editor + react-markdown
- **数学公式**: KaTeX
- **HTTP 客户端**: Axios
- **代码高亮**: highlight.js

### 后端
- **语言**: PHP 8.5
- **路由**: FastRoute
- **日志**: Monolog
- **认证**: Firebase JWT
- **环境配置**: phpdotenv

### 数据库
- **引擎**: SQLite 3
- **依赖管理**: Composer

## 功能特性

### 内容管理
- Markdown 文章编写与发布
- 分类与标签系统
- 文章归档与搜索
- 阅读量统计

### 交互功能
- 评论系统（含审核流程）
- 文章点赞
- 友情链接管理

### SEO 优化
- RSS 订阅
- 站点地图
- robots.txt
- Open Graph meta 标签

### 后台管理
- 仪表盘数据统计
- 文章管理（CRUD）
- 评论审核
- 系统设置

### 安全特性
- JWT 身份认证
- CSRF 令牌保护
- 输入内容过滤
- 安全响应头
- 限流机制

## 项目结构

```
NknafPHP/
├── BGNeo/
│   ├── client/                 # 前端项目
│   │   ├── src/
│   │   │   ├── components/     # React 组件
│   │   │   ├── hooks/          # 自定义 Hooks
│   │   │   ├── pages/          # 页面组件
│   │   │   ├── router/          # 路由配置
│   │   │   ├── services/       # API 服务
│   │   │   ├── styles/          # 全局样式
│   │   │   ├── themes/          # 主题配置
│   │   │   ├── utils/           # 工具函数
│   │   │   └── i18n/            # 国际化资源
│   │   └── public/             # 静态资源
│   │
│   └── server/                 # 后端项目
│       ├── src/
│       │   ├── Core/           # 核心类
│       │   ├── controllers/     # 控制器
│       │   ├── middleware/     # 中间件
│       │   ├── models/         # 数据模型
│       │   ├── routes/         # 路由定义
│       │   ├── enums/          # 枚举类型
│       │   └── utils/          # 工具类
│       ├── config/            # 配置文件
│       ├── storage/           # 存储目录
│       └── uploads/           # 上传目录
```

## 快速开始

### 环境要求

- Node.js >= 18
- PHP >= 8.5
- Composer
- SQLite3 扩展

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd NknafPHP/BGNeo
```

2. 安装后端依赖
```bash
cd server
composer install
```

3. 安装前端依赖
```bash
cd ../client
npm install
```

4. 配置环境变量
```bash
cd ../server
cp .env.example .env
```

5. 初始化数据库
```bash
php init_db.php
```

6. 启动开发服务器

后端：
```bash
cd server
php -S localhost:8080 -t public
```

前端：
```bash
cd client
npm run dev
```

## 默认账号

- **用户名**: admin
- **密码**: admin123

> 请在生产环境务必修改默认密码

## API 文档

详细接口文档请参阅 [API.md](./API.md)

## 部署指南

详细部署指南请参阅 [DEPLOY.md](./DEPLOY.md)

## 许可证

ISC License
