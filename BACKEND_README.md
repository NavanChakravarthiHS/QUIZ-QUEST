# QuizQuest Backend API Documentation

This document provides comprehensive documentation for the QuizQuest backend RESTful API.

## Base URL

```
http://localhost:5000/api
```

For production deployments, replace with your actual domain.

## Authentication

All API endpoints (except registration and login) require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Data Models

### User
```javascript
{
  _id: String,
  name: String,
  email: String,
  role: String, // 'student' or 'teacher'
  branch: String, // For students only
  usn: String, // For students only
  createdAt: Date,
  updatedAt: Date
}
```

### Quiz
```javascript
{
  _id: String,
  title: String,
  description: String,
  createdBy: ObjectId, // Reference to User
  questions: [
    {
      question: String,
      type: String, // 'single' or 'multiple'
      options: [
        {
          text: String,
          isCorrect: Boolean
        }
      ],
      points: Number,
      timeLimit: Number // in seconds (for per-question mode)
    }
  ],
  timingMode: String, // 'total' or 'per-question'
  totalDuration: Number, // in seconds
  isActive: Boolean,
  showResults: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Attempt
```javascript
{
  _id: String,
  userId: ObjectId, // Reference to User
  quizId: ObjectId, // Reference to Quiz
  answers: [
    {
      questionId: ObjectId,
      selectedOptions: [String],
      isCorrect: Boolean,
      pointsEarned: Number,
      timeSpent: Number // in seconds
    }
  ],
  score: Number,
  totalScore: Number,
  submittedAt: Date,
  startedAt: Date,
  completedAt: Date,
  timeSpent: Number, // in seconds
  tabSwitches: Number,
  status: String // 'in-progress', 'completed', 'auto-submitted', 'abandoned'
}
```

## API Endpoints

### Authentication

#### Register
- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Data Params**:
  ```javascript
  {
    name: String,
    email: String,
    password: String,
    role: String, // 'student' or 'teacher'
    branch: String, // Required for students
    usn: String // Required for students
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```javascript
    {
      message: "User registered successfully",
      token: String,
      user: {
        id: String,
        name: String,
        email: String,
        role: String,
        branch: String,
        usn: String
      }
    }
    ```

#### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Data Params**:
  ```javascript
  {
    email: String,
    password: String
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```javascript
    {
      message: "Login successful",
      token: String,
      user: {
        id: String,
        name: String,
        email: String,
        role: String,
        branch: String,
        usn: String
      }
    }
    ```

### Quizzes

#### Create Quiz
- **URL**: `/quiz/create`
- **Method**: `POST`
- **Auth Required**: Yes (Teacher only)
- **Data Params**:
  ```javascript
  {
    title: String,
    description: String,
    questions: [
      {
        question: String,
        type: String,
        options: [
          {
            text: String,
            isCorrect: Boolean
          }
        ],
        points: Number,
        timeLimit: Number
      }
    ],
    timingMode: String,
    totalDuration: Number
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```javascript
    {
      message: "Quiz created successfully",
      quiz: {
        id: String,
        title: String,
        questionsCount: Number,
        timingMode: String,
        totalDuration: Number
      }
    }
    ```

#### Get All Quizzes
- **URL**: `/quiz/all`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**: Array of quiz objects with basic information

#### Get Quiz by ID
- **URL**: `/quiz/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Teacher only for editing)
- **Success Response**:
  - **Code**: 200
  - **Content**: Full quiz object with all questions and correct answers

#### Update Quiz
- **URL**: `/quiz/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Teacher only, must be quiz creator)
- **Data Params**: Same as Create Quiz
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```javascript
    {
      message: "Quiz updated successfully",
      quiz: {
        id: String,
        title: String,
        questionsCount: Number,
        timingMode: String,
        totalDuration: Number
      }
    }
    ```

#### Delete Quiz
- **URL**: `/quiz/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Teacher only, must be quiz creator)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```javascript
    {
      message: "Quiz deleted successfully"
    }
    ```

### Quiz Attempts

#### Join Quiz
- **URL**: `/quiz/join/:quizId`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```javascript
    {
      message: "Quiz joined successfully",
      quiz: {
        id: String,
        title: String,
        description: String,
        timingMode: String,
        totalDuration: Number,
        questions: [
          {
            _id: String,
            question: String,
            type: String,
            options: [
              {
                text: String
                // Note: isCorrect is not included
              }
            ],
            points: Number,
            timeLimit: Number
          }
        ]
      },
      attemptId: String
    }
    ```

#### Submit Quiz
- **URL**: `/quiz/submit`
- **Method**: `POST`
- **Auth Required**: Yes
- **Data Params**:
  ```javascript
  {
    attemptId: String,
    quizId: String,
    answers: [
      {
        questionId: String,
        selectedOptions: [String],
        timeSpent: Number
      }
    ]
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```javascript
    {
      message: "Quiz submitted successfully",
      result: {
        score: Number,
        totalScore: Number,
        percentage: Number,
        submittedAt: Date
      }
    }
    ```

#### Get Quiz Result
- **URL**: `/quiz/result/:attemptId`
- **Method**: `GET`
- **Auth Required**: Yes (User must own the attempt)
- **Success Response**:
  - **Code**: 200
  - **Content**: Detailed result object with question breakdown

## Error Responses

All error responses follow this format:
```javascript
{
  message: String,
  error: String // Only in development mode
}
```

Common HTTP status codes:
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Missing or invalid authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error - Something went wrong on the server

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per hour per IP for authentication endpoints
- 1000 requests per hour per IP for other endpoints

## CORS Policy

The API allows CORS requests from the frontend origin specified in environment variables.

## Security Features

1. **JWT Tokens**: Secure authentication with expiration
2. **Password Hashing**: Bcrypt with salt rounds
3. **Input Validation**: Server-side validation for all inputs
4. **Role-Based Access**: Different permissions for students and teachers
5. **Data Sanitization**: Protection against injection attacks
6. **Attempt Uniqueness**: Prevents duplicate quiz attempts

## Webhooks

Currently, the API does not implement webhooks. All interactions are request-response based.

## Versioning

This documentation covers API version 1.0. Future versions will be documented separately and will maintain backward compatibility where possible.

## Changelog

### v1.0.0
- Initial release
- Full CRUD operations for quizzes
- User authentication and authorization
- Quiz attempt management
- Result calculation and reporting

## Support

For API-related issues:
1. Check response codes and error messages
2. Verify authentication tokens are valid and not expired
3. Ensure request formats match documentation
4. Contact development team for persistent issues