from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google.cloud import storage
import os
import fitz  # PyMuPDF
import spacy
from transformers import pipeline
import json
import re
from datetime import datetime, timedelta
import uuid
import hashlib
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes

# Configure Google Cloud Storage
GCS_BUCKET = 'study-mate-ai-sr-2024'
GCS_CREDENTIALS = 'service-account.json'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GCS_CREDENTIALS

# Initialize GCS client
gcs_client = storage.Client()
bucket = gcs_client.bucket(GCS_BUCKET)

# Initialize NLP models
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Download the model if not available
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Initialize QA pipeline
# Initialize QA pipeline with a simpler model
try:
    qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-squad2")
except:
    # Fallback to a simpler model if the first one fails
    qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")

# In-memory storage for demo (replace with database in production)
study_sessions = {}
users = {}  # {email: {password, user_id, history: []}}

def extract_text_from_pdf(pdf_bytes):
    """Extract text from PDF bytes"""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        return str(e)

def generate_study_plan(text, user_id):
    """Generate a personalized study plan from PDF text"""
    # Split text into sections
    sections = text.split('\n\n')
    sections = [s.strip() for s in sections if len(s.strip()) > 50]
    
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
        # Extract key concepts using spaCy
        doc = nlp(section[:500])  # Limit text for processing
        entities = [ent.text for ent in doc.ents]
        key_concepts = list(set(entities))[:5]
        
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
    # Simple question generation (replace with more sophisticated approach)
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
    doc = nlp(text[:2000])  # Limit text for processing
    
    # Extract entities and their relationships
    entities = {}
    relationships = []
    
    for ent in doc.ents:
        if ent.label_ in ['PERSON', 'ORG', 'GPE', 'PRODUCT', 'EVENT']:
            entities[ent.text] = {
                "id": ent.text,
                "label": ent.text,
                "type": ent.label_,
                "frequency": entities.get(ent.text, {}).get('frequency', 0) + 1
            }
    
    # Find relationships (simple approach)
    for sent in doc.sents:
        for token in sent:
            if token.dep_ in ['nsubj', 'dobj'] and token.head.pos_ == 'VERB':
                relationships.append({
                    "source": token.text,
                    "target": token.head.text,
                    "type": "action"
                })
    
    return {
        "nodes": list(entities.values()),
        "edges": relationships[:20]  # Limit relationships
    }

def answer_question(question, context):
    """Answer questions using the QA pipeline and provide a detailed explanation"""
    try:
        result = qa_pipeline(question=question, context=context[:1000])
        answer = result['answer']
        confidence = result['score']
        # Generate a detailed explanation using more context
        # For now, we use a simple approach: extract a larger context window and add a rationale
        explanation_context = context[:2000]
        explanation = f"The answer '{answer}' was found based on the context provided. Here is a more detailed explanation: The model searched the document for relevant information and determined that '{answer}' best answers the question '{question}'.\n\nRelevant context: {explanation_context[:500]}..."
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
    
    if file and file.filename.lower().endswith((
        '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.xls', '.xlsx')):
        try:
            file_bytes = file.read()
            blob = bucket.blob(file.filename)
            # Determine content type
            if file.filename.lower().endswith('.pdf'):
                blob.upload_from_string(file_bytes, content_type='application/pdf')
                text = extract_text_from_pdf(file_bytes)
            elif file.filename.lower().endswith(('.doc', '.docx')):
                blob.upload_from_string(file_bytes, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                # Try to extract text from doc/docx
                try:
                    import docx
                    from io import BytesIO
                    doc = docx.Document(BytesIO(file_bytes))
                    text = '\n'.join([para.text for para in doc.paragraphs])
                except Exception:
                    text = 'Text extraction from DOC/DOCX failed.'
            elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                blob.upload_from_string(file_bytes, content_type='image/jpeg')
                text = 'Text extraction from images is not yet supported.'
            elif file.filename.lower().endswith(('.xls', '.xlsx')):
                blob.upload_from_string(file_bytes, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                text = 'Text extraction from Excel files is not yet supported.'
            else:
                blob.upload_from_string(file_bytes)
                text = 'Unsupported file type.'
            
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
        idinfo = id_token.verify_oauth2_token(credential, google_requests.Request())
        email = idinfo['email']
        # Create user if not exists
        if email not in users:
            user_id = str(uuid.uuid4())
            name = idinfo.get('name', email.split('@')[0])
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
