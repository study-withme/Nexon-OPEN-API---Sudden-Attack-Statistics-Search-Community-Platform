#!/bin/bash
# Cloudflare Pages 빌드 스크립트
set -e

echo "📦 Installing dependencies..."
cd frontend
npm ci

echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"

