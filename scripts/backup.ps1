# backup.ps1
Write-Host "💾 Starting database backup..." -ForegroundColor Cyan

 = ".\backups"
 = Get-Date -Format "yyyyMMdd_HHmmss"
 = "\gs_btr_rwamiko_.sql"

New-Item -Path  -ItemType Directory -Force | Out-Null

docker-compose exec -T postgres pg_dump -U gs_user gs_btr_rwamiko > 

# Compress backup
Compress-Archive -Path  -DestinationPath ".zip" -Force
Remove-Item -Path 

Write-Host "✅ Backup complete: .zip" -ForegroundColor Green
