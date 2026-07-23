# deploy.ps1
Write-Host "🚀 Starting deployment of G.S BTR RWAMIKO TSS..." -ForegroundColor Cyan

# Pull latest changes
Write-Host "📦 Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

# Build and deploy with Docker
Write-Host "🐳 Building and deploying with Docker..." -ForegroundColor Yellow
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
docker-compose exec backend npx prisma migrate deploy

# Run database seeding
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
docker-compose exec backend npx prisma db seed

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Website is available at http://localhost" -ForegroundColor Cyan
