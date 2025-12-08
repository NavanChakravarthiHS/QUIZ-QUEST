# Quick Start Guide

This guide will help you quickly set up and run the QuizQuest platform on your local machine.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git
- npm or yarn

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd quiz-platform
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following content:

```
MONGODB_URI=mongodb://localhost:27017/quiz-platform
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

### 3. Frontend Setup

Open a new terminal window, navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory with the following content:

```
VITE_API_URL=http://localhost:5000
```

### 4. Start MongoDB

Make sure MongoDB is running on your system. If you haven't installed it yet, follow the official MongoDB installation guide for your operating system.

### 5. Run the Application

#### Terminal 1 - Start Backend Server
```bash
cd backend
npm start
```

#### Terminal 2 - Start Frontend Development Server
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Sample Data

To quickly test the application with sample data:

1. Make sure the backend server is running
2. In a new terminal, run:
   ```bash
   cd backend
   node sample-data.js
   ```

This script creates:
- Teacher account: `teacher@quiz.com` / `password123`
- Student account: `student@quiz.com` / `password123`
- 3 sample quizzes

## First Time Usage

### For Teachers
1. Go to http://localhost:3000
2. Click on "Teacher Login"
3. Use the sample credentials: `teacher@quiz.com` / `password123`
4. Create your first quiz using the "Create New Quiz" button

### For Students
1. Go to http://localhost:3000
2. Click on "Student Login"
3. Use the sample credentials: `student@quiz.com` / `password123`
4. Browse available quizzes and start taking them

## Troubleshooting

### Common Issues

1. **Port already in use**: If you see "Port already in use" errors, the application will automatically try different ports. Check the terminal output for the actual port being used.

2. **MongoDB connection error**: Ensure MongoDB is running and the connection string in your `.env` file is correct.

3. **CORS errors**: The application should work out of the box with the provided configuration. If you encounter CORS issues, check that both frontend and backend are running.

4. **Blank page or loading issues**: Clear your browser cache and refresh. Make sure both frontend and backend servers are running.

### Need Help?

If you encounter any issues not covered here:
1. Check the browser console for error messages
2. Check the terminal outputs for error messages
3. Ensure all prerequisites are installed and running
4. Verify your `.env` files are correctly configured

## Next Steps

After successfully running the application:
1. Explore the teacher dashboard to create quizzes
2. Test the student experience by taking quizzes
3. Review the codebase structure in the [Project Structure](PROJECT_STRUCTURE.md) document
4. Check out the [Teacher Guide](TEACHER_GUIDE.md) for detailed instructions on quiz creation
5. Refer to the [Technical Documentation](TECHNICAL.md) for API details and architecture information