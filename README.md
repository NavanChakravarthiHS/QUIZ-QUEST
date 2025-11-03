# QuizQuest - Secure Online Quiz Platform

QuizQuest is a comprehensive online quiz platform designed for educational institutions with robust security features, flexible timing options, and detailed result tracking.

## 🌟 Key Features

1. **Role-Based Access**: Separate interfaces for students and teachers
2. **Flexible Timing**: Choose between total time mode or per-question timers
3. **Anti-Cheating Measures**: Tab-switch detection with auto-submission after 3 switches
4. **Direct Quiz Access**: Students can directly access quizzes through their dashboard
5. **Question Types**: Support for both single-choice and multiple-choice questions
6. **Point-Based Scoring**: Customizable points per question
7. **Duplicate Prevention**: Each student can attempt a quiz only once
8. **Detailed Results**: Comprehensive score breakdown with question-wise analysis
9. **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd quiz-platform
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration:**
   Create `.env` files in both `backend` and `frontend` directories:

   **backend/.env:**
   ```
   MONGODB_URI=mongodb://localhost:27017/quiz-platform
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   ```

   **frontend/.env:**
   ```
   VITE_API_URL=http://localhost:5000
   ```

5. **Start the servers:**
   ```bash
   # Terminal 1 - Start backend
   cd backend
   npm start

   # Terminal 2 - Start frontend
   cd frontend
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Sample Data
Run the sample data script to populate the database with test users and quizzes:
```bash
cd backend
node sample-data.js
```

This creates:
- Teacher account: `teacher@quiz.com` / `password123`
- Student account: `student@quiz.com` / `password123`
- 3 sample quizzes

## 📚 User Guide

### For Teachers
1. Register as a teacher
2. Log in to your dashboard
3. Create quizzes with custom questions, timing, and scoring
4. View student results and performance analytics
5. Edit or delete your quizzes

### For Students
1. Register as a student
2. Log in to your dashboard
3. Browse available quizzes
4. Start a quiz and complete within the time limit
5. View your results immediately after submission

## 🛠️ Technical Architecture

### Backend (Node.js + Express + MongoDB)
- RESTful API design
- JWT-based authentication
- MongoDB with Mongoose ODM
- Role-based access control
- Input validation and error handling

### Frontend (React + Vite)
- Component-based architecture
- React Router for navigation
- Tailwind CSS for styling
- Responsive design
- Real-time timer components

## 🔒 Security Features

1. **Authentication**: JWT tokens with HttpOnly cookies
2. **Authorization**: Role-based access control
3. **Password Security**: Bcrypt hashing
4. **Anti-Cheating**: Tab-switch detection with warnings and auto-submission
5. **Data Validation**: Server-side validation for all inputs
6. **CORS Protection**: Configured CORS policies

## 📊 API Endpoints

### Authentication
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login

### Quizzes
- **POST** `/api/quiz/create` - Create a new quiz (Teacher only)
- **GET** `/api/quiz/all` - Get all active quizzes
- **GET** `/api/quiz/:id` - Get quiz details by ID
- **PUT** `/api/quiz/:id` - Update quiz (Teacher only)
- **DELETE** `/api/quiz/:id` - Delete quiz (Teacher only)

### Quiz Attempts
- **GET** `/api/quiz/join/:quizId` - Join/start a quiz
- **POST** `/api/quiz/submit` - Submit quiz answers
- **GET** `/api/quiz/result/:attemptId` - Get quiz results

## 🎨 UI/UX Highlights

1. **Modern Design**: Gradient backgrounds with animated elements
2. **Intuitive Navigation**: Clear role-based interfaces
3. **Responsive Layout**: Works on mobile, tablet, and desktop
4. **Visual Feedback**: Loading states, success/error messages
5. **Interactive Elements**: Hover effects, transitions, and animations
6. **Accessibility**: Proper contrast, semantic HTML, keyboard navigation

## 🧪 Testing

The platform includes comprehensive error handling and validation:
- Form validation for all user inputs
- API error handling with user-friendly messages
- Duplicate attempt prevention
- Time-based quiz constraints

## 📈 Future Enhancements

- Real-time leaderboard
- Quiz categories and tags
- Export results to CSV/PDF
- Question bank management
- Advanced analytics dashboard
- Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React and Vite communities
- Express.js and Node.js ecosystems
- MongoDB and Mongoose teams
- Tailwind CSS creators