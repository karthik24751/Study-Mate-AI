# Study Mate AI - AI-Powered Interactive Learning Platform

An innovative, AI-powered learning platform that allows students to upload PDFs and receive personalized, interactive learning experiences based on cutting-edge AI technologies.

## 🚀 Features

### Core Features
- **PDF Upload & Processing**: Upload PDF documents and extract text for analysis
- **AI-Generated Study Plans**: Automatically analyze uploaded PDFs and generate personalized study plans
- **Interactive Q&A System**: Ask questions about your uploaded content and get AI-powered answers
- **Concept Map Generation**: Visualize key concepts and relationships from your documents
- **Progress Tracking**: Track your learning progress with interactive checkboxes
- **Quiz Generation**: Automatic quiz questions for each study section

### Technical Features
- **Google Cloud Storage Integration**: Secure file storage in the cloud
- **NLP Processing**: Advanced text analysis using spaCy and Transformers
- **Responsive Web Interface**: Modern, beautiful UI that works on all devices
- **Real-time Processing**: Instant feedback and results

## 🛠️ Technology Stack

### Backend
- **Python Flask**: RESTful API server
- **Google Cloud Storage**: File storage and management
- **spaCy**: Natural Language Processing
- **Transformers (HuggingFace)**: Question-Answering AI model
- **PyMuPDF**: PDF text extraction

### Frontend
- **React**: Modern web application framework
- **CSS3**: Beautiful, responsive styling
- **JavaScript ES6+**: Modern JavaScript features

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Python 3.8+** installed
2. **Node.js 14+** and npm installed
3. **Google Cloud Platform** account with:
   - Google Cloud Storage bucket created
   - Service account with Storage Admin permissions
   - Service account key downloaded

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to project directory
cd "Study Mate-AI"

# Activate Python virtual environment
source backend-venv/bin/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Google Cloud Storage

1. Update `backend/app.py` with your Google Cloud Storage details:
   ```python
   GCS_BUCKET = 'your-bucket-name'
   GCS_CREDENTIALS = 'backend/service-account.json'
   ```

2. Place your service account JSON key in `backend/service-account.json`

### 3. Start the Application

#### Start Backend Server
```bash
cd backend
source ../backend-venv/bin/activate
flask run
```
The backend will be available at: http://localhost:5000

#### Start Frontend Development Server
```bash
cd frontend
npm start
```
The frontend will be available at: http://localhost:3000

## 📖 Usage Guide

### 1. Upload PDF
1. Open the application in your browser
2. Click "Upload PDF" tab
3. Select a PDF file from your computer
4. Click "Upload & Generate Study Plan"
5. Wait for processing (this may take a few moments)

### 2. Study Plan
1. After upload, you'll be automatically taken to the Study Plan tab
2. Review the generated study sections
3. Check off completed sections to track progress
4. Review key concepts and quiz questions for each section

### 3. Q&A System
1. Click the "Q&A" tab
2. Type your question about the uploaded document
3. Click "Ask" to get an AI-powered answer
4. View confidence scores and context

### 4. Concept Map
1. Click the "Concept Map" tab
2. View key concepts extracted from your document
3. Explore relationships between different concepts

## 🔧 API Endpoints

### Backend API (http://localhost:5000)

- `POST /upload` - Upload PDF and generate study plan
- `POST /qa` - Ask questions about uploaded content
- `GET /study-plan/<user_id>` - Get study plan for user
- `GET /concept-map/<user_id>` - Get concept map for user
- `POST /progress/<user_id>` - Update study progress
- `GET /health` - Health check endpoint

## 🎨 Features in Detail

### AI-Generated Study Plans
- Automatically splits content into manageable sections
- Extracts key concepts using NLP
- Generates estimated study times
- Creates interactive quiz questions

### Interactive Q&A System
- Uses state-of-the-art question-answering models
- Provides confidence scores for answers
- Shows relevant context from the document

### Concept Map Generation
- Extracts named entities (people, organizations, locations)
- Identifies relationships between concepts
- Visualizes document structure

### Progress Tracking
- Interactive checkboxes for each section
- Real-time progress calculation
- Visual progress bar

## 🚀 Deployment

### Google Cloud Platform Deployment

1. **Backend Deployment (App Engine)**
   ```bash
   # Create app.yaml
   cd backend
   gcloud app deploy
   ```

2. **Frontend Deployment (Firebase Hosting)**
   ```bash
   cd frontend
   npm run build
   firebase deploy
   ```

### Environment Variables
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account key
- `GCS_BUCKET`: Google Cloud Storage bucket name

## 🔒 Security Considerations

- Service account keys should be kept secure
- Consider using environment variables for sensitive data
- Implement proper authentication for production use
- Add rate limiting for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check that all dependencies are installed
2. Verify Google Cloud Storage configuration
3. Ensure both backend and frontend servers are running
4. Check browser console for any JavaScript errors

## 🔮 Future Enhancements

- Voice integration for hands-free interaction
- Advanced concept map visualization with D3.js
- Collaborative study groups
- Integration with learning management systems
- Mobile app development
- Advanced analytics and insights

---

**Study Mate AI** - Empowering students with AI-driven learning experiences! 🎓✨
# Study-Mate-AI
