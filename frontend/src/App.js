import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  ListItemIcon,
  Divider,
  Alert,
  Snackbar,
  Fade,
  ListItemButton,
  Avatar,
  Fab,
  Zoom,
  Slide,
  Grow,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Upload as UploadIcon,
  QuestionAnswer as QAIcon,
  Timeline as TimelineIcon,
  AccountTree as ConceptMapIcon,
  Quiz as QuizIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Google as GoogleIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './App.css';

// API URL from environment variable or fallback to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [conceptMap, setConceptMap] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('welcome'); // Changed from 'home' to 'welcome'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [welcomeAnimationComplete, setWelcomeAnimationComplete] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Google OAuth Client ID
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  // Welcome animation effect
  useEffect(() => {
    if (currentView === 'welcome') {
      const timer = setTimeout(() => {
        setWelcomeAnimationComplete(true);
      }, 3000); // 3 seconds for welcome animation
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleWelcomeComplete = () => {
    setCurrentView('login');
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
    setLoginDialogOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('welcome');
    setWelcomeAnimationComplete(false);
    showSnackbar('Logged out successfully', 'info');
  };

  // ... existing functions (handleFileUpload, handleQuestionSubmit, etc.) remain the same
  const handleFileUpload = async () => {
    if (!file) {
      showSnackbar('Please select a file first', 'warning');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedFile(data);
        setStudyPlan(data.study_plan);
        setConceptMap(data.concept_map);
        showSnackbar('File uploaded successfully!', 'success');
        setCurrentView('study-plan');
      } else {
        showSnackbar(data.error || 'Upload failed', 'error');
      }
    } catch (error) {
      showSnackbar('Network error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim() || !uploadedFile) {
      showSnackbar('Please enter a question and upload a file first', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: uploadedFile.user_id,
          question: question,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnswer(data);
        showSnackbar('Question answered successfully!', 'success');
      } else {
        showSnackbar(data.error || 'Failed to get answer', 'error');
      }
    } catch (error) {
      showSnackbar('Network error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (sectionId, completed) => {
    if (!uploadedFile) return;

    try {
      const response = await fetch(`${API_URL}/progress/${uploadedFile.user_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section_id: sectionId,
          completed: completed,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStudyPlan(prev => ({
          ...prev,
          progress: data.progress
        }));
        showSnackbar('Progress updated!', 'success');
      }
    } catch (error) {
      showSnackbar('Failed to update progress', 'error');
    }
  };

  const handleQuizSubmit = async () => {
    if (!uploadedFile || Object.keys(quizAnswers).length === 0) {
      showSnackbar('Please answer some quiz questions first', 'warning');
      return;
    }

    setLoading(true);
    try {
      const answers = Object.entries(quizAnswers).map(([key, value]) => {
        const [sectionId, questionIndex] = key.split('-');
        return {
          section_id: parseInt(sectionId),
          question_index: parseInt(questionIndex),
          answer: value
        };
      });

      const response = await fetch(`${API_URL}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: uploadedFile.user_id,
          answers: answers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQuizResults(data);
        showSnackbar(`Quiz completed! Score: ${data.score.toFixed(1)}%`, 'success');
      } else {
        showSnackbar(data.error || 'Failed to submit quiz', 'error');
      }
    } catch (error) {
      showSnackbar('Network error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      showSnackbar('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser({
          user_id: data.user_id,
          name: data.name,
          email: registerData.email
        });
        setRegisterDialogOpen(false);
        setRegisterData({ name: '', email: '', password: '' });
        showSnackbar('Registration successful!', 'success');
        handleLoginSuccess();
      } else {
        showSnackbar(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      showSnackbar('Network error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      showSnackbar('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser({
          user_id: data.user_id,
          name: data.name,
          email: loginData.email
        });
        setLoginData({ email: '', password: '' });
        showSnackbar('Login successful!', 'success');
        handleLoginSuccess();
      } else {
        showSnackbar(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      showSnackbar('Network error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser({
          user_id: data.user_id,
          name: data.name,
          email: data.email
        });
        showSnackbar('Google login successful!', 'success');
        handleLoginSuccess();
      } else {
        showSnackbar(data.error || 'Google login failed', 'error');
      }
    } catch (error) {
      showSnackbar('Network error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Welcome Screen
  const renderWelcome = () => (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />
      
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Grow in={true} timeout={1000}>
            <Box>
              <AutoAwesomeIcon sx={{ fontSize: 80, mb: 2, animation: 'pulse 2s infinite' }} />
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 700,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  mb: 2
                }}
              >
                Welcome to StudyMate AI
              </Typography>
            </Box>
          </Grow>
          
          <Slide direction="up" in={true} timeout={1500}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4,
                opacity: 0.9,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              Your AI-powered study companion
            </Typography>
          </Slide>
          
          <Zoom in={welcomeAnimationComplete} timeout={500}>
            <Button
              variant="contained"
              size="large"
              onClick={handleWelcomeComplete}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                px: 4,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
              endIcon={<ArrowForwardIcon />}
            >
              Get Started
            </Button>
          </Zoom>
        </Box>
      </Container>
    </Box>
  );

  // Modern Login Screen
  const renderLogin = () => (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to continue your learning journey
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => setLoginDialogOpen(true)}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.main',
                    color: 'white'
                  }
                }}
              >
                Sign In with Email
              </Button>

              {GOOGLE_CLIENT_ID && (
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => showSnackbar('Google login failed', 'error')}
                  useOneTap
                  theme="filled_blue"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              )}
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Don't have an account?
              </Typography>
              <Button
                variant="text"
                onClick={() => setRegisterDialogOpen(true)}
                sx={{ fontWeight: 600 }}
              >
                Create Account
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );

  // Modern Dashboard
  const renderDashboard = () => (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <SchoolIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              StudyMate AI
            </Typography>
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Welcome, {user.name}!
              </Typography>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Fade in={true} timeout={800}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
              Your Learning Dashboard
            </Typography>

            <Grid container spacing={3}>
              {/* Quick Actions */}
              <Grid item xs={12} md={8}>
                <Card 
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    mb: 3
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<UploadIcon />}
                          onClick={() => setCurrentView('upload')}
                          sx={{
                            background: 'rgba(255,255,255,0.2)',
                            '&:hover': { background: 'rgba(255,255,255,0.3)' }
                          }}
                        >
                          Upload Document
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<QAIcon />}
                          onClick={() => setCurrentView('qa')}
                          sx={{
                            background: 'rgba(255,255,255,0.2)',
                            '&:hover': { background: 'rgba(255,255,255,0.3)' }
                          }}
                        >
                          Ask Questions
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<QuizIcon />}
                          onClick={() => setCurrentView('quiz')}
                          sx={{
                            background: 'rgba(255,255,255,0.2)',
                            '&:hover': { background: 'rgba(255,255,255,0.3)' }
                          }}
                        >
                          Take Quiz
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Stats */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', background: 'rgba(255,255,255,0.9)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Your Progress
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>
                        {studyPlan ? Math.round(studyPlan.progress) : 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overall Progress
                      </Typography>
                    </Box>
                    {studyPlan && (
                      <LinearProgress 
                        variant="determinate" 
                        value={studyPlan.progress} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Feature Cards */}
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8
                    }
                  }}
                  onClick={() => setCurrentView('upload')}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <UploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Upload Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload PDFs, documents, and images to get started with your study session.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8
                    }
                  }}
                  onClick={() => setCurrentView('qa')}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <QAIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Ask Questions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get instant answers to your questions about the uploaded content.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8
                    }
                  }}
                  onClick={() => setCurrentView('study-plan')}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <TimelineIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Study Plans
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generate personalized study plans and track your progress.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
        onClick={() => setCurrentView('upload')}
      >
        <UploadIcon />
      </Fab>
    </Box>
  );

  // ... existing render functions (renderUpload, renderStudyPlan, etc.) remain the same
  const renderUpload = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Upload Document
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <input
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label htmlFor="file-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<UploadIcon />}
            sx={{ mb: 2 }}
          >
            Choose File
          </Button>
        </label>
        
        {file && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            Selected: {file.name}
          </Typography>
        )}
        
        <Button
          variant="contained"
          onClick={handleFileUpload}
          disabled={!file || loading}
          sx={{ ml: 2 }}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </Button>
      </Paper>
    </Box>
  );

  const renderStudyPlan = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Study Plan
      </Typography>
      
      {studyPlan && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Progress: {studyPlan.progress.toFixed(1)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={studyPlan.progress} 
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Estimated Duration: {studyPlan.estimated_duration} minutes
            </Typography>
          </Paper>
          
          <Grid container spacing={2}>
            {studyPlan.sections.map((section) => (
              <Grid item xs={12} md={6} key={section.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {section.content}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      {section.key_concepts.map((concept, index) => (
                        <Chip
                          key={index}
                          label={concept}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                    
                    <Button
                      variant={section.completed ? "outlined" : "contained"}
                      onClick={() => handleProgressUpdate(section.id, !section.completed)}
                      size="small"
                    >
                      {section.completed ? 'Completed' : 'Mark Complete'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );

  const renderQA = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Ask Questions
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Ask a question about your document"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleQuestionSubmit}
          disabled={!question.trim() || loading}
        >
          {loading ? 'Getting Answer...' : 'Ask Question'}
        </Button>
      </Paper>
      
      {answer && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Answer
          </Typography>
          <Typography variant="body1" paragraph>
            {answer.answer}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Confidence: {(answer.confidence * 100).toFixed(1)}%
          </Typography>
          <Typography variant="h6" gutterBottom>
            Explanation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {answer.explanation}
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderConceptMap = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Concept Map
      </Typography>
      
      {conceptMap && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Key Concepts
          </Typography>
          <Box sx={{ mb: 3 }}>
            {conceptMap.nodes.map((node, index) => (
              <Chip
                key={index}
                label={node.label}
                color="primary"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Relationships
          </Typography>
          <List>
            {conceptMap.edges.slice(0, 10).map((edge, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${edge.source} → ${edge.target}`}
                  secondary={`Type: ${edge.type}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );

  const renderQuiz = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Quiz
      </Typography>
      
      {studyPlan && (
        <Box>
          {studyPlan.sections.map((section) => (
            <Card key={section.id} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {section.title}
                </Typography>
                
                {section.quiz_questions.map((question, qIndex) => (
                  <Box key={qIndex} sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      {question.question}
                    </Typography>
                    <TextField
                      fullWidth
                      label="Your answer"
                      value={quizAnswers[`${section.id}-${qIndex}`] || ''}
                      onChange={(e) => setQuizAnswers(prev => ({
                        ...prev,
                        [`${section.id}-${qIndex}`]: e.target.value
                      }))}
                      size="small"
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          ))}
          
          <Button
            variant="contained"
            onClick={handleQuizSubmit}
            disabled={Object.keys(quizAnswers).length === 0 || loading}
            size="large"
          >
            {loading ? 'Submitting...' : 'Submit Quiz'}
          </Button>
          
          {quizResults && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quiz Results
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                Score: {quizResults.score.toFixed(1)}%
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Detailed Results
              </Typography>
              {quizResults.results.map((result, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="body1" color={result.correct ? 'success.main' : 'error.main'}>
                    Question {index + 1}: {result.correct ? 'Correct' : 'Incorrect'}
                  </Typography>
                  {!result.correct && result.explanation && (
                    <Typography variant="body2" color="text.secondary">
                      {result.explanation}
                    </Typography>
                  )}
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'welcome':
        return renderWelcome();
      case 'login':
        return renderLogin();
      case 'dashboard':
        return renderDashboard();
      case 'upload':
        return renderUpload();
      case 'study-plan':
        return renderStudyPlan();
      case 'qa':
        return renderQA();
      case 'concept-map':
        return renderConceptMap();
      case 'quiz':
        return renderQuiz();
      default:
        return renderWelcome();
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, view: 'dashboard' },
    { text: 'Upload', icon: <UploadIcon />, view: 'upload' },
    { text: 'Study Plan', icon: <TimelineIcon />, view: 'study-plan' },
    { text: 'Ask Questions', icon: <QAIcon />, view: 'qa' },
    { text: 'Concept Map', icon: <ConceptMapIcon />, view: 'concept-map' },
    { text: 'Quiz', icon: <QuizIcon />, view: 'quiz' },
  ];

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Box sx={{ display: 'flex' }}>
        {/* Drawer for dashboard */}
        {currentView === 'dashboard' && (
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              width: 240,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 240,
                boxSizing: 'border-box',
              },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {menuItems.map((item) => (
                  <ListItemButton
                    key={item.text}
                    onClick={() => {
                      setCurrentView(item.view);
                      setDrawerOpen(false);
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Drawer>
        )}

        {/* Main content */}
        <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
          {renderContent()}
        </Box>

        {/* Login Dialog */}
        <Dialog 
          open={loginDialogOpen} 
          onClose={() => setLoginDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Sign In
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />

            <Divider sx={{ my: 2 }}>or</Divider>
            {GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => showSnackbar('Google login failed', 'error')}
                useOneTap
              />
            ) : (
              <Alert severity="warning">Google login not configured</Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setLoginDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              variant="contained"
              sx={{ minWidth: 100 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Register Dialog */}
        <Dialog 
          open={registerDialogOpen} 
          onClose={() => setRegisterDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Create Account
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              variant="outlined"
              value={registerData.name}
              onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRegister} 
              disabled={loading}
              variant="contained"
              sx={{ minWidth: 100 }}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </GoogleOAuthProvider>
  );
}

export default App;
