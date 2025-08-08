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
  ListItemButton
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
  Google as GoogleIcon
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
  const [currentView, setCurrentView] = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);

  // Google OAuth Client ID
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

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
        setLoginDialogOpen(false);
        setLoginData({ email: '', password: '' });
        showSnackbar('Login successful!', 'success');
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
      } else {
        showSnackbar(data.error || 'Google login failed', 'error');
      }
    } catch (error) {
      showSnackbar('Network error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    showSnackbar('Logged out successfully', 'info');
  };

  const renderHome = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Study Mate AI
      </Typography>
      <Typography variant="h6" color="text.secondary" paragraph>
        Your AI-powered study companion
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <UploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Documents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload PDFs, documents, and images to get started with your study session.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <QAIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ask Questions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get instant answers to your questions about the uploaded content.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <TimelineIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
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
  );

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
      case 'home':
        return renderHome();
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
        return renderHome();
    }
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, view: 'home' },
    { text: 'Upload', icon: <UploadIcon />, view: 'upload' },
    { text: 'Study Plan', icon: <TimelineIcon />, view: 'study-plan' },
    { text: 'Ask Questions', icon: <QAIcon />, view: 'qa' },
    { text: 'Concept Map', icon: <ConceptMapIcon />, view: 'concept-map' },
    { text: 'Quiz', icon: <QuizIcon />, view: 'quiz' },
  ];

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Study Mate AI
            </Typography>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Welcome, {user.name}!
                </Typography>
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
            ) : (
              <Box>
                <Button color="inherit" onClick={() => setLoginDialogOpen(true)}>
                  Login
                </Button>
                <Button color="inherit" onClick={() => setRegisterDialogOpen(true)}>
                  Register
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>

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

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="lg">
            <Fade in timeout={300}>
              <Box key={currentView}>{renderContent()}</Box>
            </Fade>
          </Container>
        </Box>

        {/* Login Dialog */}
        <Dialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)}>
          <DialogTitle>Login</DialogTitle>
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
          <DialogActions>
            <Button onClick={() => setLoginDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Register Dialog */}
        <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)}>
          <DialogTitle>Register</DialogTitle>
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
          <DialogActions>
            <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRegister} disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
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
