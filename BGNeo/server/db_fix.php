<?php

$pdo = new PDO('sqlite:storage/blog.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== 数据库修复脚本 ===" . PHP_EOL;
echo "开始时间: " . date('Y-m-d H:i:s') . PHP_EOL . PHP_EOL;

$errors = [];
$fixes = [];

try {

    echo "--- 1. 重建表以添加 CHECK 约束 ---" . PHP_EOL;

    $pdo->exec('PRAGMA foreign_keys = OFF');

    $tablesToMigrate = [
        'users' => "
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE,
                role VARCHAR(20) DEFAULT 'visitor' CHECK(role IN ('admin', 'visitor')),
                avatar VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ",
        'articles' => "
            CREATE TABLE articles_new (
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
            )
        ",
        'comments' => "
            CREATE TABLE comments_new (
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
            )
        ",
    ];

    foreach ($tablesToMigrate as $table => $createSql) {
        try {
            $data = $pdo->query("SELECT * FROM {$table}")->fetchAll(PDO::FETCH_ASSOC);

            $pdo->exec("ALTER TABLE {$table} RENAME TO {$table}_old");
            $pdo->exec($createSql);

            if (!empty($data)) {
                $columns = array_keys($data[0]);
                $placeholders = implode(',', array_fill(0, count($columns), '?'));
                $columnList = implode(',', $columns);

                $stmt = $pdo->prepare("INSERT INTO {$table}_new ({$columnList}) VALUES ({$placeholders})");
                foreach ($data as $row) {
                    $stmt->execute(array_values($row));
                }
            }

            $pdo->exec("DROP TABLE {$table}_old");
            $pdo->exec("ALTER TABLE {$table}_new RENAME TO {$table}");

            $fixes[] = "[OK] {$table} 表已添加 CHECK 约束 (迁移 " . count($data) . " 条记录)";
            echo end($fixes) . PHP_EOL;
        } catch (\Exception $e) {
            $errors[] = "[ERROR] {$table} 表迁移失败: " . $e->getMessage();
            echo end($errors) . PHP_EOL;

            if ($pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='{$table}_old'")->fetch()) {
                $pdo->exec("DROP TABLE IF EXISTS {$table}_new");
                $pdo->exec("ALTER TABLE {$table}_old RENAME TO {$table}");
                echo "[INFO] 已回滚 {$table} 表" . PHP_EOL;
            }
        }
    }

    $pdo->exec('PRAGMA foreign_keys = ON');

    echo PHP_EOL . "--- 2. 补充缺失的初始数据 ---" . PHP_EOL;

    $existingSettings = $pdo->query("SELECT setting_key FROM settings")->fetchAll(PDO::FETCH_ASSOC);
    $existingKeys = array_column($existingSettings, 'setting_key');

    if (!in_array('profile_avatar', $existingKeys)) {
        $defaultAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAABFUlEQVR4nJRRu04EMQx0HDt/QUF5Vx4ddw0V30FBCaKEjkdJCRIV30FBC0KUW50E1/AlYbzOZnfFctJNsqvJyLE9juydvIQQyJEzdTznPKlLrwID/p/ONMbP8zE2/UEVZVLdAqZM0/ny+Agj7WKOXAF1//S1ZBrrQOQISJTS1ebpyNTuWAjqdIYRDM4aVcW2qyCzszcjrmtSSTjOzt9xgMKhrYNqUOcXH5EFXYKvH1ct5/XD0vsJ1pKIJkvQ3B9YVk1D6zFpz1UtDeEW9zbMlgi+xVXjNqxvosVl49wWGqtp+gqh+Pm8mzupMbgX/eUPr786Xkbj0XU+ZdzowidtA48+fPuvbjceATJ8k7C8+aZdILQjfgEAAP//AMlX8gAAAAZJREFUAwB0uTTLLyxx9QAAAABJRU5ErkJggg==';
        $pdo->prepare("INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?)")
           ->execute(['profile_avatar', $defaultAvatar, '默认头像']);
        $fixes[] = "[OK] 已添加 profile_avatar 设置";
        echo end($fixes) . PHP_EOL;
    } else {
        echo "[SKIP] profile_avatar 设置已存在" . PHP_EOL;
    }

    echo PHP_EOL . "--- 2.1 为 article_likes 表添加 user_id 字段 ---" . PHP_EOL;

    $likesColumns = $pdo->query("PRAGMA table_info(article_likes)")->fetchAll(PDO::FETCH_ASSOC);
    $likesColumnNames = array_column($likesColumns, 'name');

    if (!in_array('user_id', $likesColumnNames)) {
        $pdo->exec("ALTER TABLE article_likes ADD COLUMN user_id INTEGER");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_article_likes_user ON article_likes(user_id)");
        $fixes[] = "[OK] 已为 article_likes 表添加 user_id 字段";
        echo end($fixes) . PHP_EOL;
    } else {
        echo "[SKIP] article_likes.user_id 字段已存在" . PHP_EOL;
    }

    echo PHP_EOL . "--- 3. 添加性能优化索引 ---" . PHP_EOL;

    $indexesToAdd = [
        'idx_articles_slug' => 'CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)',
        'idx_articles_status' => 'CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status)',
        'idx_articles_author' => 'CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id)',
        'idx_comments_article' => 'CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id)',
        'idx_comments_status' => 'CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)',
        'idx_article_likes_article' => 'CREATE INDEX IF NOT EXISTS idx_article_likes_article ON article_likes(article_id)',
        'idx_article_likes_ip' => 'CREATE INDEX IF NOT EXISTS idx_article_likes_ip ON article_likes(ip_address)',
        'idx_categories_parent' => 'CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)',
        'idx_comments_parent' => 'CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id)',
    ];

    foreach ($indexesToAdd as $name => $sql) {
        try {
            $pdo->exec($sql);
            echo "[OK] 已添加索引: {$name}" . PHP_EOL;
        } catch (\Exception $e) {
            echo "[WARN] 索引 {$name} 创建失败: " . $e->getMessage() . PHP_EOL;
        }
    }

    echo PHP_EOL . "--- 4. 验证修复结果 ---" . PHP_EOL;

    $validationPassed = true;

    foreach (['users', 'articles', 'comments'] as $table) {
        $tableSql = $pdo->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='{$table}'")->fetch();
        if (strpos($tableSql['sql'], 'CHECK') !== false) {
            echo "[OK] {$table} 表 CHECK 约束验证通过" . PHP_EOL;
        } else {
            echo "[FAIL] {$table} 表仍然缺少 CHECK 约束" . PHP_EOL;
            $validationPassed = false;
        }
    }

    $fkCheck = $pdo->query('PRAGMA foreign_key_check')->fetchAll(PDO::FETCH_ASSOC);
    if (empty($fkCheck)) {
        echo "[OK] 外键约束验证通过" . PHP_EOL;
    } else {
        echo "[FAIL] 外键约束存在问题" . PHP_EOL;
        $validationPassed = false;
    }

    echo PHP_EOL . "=== 修复完成 ===" . PHP_EOL;
    echo "成功修复项: " . count($fixes) . PHP_EOL;
    echo "错误项: " . count($errors) . PHP_EOL;
    echo "验证状态: " . ($validationPassed ? '全部通过' : '存在异常') . PHP_EOL;
    echo "结束时间: " . date('Y-m-d H:i:s') . PHP_EOL;

    if (!empty($errors)) {
        echo PHP_EOL . "=== 错误详情 ===" . PHP_EOL;
        foreach ($errors as $error) {
            echo "- {$error}" . PHP_EOL;
        }
    }

} catch (\Exception $e) {
    echo PHP_EOL . "[FATAL] 修复脚本执行失败: " . $e->getMessage() . PHP_EOL;
    echo "堆栈跟踪:" . PHP_EOL . $e->getTraceAsString() . PHP_EOL;
    exit(1);
}
