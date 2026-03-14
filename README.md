# Worker Salary Management System

A comprehensive full-stack application for managing worker salaries, attendance, and advance payments.

## Project Structure

```
worker-salary-app/
├── backend/           # Node.js + Express API server
├── frontend/          # React frontend application
└── README.md         # Project documentation
```

## Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   node server.js
   ```
   
   The backend server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will run on `http://localhost:5173`

## Dependencies

### Backend Dependencies
- **express** (^5.2.1) - Web framework for Node.js
- **sqlite3** (^5.1.7) - SQLite database driver
- **cors** (^2.8.6) - Cross-origin resource sharing middleware
- **body-parser** (^2.2.2) - Request body parsing middleware

### Frontend Dependencies
- **react** (^19.2.0) - JavaScript library for building user interfaces
- **react-dom** (^19.2.0) - React DOM renderer
- **axios** (^1.13.6) - HTTP client for API requests
- **jspdf** (^2.5.1) - PDF generation library
- **jspdf-autotable** (^3.5.31) - Table plugin for jsPDF
- **vite** (^7.3.1) - Build tool and development server

## Features

- **Site Management**: Create and manage multiple work sites
- **Worker Management**: Add workers with individual salary rates
- **Attendance Tracking**: Record daily attendance and calculate wages
- **Advance Payments**: Track advance payments given to workers
- **PDF Reports**: Generate professional attendance reports
- **Auto-save**: Automatic saving of attendance data
- **Responsive UI**: Mobile-friendly interface

## API Endpoints

### Sites
- `GET /sites` - Get all sites
- `POST /sites` - Create new site
- `DELETE /sites/:id` - Delete site

### Workers
- `GET /workers/site/:siteId` - Get workers for a site
- `POST /workers` - Add new worker
- `PUT /workers/:id` - Update worker
- `DELETE /workers/:id` - Delete worker

### Attendance
- `GET /attendance/:siteId/:date` - Get attendance for site and date
- `POST /attendance` - Save attendance
- `PUT /attendance/:id` - Update attendance

### Advances
- `GET /advances/:workerId/:month/:year` - Get advances for worker
- `POST /advances` - Add new advance
- `DELETE /advances/:id` - Delete advance

## Database

Uses SQLite database with the following tables:
- **sites** - Work site information
- **workers** - Worker details with individual rates
- **attendance** - Daily attendance records
- **advances** - Advance payment records

## Development Commands

### Backend
```bash
# Install dependencies
npm install

# Start server
node server.js
```

### Frontend
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Troubleshooting

1. **Port conflicts**: If port 3001 is in use, kill the process or modify the port in server.js
2. **CORS errors**: Ensure backend server is running before starting frontend
3. **Database issues**: Delete salary.db file to reset database
4. **PDF generation**: Ensure jspdf and jspdf-autotable are properly installed

## License

ISC License