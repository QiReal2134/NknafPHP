#!/bin/bash

set -e

echo "======================================"
echo "  BGNeo Blog System Deployment Script"
echo "======================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_php_version() {
    local php_version=$(php -r 'echo PHP_VERSION;')
    local required_version="8.5"
    
    if version_gt "$required_version" "$php_version"; then
        log_error "PHP version $php_version is too low. Required: >= $required_version"
        exit 1
    fi
    
    log_info "PHP version: $php_version ✓"
}

version_gt() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

check_extensions() {
    local required_extensions=("pdo" "pdo_sqlite" "redis" "json" "mbstring")
    
    for ext in "${required_extensions[@]}"; do
        if php -m | grep -qi "$ext"; then
            log_info "Extension $ext ✓"
        else
            log_error "Extension $ext is missing"
            exit 1
        fi
    done
}

install_dependencies() {
    log_info "Installing Composer dependencies..."
    
    if [ ! -f composer.phar ]; then
        curl -sS https://getcomposer.org/installer | php
    fi
    
    php composer.phar install --prefer-dist --no-progress --optimize-autoloader
    
    log_info "Dependencies installed ✓"
}

setup_environment() {
    if [ ! -f .env ]; then
        log_warn ".env file not found. Creating from .env.example..."
        cp .env.example .env
        
        log_warn "Please edit .env file and set:"
        echo "  - JWT_SECRET (use: openssl rand -hex 32)"
        echo "  - DB_PATH"
        echo "  - REDIS_HOST"
        echo "  - APP_ENV=production"
        echo "  - APP_DEBUG=false"
        
        read -p "Press Enter after you've edited .env file..."
    fi
}

initialize_database() {
    log_info "Initializing database..."
    php init_db.php
    log_info "Database initialized ✓"
}

set_permissions() {
    log_info "Setting directory permissions..."
    
    chmod -R 755 storage
    chmod -R 755 uploads
    chmod 644 .env
    
    log_info "Permissions set ✓"
}

run_security_check() {
    log_info "Running security check..."
    
    if [ -f security_check.php ]; then
        php security_check.php
        
        if [ $? -ne 0 ]; then
            log_error "Security check failed. Please fix the issues above."
            exit 1
        fi
    fi
    
    log_info "Security check passed ✓"
}

clear_cache() {
    log_info "Clearing cache..."
    
    rm -rf storage/cache/*
    rm -rf storage/logs/*
    
    log_info "Cache cleared ✓"
}

run_tests() {
    log_info "Running tests..."
    
    if [ -f vendor/bin/phpunit ]; then
        vendor/bin/phpunit --testdox
        
        if [ $? -ne 0 ]; then
            log_error "Tests failed"
            exit 1
        fi
    fi
    
    log_info "Tests passed ✓"
}

main() {
    log_info "Starting deployment..."
    echo ""
    
    check_php_version
    echo ""
    
    check_extensions
    echo ""
    
    install_dependencies
    echo ""
    
    setup_environment
    echo ""
    
    initialize_database
    echo ""
    
    set_permissions
    echo ""
    
    clear_cache
    echo ""
    
    run_security_check
    echo ""
    
    echo ""
    log_info "Deployment completed successfully! ✓"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env file if you haven't already"
    echo "  2. Configure your web server to point to the 'public' directory"
    echo "  3. Start the PHP built-in server: php -S localhost:3000 -t public"
    echo ""
}

main "$@"
