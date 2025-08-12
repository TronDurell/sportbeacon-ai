#!/bin/bash

echo "🔄 SportBeaconAI Rollback & Snapshot Manager"

SNAPSHOT_DIR="deploy_snapshots"

# Function to list available snapshots
list_snapshots() {
  echo "📋 Available snapshots:"
  if [ -d "$SNAPSHOT_DIR" ]; then
    ls -la "$SNAPSHOT_DIR" | grep "dist-" | awk '{print $9}' | sort -r
  else
    echo "❌ No snapshots directory found"
  fi
}

# Function to restore a snapshot
restore_snapshot() {
  local snapshot_name=$1
  
  if [ -z "$snapshot_name" ]; then
    echo "❌ Please provide a snapshot name"
    echo "💡 Usage: ./rollback.sh restore <snapshot-name>"
    echo "💡 Example: ./rollback.sh restore dist-20250715-183000"
    exit 1
  fi
  
  local snapshot_path="$SNAPSHOT_DIR/$snapshot_name"
  
  if [ ! -d "$snapshot_path" ]; then
    echo "❌ Snapshot '$snapshot_name' not found"
    list_snapshots
    exit 1
  fi
  
  echo "🔄 Restoring snapshot: $snapshot_name"
  rm -rf dist
  cp -r "$snapshot_path" dist
  echo "✅ Snapshot restored to dist/"
  echo "🚀 Ready to deploy with: firebase deploy --only hosting"
}

# Function to deploy restored snapshot
deploy_restored() {
  if [ ! -d "dist" ]; then
    echo "❌ No dist/ folder found. Restore a snapshot first."
    exit 1
  fi
  
  echo "🚀 Deploying restored snapshot to Firebase..."
  firebase deploy --only hosting
  echo "✅ Rollback deployment complete!"
}

# Main script logic
case "$1" in
  "list")
    list_snapshots
    ;;
  "restore")
    restore_snapshot "$2"
    ;;
  "deploy")
    deploy_restored
    ;;
  *)
    echo "🔄 SportBeaconAI Rollback Manager"
    echo ""
    echo "Usage:"
    echo "  ./rollback.sh list                    - List available snapshots"
    echo "  ./rollback.sh restore <snapshot>      - Restore a snapshot to dist/"
    echo "  ./rollback.sh deploy                  - Deploy the restored snapshot"
    echo ""
    echo "Examples:"
    echo "  ./rollback.sh list"
    echo "  ./rollback.sh restore dist-20250715-183000"
    echo "  ./rollback.sh deploy"
    ;;
esac 