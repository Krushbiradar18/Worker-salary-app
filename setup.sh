#!/bin/bash

# Worker Salary Management System Setup Script

echo "🚀 Setting up Worker Salary Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend
if [ -f "package.json" ]; then
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend package.json not found"
    exit 1
fi

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd ../frontend
if [ -f "package.json" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend package.json not found"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start Backend:  cd backend && node server.js"
echo "2. Start Frontend: cd frontend && npm run dev"
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:5173"