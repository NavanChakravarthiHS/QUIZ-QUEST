# Troubleshooting Quiz Loading Issues

## Common Causes and Solutions

### 1. Backend Server Not Running
**Problem**: The frontend cannot connect to the backend API
**Solution**: 
- Ensure the backend server is running on port 5000
- Start the backend with: `cd backend && npm run dev`
- You should see "Server running on port 5000" in the console

### 2. Authentication Issues
**Problem**: Invalid or missing authentication token
**Solution**:
- Log out and log back in to refresh your authentication token
- Check that your JWT_SECRET is set in the backend .env file
- Verify that your token hasn't expired

### 3. Network/Proxy Issues
**Problem**: Frontend cannot proxy requests to backend
**Solution**:
- Check that the Vite proxy is configured correctly in `frontend/vite.config.js`
- Ensure both frontend and backend are running
- Verify there are no firewall or network restrictions

### 4. Database Connection Issues
**Problem**: Backend cannot connect to MongoDB
**Solution**:
- Check that MongoDB is running
- Verify the MONGODB_URI in the backend .env file
- Check the MongoDB connection logs in the backend console

## Testing Steps

### 1. Check Backend Health
```bash
curl http://localhost:5000/api/health
```
Should return: `{"status":"OK","message":"Quiz Platform Backend is running"}`

### 2. Test Frontend Proxy
Visit the frontend and check the browser console for network errors
Look for failed requests to `/api/quiz/all`

### 3. Verify Authentication
Check that you're logged in and have a valid token in localStorage:
- Open browser dev tools
- Go to Application/Storage tab
- Look for a 'token' item in Local Storage

## Debugging Information

### Frontend Debugging
The Dashboard component now includes enhanced error messaging:
- Detailed error messages for different failure scenarios
- Troubleshooting suggestions
- Better handling of empty states

### Backend Debugging
The backend now includes enhanced logging:
- Teacher ID and name when fetching quizzes
- Number of quizzes found
- Detailed error stacks in development mode

## Quick Fixes

1. **Restart both servers**:
   ```bash
   # In backend directory
   npm run dev
   
   # In frontend directory
   npm run dev
   ```

2. **Clear browser data**:
   - Clear localStorage and cookies for the site
   - Hard refresh the page (Ctrl+F5)

3. **Check environment variables**:
   - Ensure `.env` files exist in both frontend and backend directories
   - Verify all required variables are set

## Contact Support

If issues persist after trying these solutions:
1. Check the backend console for error messages
2. Check the browser console for frontend errors
3. Provide screenshots of error messages to support