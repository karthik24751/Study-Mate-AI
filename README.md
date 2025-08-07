# Study Mate AI

An AI-powered study companion that helps you learn more effectively by uploading documents, generating study plans, answering questions, and creating interactive quizzes.

## Features

- 📄 **Document Upload**: Support for PDF, DOC, DOCX, images, and Excel files
- 🧠 **AI-Powered Q&A**: Ask questions about your uploaded content
- 📋 **Study Plans**: Generate personalized study plans with key concepts
- 🗺️ **Concept Maps**: Visualize relationships between concepts
- 📝 **Interactive Quizzes**: Test your knowledge with auto-generated questions
- 👤 **User Authentication**: Register, login, and track your progress
- 🔐 **Google OAuth**: Secure login with Google accounts

## Tech Stack

### Backend
- **Python Flask**: RESTful API server
- **Google Cloud Storage**: File storage
- **spaCy**: Natural language processing
- **Transformers**: Question-answering models
- **PyMuPDF**: PDF text extraction

### Frontend
- **React**: Modern UI framework
- **Material-UI**: Beautiful component library
- **Google OAuth**: Authentication
- **Responsive Design**: Works on all devices

## Deployment on Render

This project is configured for easy deployment on Render with both backend and frontend services.

### Prerequisites

1. **GitHub Account**: Your code should be pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Google Cloud Account**: For file storage (optional, can be configured later)

### Step-by-Step Deployment

#### 1. Prepare Your Repository

Make sure your code is pushed to GitHub with the following structure:
```
Study Mate-AI/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   └── src/
├── render.yaml
└── README.md
```

#### 2. Deploy Backend (Flask API)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `study-mate-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
5. Click **"Create Web Service"**

#### 3. Deploy Frontend (React App)

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Configure the service:
   - **Name**: `study-mate-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-service-name.onrender.com`
5. Click **"Create Static Site"**

#### 4. Configure Environment Variables

For the backend service, add these environment variables in Render:

- `PORT`: `10000` (Render sets this automatically)
- `FLASK_ENV`: `production`
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your service account file (if using Google Cloud)

#### 5. Update Frontend API URL

After your backend is deployed, update the frontend environment variable:
1. Go to your frontend service in Render
2. Navigate to **Environment** tab
3. Update `REACT_APP_API_URL` with your actual backend URL

### Alternative: Using render.yaml (Recommended)

The project includes a `render.yaml` file for automatic deployment:

1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Render will automatically detect and deploy both services
4. Update the frontend environment variable with your backend URL

### Environment Variables Setup

#### Backend Environment Variables
```bash
PORT=10000
FLASK_ENV=production
GOOGLE_APPLICATION_CREDENTIALS=service-account.json
```

#### Frontend Environment Variables
```bash
REACT_APP_API_URL=https://your-backend-service-name.onrender.com
```

### Google Cloud Setup (Optional)

If you want to use Google Cloud Storage for file uploads:

1. Create a Google Cloud project
2. Enable Cloud Storage API
3. Create a service account and download the JSON key
4. Add the JSON file to your backend directory
5. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### API Endpoints

- `POST /upload` - Upload documents
- `POST /qa` - Ask questions
- `GET /study-plan/<user_id>` - Get study plan
- `GET /concept-map/<user_id>` - Get concept map
- `POST /progress/<user_id>` - Update progress
- `POST /quiz` - Submit quiz answers
- `POST /register` - User registration
- `POST /login` - User login
- `POST /google-login` - Google OAuth login

### Troubleshooting

#### Common Issues

1. **Build Failures**: Check that all dependencies are in `requirements.txt`
2. **CORS Errors**: Backend has CORS enabled for all origins
3. **Port Issues**: Backend uses environment variable `PORT`
4. **API Connection**: Ensure frontend `REACT_APP_API_URL` points to correct backend

#### Debug Commands

```bash
# Check backend logs
render logs --service study-mate-backend

# Check frontend logs
render logs --service study-mate-frontend

# Restart services
render restart --service study-mate-backend
render restart --service study-mate-frontend
```

### Performance Optimization

- Backend uses in-memory storage (replace with database for production)
- Frontend is optimized with React build
- Static assets are served efficiently
- API responses are cached where appropriate

### Security Considerations

- CORS is enabled for development (restrict in production)
- Passwords should be hashed in production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Secure Google Cloud credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For deployment issues:
1. Check Render documentation
2. Review the logs in Render dashboard
3. Ensure all environment variables are set correctly
4. Verify API endpoints are accessible

For application issues:
1. Check browser console for frontend errors
2. Review backend logs in Render
3. Test API endpoints directly
4. Verify file uploads are working
