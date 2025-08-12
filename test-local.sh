#!/bin/bash

echo "🧪 SportBeaconAI Local Test Script"

# Check if dist/ exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ folder not found. Building first..."
  npm run build
fi

# Check if serve is installed
if ! command -v npx &> /dev/null; then
  echo "❌ npx not found. Please install Node.js"
  exit 1
fi

echo "🌐 Starting local server..."
echo "📱 Your app will be available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the local server
npx serve dist -p 3000 