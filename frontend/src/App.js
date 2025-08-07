import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import './App.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import MenuIcon from '@mui/icons-material/Menu';

const API_BASE_URL = 'http://localhost:5000';
const GOOGLE_CLIENT_ID = '667013120125-alp95ckh23nqb6mqblseejjgvhap18kg.apps.googleusercontent.com';

function App() {
  // Theme state
  const [mode, setMode] = useState('light');
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#667eea' },
      secondary: { main: '#764ba2' },
    },
  }), [mode]);

  // App state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [studyData, setStudyData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Upload, 1: Study Plan, 2: Q&A, 3: Concept Map, 4: Quiz
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  // Add loading state for Q&A
  const [qaLoading, setQaLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [userName, setUserName] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Persistent login on app load
  React.useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedUserEmail = localStorage.getItem('user_email');
    const storedUserName = localStorage.getItem('user_name');
    if (storedUserId && storedUserEmail) {
      setCurrentUser(storedUserId);
      setUserEmail(storedUserEmail);
      setUserName(storedUserName || '');
      setIsAuthenticated(true);
      fetchUserHistory(storedUserId);
    }
  }, []);

  // Tab labels
  const tabLabels = ['Upload', 'Study Plan', 'Q&A', 'Concept Map', 'Quiz'];

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setStudyData(data);
        setCurrentUser(data.user_id);
        setActiveTab(1);
        if (data.user_id) fetchUserHistory(data.user_id);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !currentUser) return;
    setAnswer(null);
    setQaLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser, question }),
      });
      const data = await response.json();
      setAnswer(data);
    } catch (error) {
      alert(`Failed to get answer: ${error.message}`);
    } finally {
      setQaLoading(false);
    }
  };

  // Quiz logic
  const handleQuizInput = (sectionId, qIdx, value) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [`${sectionId}_${qIdx}`]: value,
    }));
  };

  const handleQuizSubmit = async () => {
    if (!studyData || !currentUser) return;
    setQuizLoading(true);
    setQuizResult(null);
    // Gather answers
    const answers = [];
    studyData.study_plan.sections.forEach((section) => {
      section.quiz_questions.forEach((q, idx) => {
        answers.push({
          section_id: section.id,
          question_index: idx,
          answer: quizAnswers[`${section.id}_${idx}`] || '',
        });
      });
    });
    try {
      const response = await fetch(`${API_BASE_URL}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser, answers }),
      });
      const data = await response.json();
      setQuizResult(data);
      if (currentUser) fetchUserHistory(currentUser);
    } catch (error) {
      alert(`Quiz submission failed: ${error.message}`);
    } finally {
      setQuizLoading(false);
    }
  };

  // Theme toggle
  const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  // Auth handlers
  const handleAuth = async () => {
    const endpoint = authMode === 'login' ? '/login' : '/register';
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword, name: authName }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user_id);
        setIsAuthenticated(true);
        setDrawerOpen(true);
        fetchUserHistory(data.user_id);
        setUserEmail(authEmail);
        setUserName(data.name || '');
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_email', authEmail);
        localStorage.setItem('user_name', data.name || '');
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      alert('Authentication error: ' + error.message);
    }
  };

  // Google login handler
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const response = await fetch(`${API_BASE_URL}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user_id);
        setIsAuthenticated(true);
        setDrawerOpen(true);
        fetchUserHistory(data.user_id);
        setUserEmail(data.email || '');
        setUserName(data.name || '');
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_email', data.email || '');
        localStorage.setItem('user_name', data.name || '');
      } else {
        alert(data.error || 'Google authentication failed');
      }
    } catch (error) {
      alert('Google authentication error: ' + error.message);
    }
  };

  const fetchUserHistory = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      if (response.ok) setUserHistory(data.history);
    } catch {}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserEmail('');
    setStudyData(null);
    setUserHistory([]);
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
  };
  const handleNewChat = () => {
    setStudyData(null);
    setFile(null);
    setActiveTab(0);
    if (currentUser) fetchUserHistory(currentUser); // Refresh dashboard history
  };

  // Animated intro page
  if (showIntro) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Fade in={showIntro} timeout={1000}>
          <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: 2, color: 'primary.main', mb: 2 }}>
                Study Mate AI
              </Typography>
              <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 500 }}>
                Your Smart Study Companion
              </Typography>
            </Box>
          </Box>
        </Fade>
      </ThemeProvider>
    );
  }

  // If not authenticated, show login/register
  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {authMode === 'login' ? 'Login' : 'Register'} to Study Mate AI
              </Typography>
              <TextField
                label="Email"
                type="email"
                fullWidth
                sx={{ mb: 2 }}
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                sx={{ mb: 2 }}
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
              />
              {authMode === 'register' && (
                <TextField
                  label="Name"
                  type="text"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                />
              )}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mb: 2 }}
                onClick={handleAuth}
              >
                {authMode === 'login' ? 'Login' : 'Register'}
              </Button>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => alert('Google Login Failed')}
                width="100%"
                useOneTap
              />
              <Button
                color="secondary"
                fullWidth
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                sx={{ mt: 2 }}
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
              </Button>
            </Paper>
          </Container>
        </ThemeProvider>
      </GoogleOAuthProvider>
    );
  }

  // Main app with dashboard drawer
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Study Mate AI
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{userName}</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'primary.main' }}>{userEmail}</Typography>
          <Divider />
          <List sx={{ flexGrow: 1 }}>
            {userHistory.map((item, idx) => (
              <ListItem key={idx}>
                <ListItemText
                  primary={item.type === 'upload' ? `Uploaded: ${item.filename}` : `Quiz: ${item.score}%`}
                  secondary={new Date(item.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Button variant="outlined" color="primary" sx={{ mb: 1 }} onClick={handleNewChat}>New Chat</Button>
          <Button variant="contained" color="secondary" onClick={handleLogout}>Logout</Button>
        </Box>
      </Drawer>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabLabels.map((label, idx) => (
              <Tab key={label} label={label} disabled={idx > 0 && !studyData} />
            ))}
          </Tabs>
        </Paper>
        {/* Upload Tab */}
        {activeTab === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Upload Your File</Typography>
              <input
                type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
                onChange={handleFileChange}
              style={{ marginBottom: 16 }}
              />
            <br />
            <Button
              variant="contained"
              color="primary"
                onClick={handleUpload} 
                disabled={!file || uploading}
              sx={{ mt: 2 }}
            >
              {uploading ? <CircularProgress size={24} color="inherit" /> : 'Upload & Generate Study Plan'}
            </Button>
            {file && <Typography variant="body2" sx={{ mt: 2 }}>Selected: {file.name}</Typography>}
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG, XLS, XLSX
            </Typography>
          </Paper>
        )}
        {/* Study Plan Tab */}
        {activeTab === 1 && studyData && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Your Personalized Study Plan</Typography>
            <div>
              {studyData.study_plan.sections.map((section) => (
                <Box key={section.id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1">{section.title}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>{section.content}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Key Concepts:</Typography>
                  <Box sx={{ mb: 1 }}>
                    {section.key_concepts.map((concept, idx) => (
                      <span key={idx} style={{ marginRight: 8, color: '#667eea' }}>{concept}</span>
                    ))}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Quiz Questions:</Typography>
                  {section.quiz_questions.map((q, idx) => (
                    <Box key={idx} sx={{ mb: 1, pl: 2 }}>
                      <Typography variant="body2">Q{idx + 1}: {q.question}</Typography>
                      <Typography variant="body2" color="text.secondary">Answer: {q.answer}</Typography>
                    </Box>
                  ))}
                </Box>
              ))}
            </div>
          </Paper>
        )}
        {/* Q&A Tab */}
        {activeTab === 2 && studyData && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Ask Questions About Your Document</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Ask a question..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                variant="outlined"
              />
              <Button variant="contained" color="primary" onClick={handleAskQuestion} disabled={qaLoading}>
                {qaLoading ? <CircularProgress size={24} color="inherit" /> : 'Ask'}
              </Button>
            </Box>
            {answer && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="subtitle1"><b>Answer:</b> {answer.answer}</Typography>
                <Typography variant="body2" color="text.secondary">Confidence: {(answer.confidence * 100).toFixed(1)}%</Typography>
                {answer.explanation && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2"><b>Explanation:</b> {answer.explanation}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        )}
        {/* Concept Map Tab */}
        {activeTab === 3 && studyData && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Concept Map</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Nodes:</Typography>
              {studyData.concept_map.nodes.map((node, idx) => (
                <Typography key={idx} variant="body2">
                  {node.label} ({node.type})
                </Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle1">Relationships:</Typography>
              {studyData.concept_map.edges.map((edge, idx) => (
                <Typography key={idx} variant="body2">
                  {edge.source} → {edge.target} ({edge.type})
                </Typography>
              ))}
            </Box>
          </Paper>
        )}
        {/* Quiz Tab */}
        {activeTab === 4 && studyData && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Quiz</Typography>
            <form onSubmit={e => { e.preventDefault(); handleQuizSubmit(); }}>
              {studyData.study_plan.sections.map((section) => (
                <Box key={section.id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>{section.title}</Typography>
                  {section.quiz_questions.map((q, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography variant="body2">Q{idx + 1}: {q.question}</Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={quizAnswers[`${section.id}_${idx}`] || ''}
                        onChange={e => handleQuizInput(section.id, idx, e.target.value)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  ))}
                </Box>
              ))}
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                disabled={quizLoading}
              >
                {quizLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit Quiz'}
              </Button>
            </form>
            {quizResult && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6">Score: {quizResult.score.toFixed(1)}%</Typography>
                {quizResult.results.map((res, idx) => (
                  <Box key={idx} sx={{ mt: 2, p: 2, bgcolor: res.correct ? 'success.light' : 'error.light', borderRadius: 2 }}>
                    <Typography variant="body2">
                      Q{res.question_index + 1} in Section {res.section_id}: {res.correct ? 'Correct' : 'Wrong'}
                    </Typography>
                    {!res.correct && (
                      <Typography variant="body2" color="text.secondary">{res.explanation}</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
