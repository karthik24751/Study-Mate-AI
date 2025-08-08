import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Fade,
  ListItemButton,
  Avatar,
  Fab,
  Zoom,
  Slide,
  Grow,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  LinearProgress,
  Paper,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Upload as UploadIcon,
  QuestionAnswer as QAIcon,
  Timeline as TimelineIcon,
  Quiz as QuizIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Google as GoogleIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './App.css';

function App() {
  // State management
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('welcome');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [studyPlan, setStudyPlan] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [welcomeAnimationComplete, setWelcomeAnimationComplete] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [viewHistory, setViewHistory] = useState(['welcome']);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Create theme based on dark/light mode
  const appTheme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3', // Blue
        light: '#64b5f6',
        dark: '#1976d2',
      },
      secondary: {
        main: '#00bcd4', // Teal
        light: '#4dd0e1',
        dark: '#0097a7',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f7fa',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  // Google OAuth Client ID
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('studymate_user');
    const savedDarkMode = localStorage.getItem('studymate_darkmode');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
    
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save user to localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('studymate_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('studymate_user');
    }
  }, [user]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('studymate_darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Welcome animation effect
  useEffect(() => {
    if (currentView === 'welcome') {
      const timer = setTimeout(() => {
        setWelcomeAnimationComplete(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleWelcomeComplete = () => {
    setCurrentView('login');
    setViewHistory(prev => [...prev, 'login']);
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
    setViewHistory(prev => [...prev, 'dashboard']);
    setLoginDialogOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('welcome');
    setViewHistory(['welcome']);
    setWelcomeAnimationComplete(false);
    showSnackbar('Logged out successfully', 'info');
  };

  const handleBackNavigation = () => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      const previousView = newHistory[newHistory.length - 1];
      setCurrentView(previousView);
      setViewHistory(newHistory);
    }
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
    setViewHistory(prev => [...prev, newView]);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // ... existing functions (handleFileUpload, handleQuestionSubmit, etc.) remain the same
  const handleFileUpload = async () => {
    if (!file) {
      showSnackbar('Please select a file first', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        showSnackbar('File uploaded successfully!', 'success');
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      } else {
        showSnackbar(data.error || 'Upload failed', 'error');
      }
    } catch (error) {
      showSnackbar('Upload failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim()) {
      showSnackbar('Please enter a question', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });

      const data = await response.json();
      if (response.ok) {
        setAnswer(data.answer);
        showSnackbar('Answer generated successfully!', 'success');
      } else {
        showSnackbar(data.error || 'Failed to get answer', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to get answer: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();
      if (response.ok) {
        setUser({
          name: registerData.name,
          email: registerData.email
        });
        setRegisterData({ name: '', email: '', password: '' });
        showSnackbar('Registration successful!', 'success');
        handleLoginSuccess();
      } else {
        showSnackbar(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      showSnackbar('Registration failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (response.ok) {
        setUser({
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
      showSnackbar('Login failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser({
          name: data.name,
          email: data.email
        });
        showSnackbar('Google login successful!', 'success');
        handleLoginSuccess();
      } else {
        showSnackbar(data.error || 'Google login failed', 'error');
      }
    } catch (error) {
      showSnackbar('Google login failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Welcome Screen
  const renderWelcome = () => (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2196f3 0%, #00bcd4 50%, #64b5f6 100%)',
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
        background: 'linear-gradient(135deg, #2196f3 0%, #00bcd4 100%)',
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
          background: 'linear-gradient(135deg, #2196f3 0%, #00bcd4 100%)',
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
              <IconButton color="inherit" onClick={toggleDarkMode}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
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
                    background: 'linear-gradient(135deg, #2196f3 0%, #00bcd4 100%)',
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
                          onClick={() => handleViewChange('upload')}
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
                          onClick={() => handleViewChange('qa')}
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
                          onClick={() => handleViewChange('quiz')}
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
                  onClick={() => handleViewChange('upload')}
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
                  onClick={() => handleViewChange('qa')}
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
                  onClick={() => handleViewChange('study-plan')}
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
          background: 'linear-gradient(135deg, #2196f3 0%, #00bcd4 100%)'
        }}
        onClick={() => handleViewChange('upload')}
      >
        <UploadIcon />
      </Fab>
    </Box>
  );

  // ... existing render functions (renderUpload, renderStudyPlan, etc.) remain the same
  const renderUpload = () => (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={handleBackNavigation}
            sx={{ mr: 2 }}
            color="primary"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Upload Document
          </Typography>
        </Box>
        
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <UploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Choose a file to upload
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ mr: 2 }}
            >
              Choose File
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {file.name}
              </Typography>
            )}
          </Box>
          
          <Button
            variant="contained"
            onClick={handleFileUpload}
            disabled={!file || loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </Card>
      </Container>
    </Box>
  );

  const renderStudyPlan = () => (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={handleBackNavigation}
            sx={{ mr: 2 }}
            color="primary"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Study Plan
          </Typography>
        </Box>
        
        <Card sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Personalized Study Plan
          </Typography>
          {studyPlan ? (
            <Box>
              <Typography variant="body1" paragraph>
                {studyPlan.plan}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={studyPlan.progress} 
                sx={{ height: 10, borderRadius: 5, mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Progress: {Math.round(studyPlan.progress)}%
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No study plan available. Upload some documents to generate a personalized plan.
            </Typography>
          )}
        </Card>
      </Container>
    </Box>
  );

  const renderQA = () => (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={handleBackNavigation}
            sx={{ mr: 2 }}
            color="primary"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Ask Questions
          </Typography>
        </Box>
        
        <Card sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ask a question about your documents
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Enter your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleQuestionSubmit}
            disabled={!question.trim() || loading}
            startIcon={<QAIcon />}
          >
            {loading ? 'Generating Answer...' : 'Ask Question'}
          </Button>
        </Card>
        
        {answer && (
          <Card sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Answer
            </Typography>
            <Typography variant="body1">
              {answer}
            </Typography>
          </Card>
        )}
      </Container>
    </Box>
  );

  const renderQuiz = () => (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={handleBackNavigation}
            sx={{ mr: 2 }}
            color="primary"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Quiz
          </Typography>
        </Box>
        
        <Card sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Test your knowledge
          </Typography>
          {quizQuestions.length > 0 ? (
            <Box>
              {quizQuestions.map((q, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Question {index + 1}: {q.question}
                  </Typography>
                  {q.options.map((option, optIndex) => (
                    <Button
                      key={optIndex}
                      variant={quizAnswers[index] === optIndex ? "contained" : "outlined"}
                      fullWidth
                      sx={{ mb: 1, justifyContent: 'flex-start' }}
                      onClick={() => setQuizAnswers({...quizAnswers, [index]: optIndex})}
                    >
                      {option}
                    </Button>
                  ))}
                </Box>
              ))}
              <Button
                variant="contained"
                onClick={() => {/* Handle quiz submission */}}
                disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              >
                Submit Quiz
              </Button>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No quiz questions available. Upload some documents to generate quiz questions.
            </Typography>
          )}
        </Card>
      </Container>
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
      case 'qa':
        return renderQA();
      case 'study-plan':
        return renderStudyPlan();
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
    { text: 'Quiz', icon: <QuizIcon />, view: 'quiz' },
    { text: 'History', icon: <HistoryIcon />, view: 'history' },
  ];

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
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
                        handleViewChange(item.view);
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
                fullWidth
                label="Email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                margin="normal"
              />
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
                fullWidth
                label="Name"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                margin="normal"
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
            onClose={() => setSnackbar({...snackbar, open: false})}
          >
            <Alert 
              onClose={() => setSnackbar({...snackbar, open: false})} 
              severity={snackbar.severity}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
