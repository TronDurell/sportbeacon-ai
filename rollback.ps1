# SportBeaconAI Rollback & Snapshot Manager (PowerShell)

Write-Host "🔄 SportBeaconAI Rollback & Snapshot Manager" -ForegroundColor Green

$SNAPSHOT_DIR = "deploy_snapshots"

# Function to list available snapshots
function List-Snapshots {
    Write-Host "📋 Available snapshots:" -ForegroundColor Cyan
    if (Test-Path $SNAPSHOT_DIR) {
        Get-ChildItem -Path $SNAPSHOT_DIR -Directory | Where-Object { $_.Name -like "dist-*" } | Sort-Object Name -Descending | ForEach-Object {
            Write-Host "  $($_.Name)" -ForegroundColor White
        }
    } else {
        Write-Host "❌ No snapshots directory found" -ForegroundColor Red
    }
}

# Function to restore a snapshot
function Restore-Snapshot {
    param([string]$SnapshotName)
    
    if (-not $SnapshotName) {
        Write-Host "❌ Please provide a snapshot name" -ForegroundColor Red
        Write-Host "💡 Usage: .\rollback.ps1 restore <snapshot-name>" -ForegroundColor Yellow
        Write-Host "💡 Example: .\rollback.ps1 restore dist-20250715-183000" -ForegroundColor Yellow
        exit 1
    }
    
    $snapshotPath = Join-Path $SNAPSHOT_DIR $SnapshotName
    
    if (-not (Test-Path $snapshotPath)) {
        Write-Host "❌ Snapshot '$SnapshotName' not found" -ForegroundColor Red
        List-Snapshots
        exit 1
    }
    
    Write-Host "🔄 Restoring snapshot: $SnapshotName" -ForegroundColor Yellow
    if (Test-Path "dist") {
        Remove-Item -Path "dist" -Recurse -Force
    }
    Copy-Item -Path $snapshotPath -Destination "dist" -Recurse -Force
    Write-Host "✅ Snapshot restored to dist/" -ForegroundColor Green
    Write-Host "🚀 Ready to deploy with: firebase deploy --only hosting" -ForegroundColor Cyan
}

# Function to deploy restored snapshot
function Deploy-Restored {
    if (-not (Test-Path "dist")) {
        Write-Host "❌ No dist/ folder found. Restore a snapshot first." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "🚀 Deploying restored snapshot to Firebase..." -ForegroundColor Yellow
    firebase deploy --only hosting
    Write-Host "✅ Rollback deployment complete!" -ForegroundColor Green
}

# Main script logic
$action = $args[0]
$snapshotName = $args[1]

switch ($action) {
    "list" {
        List-Snapshots
    }
    "restore" {
        Restore-Snapshot -SnapshotName $snapshotName
    }
    "deploy" {
        Deploy-Restored
    }
    default {
        Write-Host "🔄 SportBeaconAI Rollback Manager" -ForegroundColor Green
        Write-Host ""
        Write-Host "Usage:" -ForegroundColor White
        Write-Host "  .\rollback.ps1 list                    - List available snapshots" -ForegroundColor Cyan
        Write-Host "  .\rollback.ps1 restore <snapshot>      - Restore a snapshot to dist/" -ForegroundColor Cyan
        Write-Host "  .\rollback.ps1 deploy                  - Deploy the restored snapshot" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor White
        Write-Host "  .\rollback.ps1 list" -ForegroundColor Yellow
        Write-Host "  .\rollback.ps1 restore dist-20250715-183000" -ForegroundColor Yellow
        Write-Host "  .\rollback.ps1 deploy" -ForegroundColor Yellow
    }
} 