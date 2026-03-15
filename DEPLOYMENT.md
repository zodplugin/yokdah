# Deployment Guide

## Production Deployment Checklist

### Prerequisites

Before deploying to production, ensure you have:

1. **Domain names** configured
2. **SSL certificates** installed (Let's Encrypt recommended)
3. **Database hosting** (MongoDB Atlas or self-hosted)
4. **Redis instance** (Redis Cloud or self-hosted)
5. **Cloudflare R2** account configured
6. **Resend** API key for emails
7. **Environment variables** properly set

### Environment Variables

Update `.env` with production values:

```env
# API Configuration
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/fomoin?retryWrites=true&w=majority

# Redis
REDIS_URI=rediss://default:password@host:port

# Authentication
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=30d

# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Storage (Cloudflare R2)
AWS_ACCESS_KEY_ID=<r2-access-key>
AWS_SECRET_ACCESS_KEY=<r2-secret-key>
AWS_REGION=auto
R2_BUCKET_NAME=fomoin-uploads
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# URLs
BASE_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

Update `apps/web/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user with appropriate permissions
4. Get connection string
5. Update `MONGODB_URI` in `.env`
6. Enable IP whitelist (0.0.0.0/0 for all, or specific server IPs)

### Redis Setup

Option 1: Redis Cloud
1. Sign up at redis.com/cloud
2. Create a new database
3. Get connection string
4. Update `REDIS_URI` in `.env`

Option 2: Self-hosted
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Cloudflare R2 Setup

1. Log in to Cloudflare Dashboard
2. Go to R2 > Create bucket
3. Create bucket named `fomoin-uploads`
4. Go to R2 > Manage R2 API Tokens
5. Create API token with permissions:
   - Object Read & Write
   - Note the Access Key ID and Secret Access Key
6. Update environment variables

### Resend Setup

1. Sign up at resend.com
2. Verify your sending domain
3. Create API key
4. Update `RESEND_API_KEY` in `.env`
5. Update `RESEND_FROM_EMAIL` with verified domain

## Deployment Options

### Option 1: Docker Compose (Simple)

1. Build and start containers:
```bash
docker-compose -f docker-compose.yml up -d --build
```

2. Configure reverse proxy (nginx example):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Kubernetes (Scalable)

1. Create namespace:
```bash
kubectl create namespace fomoin
```

2. Create secrets:
```bash
kubectl create secret generic fomoin-secrets \
  --from-literal=jwt-secret=your-secret \
  --from-literal=mongodb-uri=your-mongodb-uri \
  --from-literal=redis-uri=your-redis-uri \
  --from-literal=resend-api-key=your-resend-key \
  --namespace=fomoin
```

3. Deploy:
```bash
kubectl apply -f k8s/ -n fomoin
```

### Option 3: VPS (Ubuntu)

1. Install Docker and Docker Compose
2. Clone repository
3. Set up environment variables
4. Run Docker Compose
5. Configure nginx reverse proxy
6. Set up SSL with Certbot

## SSL Certificate Setup

Using Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate for main domain
sudo certbot certonly --standalone -d yourdomain.com

# Get certificate for API domain
sudo certbot certonly --standalone -d api.yourdomain.com

# Auto-renewal is configured automatically
```

## Monitoring & Logging

### Application Monitoring

Consider setting up:
- **Sentry** for error tracking
- **Grafana** for metrics visualization
- **Prometheus** for metrics collection
- **ELK Stack** for log aggregation

### Health Checks

Backend health endpoint:
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Best Practices

1. **Use strong JWT secrets**
2. **Enable rate limiting**
3. **Implement CORS properly**
4. **Use HTTPS only**
5. **Keep dependencies updated**
6. **Regular security audits**
7. **Input validation on all endpoints**
8. **Sanitize user inputs**
9. **Implement proper authentication**
10. **Use environment variables for secrets**

## Backup Strategy

### MongoDB Backup

```bash
# Manual backup
mongodump --uri="mongodb://user:pass@host:27017/fomoin" --out=/backup/fomoin

# Restore
mongorestore --uri="mongodb://user:pass@host:27017/fomoin" /backup/fomoin
```

Set up automated backups:
- MongoDB Atlas (built-in)
- Cron job for self-hosted
```bash
0 2 * * * mongodump --uri="mongodb://..." --out=/backup/fomoin
```

### File Storage Backup

R2 objects are replicated, but for additional safety:
- Enable versioning in R2 bucket
- Regular sync to backup location

## Scaling

### Horizontal Scaling

1. **API Server**: Deploy multiple instances behind load balancer
2. **Redis**: Use Redis Cluster for high availability
3. **MongoDB**: Use replica sets for high availability

### Vertical Scaling

Increase server resources:
- CPU: 4+ cores recommended
- RAM: 8GB+ recommended
- Storage: SSD recommended

## Performance Optimization

1. **Enable MongoDB indexes** (already configured in models)
2. **Use Redis caching** for frequently accessed data
3. **Implement CDN** for static assets
4. **Enable gzip compression** in nginx
5. **Optimize images** before upload
6. **Use connection pooling** for database
7. **Monitor and optimize slow queries**

## Troubleshooting

### Common Issues

1. **Socket.io connection issues**:
   - Check CORS configuration
   - Verify WebSocket support in reverse proxy
   - Check firewall settings

2. **Database connection errors**:
   - Verify MongoDB URI is correct
   - Check IP whitelist
   - Ensure cluster is running

3. **Job queue issues**:
   - Verify Redis connection
   - Check BullMQ workers are running
   - Review job logs

4. **Email not sending**:
   - Verify Resend API key
   - Check domain verification
   - Review email content compliance

## Rollback Procedure

1. **Database rollback**:
```bash
mongorestore --uri="mongodb://..." /backup/fomoin/previous-version
```

2. **Application rollback**:
```bash
# Docker
docker-compose down
docker-compose pull
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/api -n fomoin
kubectl rollout undo deployment/web -n fomoin
```

## Maintenance

### Regular Tasks

- **Daily**: Monitor error logs and system metrics
- **Weekly**: Review backups and disk space
- **Monthly**: Update dependencies, review security
- **Quarterly**: Performance audit, cost optimization

### Updates

```bash
# Update dependencies
cd apps/api && npm update
cd apps/web && npm update

# Rebuild and deploy
docker-compose build
docker-compose up -d
```

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Review this guide
3. Check API documentation
4. Open GitHub issue