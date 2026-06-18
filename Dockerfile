# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
COPY public/ ./public/
COPY postcss.config.js ./
COPY tailwind.config.js ./
ENV REACT_APP_API_URL=/api
ENV REACT_APP_STORAGE_URL=/storage
RUN npm run build

# Stage 2: Final PHP image
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    ca-certificates \
    default-mysql-client

# Download TiDB CA Certificate
RUN curl -o /usr/local/share/ca-certificates/tidb-ca.crt https://ti-db-cloud-docs.s3.us-east-1.amazonaws.com/root.crt && update-ca-certificates

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Redis extension for cache/queue backends
RUN pecl install redis \
    && docker-php-ext-enable redis

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy Laravel application files
COPY app/ ./app/
COPY bootstrap/ ./bootstrap/
COPY config/ ./config/
COPY database/ ./database/
COPY public_html/ ./public_html/
COPY resources/ ./resources/
COPY routes/ ./routes/
COPY storage/ ./storage/
COPY artisan composer.* ./

# Copy built frontend assets from frontend-builder stage directly into Laravel's public directory
COPY --from=frontend-builder /app/build/ ./public_html/

# Install PHP dependencies
RUN composer install --optimize-autoloader --no-dev

# Copy nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Create storage link
RUN php artisan storage:link || true

# Expose port
EXPOSE 10000

# Copy deploy script
COPY deploy.sh /usr/local/bin/deploy.sh
RUN sed -i 's/\r$//' /usr/local/bin/deploy.sh
RUN chmod +x /usr/local/bin/deploy.sh

# Start using deploy script
CMD ["/usr/local/bin/deploy.sh"]

