# Backend Check & Restart Guide

If you're getting a 404 error, the backend server might need to be restarted.

## How to Restart Backend

1. **Stop the current backend server** (Ctrl+C in the terminal where it's running)

2. **Start it again:**
   ```bash
   cd backend
   npm start
   ```

   Or if you're using nodemon:
   ```bash
   npm run dev
   ```

## Verify Routes Are Working

1. Check that the server is running on `http://localhost:5000`
2. Open browser console (F12)
3. Try to delete a quiz
4. Check the backend console for logs like:
   - "DELETE request - Quiz ID: ..."
   - Route handler logs

## Common Issues

### Route Not Found (404)
- Make sure backend server is running
- Check that route order in `backend/routes/quiz.js` is correct
- Verify the HTTP method matches (GET, POST, PUT, DELETE)

### Unauthorized (403)
- Check user role in local storage
- Verify token is being sent
- Check if user is the quiz creator

### MongoDB Connection Error
- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify MongoDB is accessible on the configured port

