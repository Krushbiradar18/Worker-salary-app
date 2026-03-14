# Dependency Management Guide

## About Node.js Dependencies

In Node.js projects, dependencies are managed through `package.json` files (equivalent to Python's `requirements.txt`). Your project already has these files:

- `/backend/package.json` - Backend dependencies
- `/frontend/package.json` - Frontend dependencies

## Quick Setup Commands

### Option 1: Using existing package.json files (Recommended)
```bash
# Backend setup
cd backend
npm install

# Frontend setup  
cd frontend
npm install
```

### Option 2: Using the setup script
```bash
# Make sure you're in the project root directory
chmod +x setup.sh
./setup.sh
```

### Option 3: Manual installation from requirements.txt
```bash
# Backend
cd backend
npm install express@^5.2.1 sqlite3@^5.1.7 cors@^2.8.6 body-parser@^2.2.2

# Frontend
cd frontend
npm install react@^19.2.0 react-dom@^19.2.0 axios@^1.13.6 jspdf@^2.5.1 jspdf-autotable@^3.5.31
npm install --save-dev vite@^7.3.1 @vitejs/plugin-react@^5.1.1 eslint@^9.39.1
```

## Key Differences from Python

| Python | Node.js |
|--------|---------|
| `requirements.txt` | `package.json` |
| `pip install -r requirements.txt` | `npm install` |
| `pip freeze > requirements.txt` | `npm list --depth=0` |
| Virtual environments (venv) | node_modules folder |

## Important Files Created

1. **README.md** - Complete project documentation
2. **backend/requirements.txt** - Backend dependencies list
3. **frontend/requirements.txt** - Frontend dependencies list  
4. **setup.sh** - Automated setup script

## Next Steps

1. Run `npm install` in both backend and frontend directories
2. Start backend with `node server.js` 
3. Start frontend with `npm run dev`
4. Your application will be ready to use!

The system includes all features:
- Site and worker management
- Attendance tracking with individual rates
- Advance payment system
- PDF report generation
- Auto-save functionality