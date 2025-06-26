#!/bin/bash
# SportBeaconAI Dev Bootstrap Script
set -e

echo "Cloning SportBeaconAI repository..."
git clone https://github.com/SportBeaconAI/sportbeacon .

if [ -f .env.example ]; then
  cp .env.example .env
fi

echo "Initializing Firebase..."
npm install -g firebase-tools
firebase login --no-localhost || true
firebase init

echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Starting development server..."
npm run dev || echo "Run backend and frontend dev servers as needed." 