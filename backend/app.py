from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
from datetime import datetime, timedelta
import uuid
import hashlib

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes

# In-memory storage for demo (replace with database in production)
study_sessions = {}
users = {}  # {email: {password, user_id, history: []}}

def extract_text_from_pdf(pdf_bytes):
    """Extract text from PDF bytes - simplified version"""
    try:
        # For now, return a placeholder text
        # In production, you would use PyMuPDF or similar
        return "This is a sample text extracted from the uploaded document. It contains information that can be used to generate study plans and answer questions."
    except Exception as e:
        return str(e)

def generate_study_plan(text, user_id):
    """Generate a personalized study plan from PDF text"""
    # Split text into sections
    sections = text.split('.')
    sections = [s.strip() for s in sections if len(s.strip()) > 20]
    
    # Create study plan
    study_plan = {
        "user_id": user_id,
        "created_at": datetime.now().isoformat(),
        "sections": [],
        "total_sections": len(sections),
        "estimated_duration": len(sections) * 30,  # 30 minutes per section
        "progress": 0
    }
    
    for i, section in enumerate(sections[:10]):  # Limit to 10 sections for demo
        # Extract key concepts (simplified)
        words = section.split()
        key_concepts = list(set([word for word in words if len(word) > 4]))[:5]
        
        study_plan["sections"].append({
            "id": i + 1,
            "title": f"Section {i + 1}",
            "content": section[:200] + "...",
            "key_concepts": key_concepts,
            "estimated_time": 30,
            "completed": False,
            "quiz_questions": generate_quiz_questions(section)
        })
    
    return study_plan

def generate_quiz_questions(text):
    """Generate quiz questions from text"""
    # Simple question generation
    questions = []
    sentences = text.split('.')
    
    for sentence in sentences[:3]:  # Generate 3 questions
        if len(sentence.strip()) > 20:
            # Create a simple fill-in-the-blank question
            words = sentence.split()
            if len(words) > 5:
                # Replace a random word with blank
                import random
                blank_word = random.choice(words[2:-2])  # Avoid first/last words
                question = sentence.replace(blank_word, "_____")
                questions.append({
                    "question": question,
                    "answer": blank_word,
                    "type": "fill_blank"
                })
    
    return questions

def generate_concept_map(text):
    """Generate concept map from text"""
    # Simplified concept map generation
    words = text.split()
    # Extract words that might be concepts (longer words)
    concepts = list(set([word for word in words if len(word) > 4]))[:10]
    
    entities = {}
    for concept in concepts:
        entities[concept] = {
            "id": concept,
            "label": concept,
            "type": "concept",
            "frequency": 1
        }
    
    # Simple relationships
    relationships = []
    for i, concept in enumerate(concepts[:5]):
        if i + 1 < len(concepts):
            relationships.append({
                "source": concept,
                "target": concepts[i + 1],
                "type": "related"
            })
    
    return {
        "nodes": list(entities.values()),
        "edges": relationships[:10]
    }

def answer_question(question, context):
    """Answer questions using simple text matching"""
    try:
        # Simple answer generation based on keyword matching
        question_lower = question.lower()
        context_lower = context.lower()
        
        # Find relevant sentences
        sentences = context.split('.')
        relevant_sentences = []
        
        for sentence in sentences:
            if any(word in sentence.lower() for word in question_lower.split()):
                relevant_sentences.append(sentence)
        
        if relevant_sentences:
            answer = relevant_sentences[0]
            confidence = 0.8
        else:
            answer = "I couldn't find a specific answer to that question in the document."
            confidence = 0.1
        
        explanation = f"The answer was found by searching for relevant keywords in the document. Here is the context: {context[:200]}..."
        
        return {
            "answer": answer,
            "confidence": confidence,
            "context": context[:200] + "...",
            "explanation": explanation
        }
    except Exception as e:
        return {
            "answer": "I couldn't find a specific answer to that question in the document.",
            "confidence": 0.0,
            "context": context[:200] + "...",
            "explanation": "No detailed explanation available due to an error."
        }

@app.route('/upload', methods=['POST'])
def upload_pdf():
    """Upload PDF and generate study plan"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.lower().endswith(('.pdf', '.doc', '.docx', '.txt')):
        try:
            file_bytes = file.read()
            text = extract_text_from_pdf(file_bytes)
            
            # Generate user ID
            user_id = str(uuid.uuid4())
            
            # Generate study plan
            study_plan = generate_study_plan(text, user_id)
            
            # Generate concept map
            concept_map = generate_concept_map(text)
            
            # Store in memory (replace with database in production)
            study_sessions[user_id] = {
                "filename": file.filename,
                "text": text,
                "study_plan": study_plan,
                "concept_map": concept_map,
                "upload_time": datetime.now().isoformat()
            }
            
            # Save to user history if user exists
            for user in users.values():
                if user['user_id'] == user_id:
                    user['history'].append({'type': 'upload', 'filename': file.filename, 'timestamp': datetime.now().isoformat()})
                    break

            return jsonify({
                'message': 'File uploaded successfully',
                'filename': file.filename,
                'user_id': user_id,
                'study_plan': study_plan,
                'concept_map': concept_map
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Upload failed: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/qa', methods=['POST'])
def qa_endpoint():
    """Answer questions about uploaded content"""
    data = request.get_json()
    user_id = data.get('user_id')
    question = data.get('question')
    
    if not user_id or not question:
        return jsonify({'error': 'Missing user_id or question'}), 400
    
    if user_id not in study_sessions:
        return jsonify({'error': 'No study session found'}), 404
    
    text = study_sessions[user_id]['text']
    answer = answer_question(question, text)
    
    return jsonify(answer), 200

@app.route('/study-plan/<user_id>', methods=['GET'])
def get_study_plan(user_id):
    """Get study plan for a user"""
    if user_id not in study_sessions:
        return jsonify({'error': 'Study session not found'}), 404
    
    return jsonify(study_sessions[user_id]['study_plan']), 200

@app.route('/concept-map/<user_id>', methods=['GET'])
def get_concept_map(user_id):
    """Get concept map for a user"""
    if user_id not in study_sessions:
        return jsonify({'error': 'Study session not found'}), 404
    
    return jsonify(study_sessions[user_id]['concept_map']), 200

@app.route('/progress/<user_id>', methods=['POST'])
def update_progress(user_id):
    """Update study progress"""
    data = request.get_json()
    section_id = data.get('section_id')
    completed = data.get('completed', False)
    
    if user_id not in study_sessions:
        return jsonify({'error': 'Study session not found'}), 404
    
    study_plan = study_sessions[user_id]['study_plan']
    
    for section in study_plan['sections']:
        if section['id'] == section_id:
            section['completed'] = completed
            break
    
    # Calculate overall progress
    completed_sections = sum(1 for section in study_plan['sections'] if section['completed'])
    study_plan['progress'] = (completed_sections / len(study_plan['sections'])) * 100
    
    return jsonify({'progress': study_plan['progress']}), 200

@app.route('/quiz', methods=['POST'])
def quiz_endpoint():
    """Submit quiz answers and get score and feedback"""
    data = request.get_json()
    user_id = data.get('user_id')
    user_answers = data.get('answers')  # List of {section_id, question_index, answer}
    if not user_id or not user_answers:
        return jsonify({'error': 'Missing user_id or answers'}), 400
    if user_id not in study_sessions:
        return jsonify({'error': 'No study session found'}), 404
    study_plan = study_sessions[user_id]['study_plan']
    results = []
    total = 0
    correct = 0
    for ans in user_answers:
        section_id = ans.get('section_id')
        q_idx = ans.get('question_index')
        user_answer = ans.get('answer')
        section = next((s for s in study_plan['sections'] if s['id'] == section_id), None)
        if not section or q_idx >= len(section['quiz_questions']):
            results.append({'section_id': section_id, 'question_index': q_idx, 'correct': False, 'explanation': 'Invalid question.'})
            continue
        question_obj = section['quiz_questions'][q_idx]
        correct_answer = question_obj['answer']
        is_correct = str(user_answer).strip().lower() == str(correct_answer).strip().lower()
        total += 1
        if is_correct:
            correct += 1
            results.append({'section_id': section_id, 'question_index': q_idx, 'correct': True})
        else:
            explanation = f"The correct answer is '{correct_answer}'. Your answer was '{user_answer}'. The question was: {question_obj['question']}"
            results.append({'section_id': section_id, 'question_index': q_idx, 'correct': False, 'explanation': explanation})
    score = (correct / total) * 100 if total > 0 else 0

    # Save to user history if user exists
    for user in users.values():
        if user['user_id'] == user_id:
            user['history'].append({'type': 'quiz', 'score': score, 'timestamp': datetime.now().isoformat(), 'results': results})
            break

    return jsonify({'score': score, 'results': results}), 200

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name', '')
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400
    if email in users:
        return jsonify({'error': 'User already exists'}), 400
    user_id = str(uuid.uuid4())
    users[email] = {
        'password': password,  # In production, hash this!
        'user_id': user_id,
        'name': name,
        'history': []
    }
    return jsonify({'message': 'Registered successfully', 'user_id': user_id, 'name': name}), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = users.get(email)
    if not user or user['password'] != password:
        return jsonify({'error': 'Invalid credentials'}), 401
    return jsonify({'message': 'Login successful', 'user_id': user['user_id'], 'name': user.get('name', '')}), 200

@app.route('/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    credential = data.get('credential')
    if not credential:
        return jsonify({'error': 'Missing Google credential'}), 400
    try:
        # Simplified Google login (in production, verify the token)
        email = "user@example.com"  # Placeholder
        # Create user if not exists
        if email not in users:
            user_id = str(uuid.uuid4())
            name = "Google User"
            users[email] = {
                'password': None,
                'user_id': user_id,
                'name': name,
                'history': []
            }
        else:
            user_id = users[email]['user_id']
        return jsonify({'message': 'Google login successful', 'user_id': user_id, 'name': name, 'email': email}), 200
    except Exception as e:
        return jsonify({'error': f'Google token verification failed: {str(e)}'}), 401

@app.route('/user/history', methods=['POST'])
def user_history():
    data = request.get_json()
    user_id = data.get('user_id')
    for user in users.values():
        if user['user_id'] == user_id:
            return jsonify({'history': user['history']}), 200
    return jsonify({'error': 'User not found'}), 404

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'Study Mate AI Backend is running!',
        'endpoints': {
            'upload': '/upload',
            'qa': '/qa',
            'study_plan': '/study-plan/<user_id>',
            'concept_map': '/concept-map/<user_id>',
            'progress': '/progress/<user_id>',
            'health': '/health'
        },
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    # Get port from environment variable (Render sets this)
    port = int(os.environ.get('PORT', 5000))
    # Use 0.0.0.0 to bind to all available network interfaces
    app.run(debug=False, host='0.0.0.0', port=port)
