# Complete Setup Guide

This comprehensive guide will walk you through setting up the QuizQuest platform on your local development environment.

## System Requirements

### Minimum Requirements
- Node.js: v14.x or higher
- MongoDB: v4.4 or higher
- npm: v6.x or higher (comes with Node.js)
- Git: v2.x or higher
- 4GB RAM minimum
- 500MB free disk space

### Recommended Specifications
- Node.js: v16.x or v18.x
- MongoDB: v5.x or v6.x
- 8GB RAM or higher
- SSD storage for better performance

## Installation Process

### Step 1: Install Prerequisites

#### Install Node.js
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version (recommended)
3. Run the installer and follow the setup wizard
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Install MongoDB
Choose one of the following methods:

**Option A: MongoDB Community Server (Local Installation)**
1. Visit [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Download the appropriate version for your OS
3. Run the installer with default settings
4. Start MongoDB service

**Option B: MongoDB Atlas (Cloud - Recommended for beginners)**
1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Configure network access and database user
4. Get your connection string

#### Install Git
1. Visit [git-scm.com](https://git-scm.com/)
2. Download Git for your operating system
3. Run the installer with default settings
4. Verify installation:
   ```bash
   git --version
   ```

### Step 2: Clone the Repository

```bash
git clone <repository-url>
cd quiz-platform
```

### Step 3: Backend Configuration

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the backend directory:
```bash
# For local MongoDB installation
MONGODB_URI=mongodb://localhost:27017/quiz-platform
JWT_SECRET=your-very-secure-secret-key-change-this-in-production
PORT=5000

# For MongoDB Atlas (if using cloud database)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quiz-platform
```

**Important Security Note**: Change the JWT_SECRET to a strong, unique secret in production environments.

### Step 4: Frontend Configuration

Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the frontend directory:
```bash
VITE_API_URL=http://localhost:5000
```

If you're running the backend on a different port or host, update the VITE_API_URL accordingly.

### Step 5: Database Setup

#### For Local MongoDB Installation
1. Ensure MongoDB service is running
2. The application will automatically create the database and collections on first run

#### For MongoDB Atlas
1. Update your `.env` file with the Atlas connection string
2. Ensure your IP is whitelisted in Atlas network access settings

### Step 6: Run the Application

#### Terminal 1 - Start Backend Server
```bash
cd backend
npm start
```

Expected output:
```
Server running on port 5000
Connected to MongoDB
```

#### Terminal 2 - Start Frontend Development Server
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v4.x.x ready in xxx ms

➜ Local: http://localhost:3000/
➜ Network: use --host to expose
```

### Step 7: Populate Sample Data (Optional)

To quickly test the application with sample data:

1. Ensure the backend server is running
2. In a new terminal, run:
   ```bash
   cd backend
   node sample-data.js
   ```

This creates:
- Teacher account: `teacher@quiz.com` / `password123`
- Student account: `student@quiz.com` / `password123`
- Sample quizzes with various question types and timing modes

## Project Structure

```
quiz-platform/
├── backend/
│   ├── middleware/     # Authentication middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── .env            # Environment variables
│   ├── server.js       # Main server file
│   └── sample-data.js  # Sample data generator
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── pages/      # Page components
    │   ├── services/   # API service functions
    │   ├── App.jsx     # Main app component
    │   └── main.jsx    # Entry point
    ├── .env            # Environment variables
    └── vite.config.js  # Vite configuration
```

## Configuration Options

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/quiz-platform |
| JWT_SECRET | Secret key for JWT tokens | your-secret-key |
| PORT | Server port | 5000 |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API base URL | http://localhost:5000 |

## Development Workflow

### Backend Development
1. Make changes to files in the `backend/` directory
2. The server will automatically restart with nodemon (if using `npm run dev`)
3. For manual restart: `npm start`

### Frontend Development
1. Make changes to files in the `frontend/src/` directory
2. The development server will automatically reload with hot module replacement
3. Changes are reflected immediately in the browser

### Code Quality
- The project uses ESLint for JavaScript code quality
- Follow the existing code style and patterns
- Run `npm run lint` to check for issues

## Testing the Application

### Teacher Workflow
1. Navigate to http://localhost:3000
2. Click "Teacher Login"
3. Use credentials: `teacher@quiz.com` / `password123`
4. Create a new quiz using the "Create New Quiz" button
5. View, edit, or delete existing quizzes

### Student Workflow
1. Navigate to http://localhost:3000
2. Click "Student Login"
3. Use credentials: `student@quiz.com` / `password123`
4. Browse available quizzes
5. Start a quiz and complete within the time limit
6. View results immediately after submission

## Security Considerations

### Production Deployment
1. Change all default passwords and secrets
2. Use HTTPS in production
3. Implement proper rate limiting
4. Set up proper CORS policies
5. Regular security audits
6. Keep dependencies updated

### Data Protection
1. Passwords are hashed using bcrypt
2. JWT tokens are used for authentication
3. Sensitive data is not exposed in API responses
4. Input validation prevents injection attacks

## Troubleshooting

### Common Issues and Solutions

1. **MongoDB Connection Failed**
   - Ensure MongoDB service is running
   - Check connection string in `.env` file
   - Verify network connectivity

2. **Port Already in Use**
   - Change PORT in backend `.env` file
   - Kill processes using the port:
     ```bash
     # On Windows
     netstat -ano | findstr :5000
     taskkill /PID <process_id> /F
     
     # On macOS/Linux
     lsof -i :5000
     kill -9 <process_id>
     ```

3. **CORS Errors**
   - Check that both frontend and backend servers are running
   - Verify VITE_API_URL in frontend `.env` file
   - Check CORS configuration in backend

4. **Blank Page or Loading Issues**
   - Clear browser cache
   - Check browser console for errors
   - Restart both frontend and backend servers

5. **Authentication Errors**
   - Ensure JWT_SECRET is consistent between environments
   - Check browser storage for token issues
   - Verify user credentials

### Debugging Tips

1. **Check Terminal Outputs**: Both frontend and backend terminals show important logs
2. **Browser Developer Tools**: Use console and network tabs for debugging
3. **MongoDB Compass**: Use GUI tool to inspect database contents
4. **Postman**: Test API endpoints directly

## Next Steps

After successful setup:
1. Explore the codebase structure
2. Review the [Teacher Guide](TEACHER_GUIDE.md) for detailed quiz creation instructions
3. Check the [API Documentation](BACKEND_README.md) for technical details
4. Review the [Project Summary](PROJECT_SUMMARY.md) for architecture overview
5. Start customizing the application for your specific needs

## Support

If you encounter issues not covered in this guide:
1. Check the GitHub issues for similar problems
2. Review the browser console and terminal outputs
3. Ensure all prerequisites are correctly installed
4. Verify your configuration files
5. Reach out to the development team if needed