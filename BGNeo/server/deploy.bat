@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ======================================
echo   BGNeo Blog System Deployment Script
echo ======================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

set PHP_MIN_VERSION=8.5

echo [INFO] Checking PHP version...
php -r "echo PHP_VERSION;" > temp_version.txt
set /p PHP_VERSION=<temp_version.txt
del temp_version.txt

echo [INFO] PHP version: %PHP_VERSION%

echo [INFO] Checking required extensions...
php -m | findstr /i "pdo" >nul
if errorlevel 1 (
    echo [ERROR] Extension pdo is missing
    exit /b 1
)
echo [INFO] Extension pdo OK

php -m | findstr /i "redis" >nul
if errorlevel 1 (
    echo [WARNING] Extension redis is missing (optional but recommended)
) else (
    echo [INFO] Extension redis OK
)

if not exist composer.phar (
    echo [INFO] Downloading Composer...
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    php composer-setup.php
    php -r "unlink('composer-setup.php');"
)

echo [INFO] Installing dependencies...
php composer.phar install --prefer-dist --no-progress --optimize-autoloader

if not exist .env (
    echo [WARNING] .env file not found. Creating from .env.example...
    copy .env.example .env
    
    echo [WARNING] Please edit .env file and set:
    echo   - JWT_SECRET ^(use: openssl rand -hex 32^)
    echo   - DB_PATH
    echo   - REDIS_HOST
    echo   - APP_ENV=production
    echo   - APP_DEBUG=false
    echo.
    pause
)

echo [INFO] Initializing database...
php init_db.php

echo [INFO] Setting directory permissions...
if not exist storage (
    mkdir storage
)
if not exist uploads (
    mkdir uploads
)
if not exist storage\logs (
    mkdir storage\logs
)

echo [INFO] Clearing cache...
if exist storage\cache (
    rmdir /s /q storage\cache
)

echo [INFO] Running security check...
if exist security_check.php (
    php security_check.php
    if errorlevel 1 (
        echo [ERROR] Security check failed
        exit /b 1
    )
)

echo.
echo [INFO] Deployment completed successfully!
echo.
echo Next steps:
echo   1. Edit .env file if you haven't already
echo   2. Configure your web server to point to the 'public' directory
echo   3. Start the PHP built-in server: php -S localhost:3000 -t public
echo.

pause
