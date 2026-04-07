# BGNeo 部署指南

## 环境要求

### 开发环境

| 组件 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| npm | >= 9 |
| PHP | >= 8.5 |
| Composer | >= 2 |
| SQLite3 | 3.x |

### 生产环境

| 组件 | 版本要求 |
|------|----------|
| Web 服务器 | Nginx 1.18+ / Apache 2.4+ |
| PHP | >= 8.5 (含扩展: pdo_sqlite, pdo, json, mbstring) |
| Node.js | >= 18 (构建时) |
| SQLite3 | 3.x |

### 可选扩展

| 扩展 | 用途 |
|------|------|
| ext-redis | JWT 黑名单缓存、阅读量缓存、限流加速 |
| ext-pdo_mysql | 如使用 MySQL 替代 SQLite |
| ext-opcache | PHP 代码缓存 |

## 开发环境部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd NknafPHP/BGNeo
```

### 2. 安装后端依赖

```bash
cd server
composer install
```

### 3. 安装前端依赖

```bash
cd ../client
npm install
```

### 4. 环境配置

```bash
cd ../server
cp .env.example .env
```

编辑 `.env` 文件：

```env
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8080

DB_PATH=storage/blog.db

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=86400

RATE_LIMIT_ENABLED=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 5. 初始化数据库

```bash
php init_db.php
```

### 6. 启动服务

后端服务（终端 1）：

```bash
cd server
php -S localhost:8080 -t public
```

前端开发服务器（终端 2）：

```bash
cd client
npm run dev
```

访问 `http://localhost:3000`

## 生产环境部署

### 方式一：Nginx + PHP-FPM

#### 目录结构

```
/var/www/bgneo/
├── client/          # 构建后的前端
│   ├── dist/
│   └── ...
└── server/          # 后端代码
    ├── public/      # Web 根目录 (nginx root)
    ├── src/
    ├── storage/
    └── ...
```

#### 1. 构建前端

```bash
cd client
npm install
npm run build
```

构建产物在 `client/dist`，移动到服务器 `/var/www/bgneo/client/dist`

#### 2. 配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/bgneo/server/public;
    index index.php;

    # 前端静态资源
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 请求
    location /api {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.5-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 3. 配置 PHP-FPM

创建 `/etc/php/8.5/fpm/pool.d/bgneo.conf`：

```ini
[bgneo]
user = www-data
group = www-data
listen = /var/run/php/php8.5-fpm.sock
listen.owner = www-data
listen.group = www-data
pm = dynamic
pm.max_children = 10
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 5
chdir = /var/www/bgneo/server
```

#### 4. 目录权限

```bash
chown -R www-data:www-data /var/www/bgneo
chmod -R 755 /var/www/bgneo
chmod -R 775 /var/www/bgneo/server/storage
chmod -R 775 /var/www/bgneo/server/uploads
```

#### 5. 重启服务

```bash
sudo systemctl restart php8.5-fpm
sudo systemctl restart nginx
```

### 方式二：Apache

创建 `/etc/apache2/sites-available/bgneo.conf`：

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/bgneo/server/public

    <Directory /var/www/bgneo/server/public>
        AllowOverride All
        Require all granted
    </Directory>

    # 前端路由支持
    <Directory /var/www/bgneo/client/dist>
        Options -Indexes
        FallbackResource /index.html
    </Directory>

    # 重写规则
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ /api/index.php [QSA,L]
</VirtualHost>
```

启用站点：

```bash
a2enmod rewrite
a2ensite bgneo.conf
a2dissite 000-default.conf
systemctl restart apache2
```

### HTTPS 配置

使用 Let's Encrypt 免费证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Docker 部署（可选）

### Dockerfile

在 `BGNeo/` 目录创建：

```dockerfile
FROM php:8.5-cli

WORKDIR /app

RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    unzip \
    && docker-php-ext-install pdo pdo_sqlite

COPY server/composer.json .
RUN composer install --no-dev --optimize-autoloader

COPY . .

EXPOSE 8080

CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./server/storage:/app/storage
      - ./server/uploads:/app/uploads
    environment:
      - APP_ENV=production
      - APP_DEBUG=false

  frontend:
    image: node:18-alpine
    working_dir: /app
    command: sh -c "npm install && npm run build"
    volumes:
      - ./client:/app
    expose:
      - "3000"
```

## 部署检查清单

### 安全配置

- [ ] 修改 `JWT_SECRET` 为强随机字符串
- [ ] 设置 `APP_ENV=production` 和 `APP_DEBUG=false`
- [ ] 修改数据库文件路径（避免在 web 目录）
- [ ] 修改默认管理员密码
- [ ] 配置防火墙只开放 80/443 端口
- [ ] 启用 HTTPS
- [ ] 设置适当的文件上传大小限制

### 性能优化

- [ ] 启用 PHP OPcache
- [ ] 配置 Nginx/Apache 静态资源缓存
- [ ] 启用 gzip 压缩
- [ ] 考虑使用 Redis 缓存

### 监控配置

- [ ] 配置日志轮转
- [ ] 设置错误告警
- [ ] 监控磁盘空间（SQLite 数据库）

### 备份策略

- [ ] 定期备份 `storage/blog.db`
- [ ] 备份 `uploads/` 目录
- [ ] 备份 `.env` 配置文件

## 常见问题

### 1. 页面空白或 404

检查 Nginx 配置的 `root` 路径是否指向 `server/public` 目录。

### 2. API 返回 500

查看 `server/storage/logs/app.log` 定位问题，确保 `APP_DEBUG=false` 时有详细错误日志。

### 3. 文件上传失败

检查 `uploads/` 目录权限是否正确。

### 4. JWT 认证失效

确认服务器时间同步，JWT secret 未被修改。

### 5. SQLite 数据库锁定

如果是高并发场景，考虑迁移到 MySQL/PostgreSQL。

## 更新升级

```bash
cd /var/www/bgneo

# 拉取新代码
git pull

# 更新后端依赖
cd server && composer update --no-dev

# 重新构建前端
cd ../client && npm install && npm run build

# 清理缓存
rm -rf server/storage/cache/*
```

## 环境变量参考

| 变量 | 默认值 | 说明 |
|------|--------|------|
| APP_ENV | development | 运行环境 |
| APP_DEBUG | false | 调试模式 |
| APP_URL | localhost | 站点 URL |
| DB_PATH | storage/blog.db | 数据库路径 |
| JWT_SECRET | - | JWT 密钥 |
| JWT_EXPIRE | 86400 | Token 有效期 |
| RATE_LIMIT_ENABLED | true | 是否启用限流 |
| REDIS_HOST | 127.0.0.1 | Redis 主机 |
| REDIS_PORT | 6379 | Redis 端口 |
