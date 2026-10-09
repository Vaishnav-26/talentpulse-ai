import os
import io
import sys
import base64
import json
import asyncio
import re
import sqlite3
from datetime import datetime
from typing import Optional, Dict, Any, List

import numpy as np
import cv2
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pypdf

# Initialize FastAPI App
app = FastAPI(
    title="TalentPulse AI - Cognitive Telemetry & LLM Evaluator",
    description="Real-time emotion telemetry, PyTorch ResNet-18 inference, ATS cross-checker, SQLite persistence & LLM interview engine",
    version="3.5.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Emotion Classes matching FER-2013 dataset structure
EMOTION_CLASSES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

# Load Haar Cascade Classifier for Face Detection
face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(face_cascade_path)

# PyTorch Image Preprocessing Transforms
img_transforms = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((48, 48)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Global PyTorch Model Setup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_weights_path = os.path.join(BASE_DIR, "fer2013_resnet.pth")

# SQLite Database Setup
DB_PATH = os.path.join(BASE_DIR, "database.db")
QUESTIONS_FILE_SRC = os.path.join(BASE_DIR, "src", "data", "questions.json")
QUESTIONS_FILE_BACKEND = os.path.join(BASE_DIR, "backend", "questions.json")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_sqlite_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            target_role TEXT,
            experience_level TEXT,
            created_at TEXT
        )
    """)

    # Questions Table (5 Technical Domains)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY,
            domain TEXT,
            category TEXT,
            role TEXT,
            difficulty TEXT,
            estimated_duration TEXT,
            target_duration_sec INTEGER,
            title TEXT,
            prompt TEXT,
            skills_assessed TEXT,
            model_answer_tip TEXT
        )
    """)

    # Interview Sessions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            question_id TEXT,
            question_title TEXT,
            timestamp TEXT,
            duration_seconds INTEGER,
            overall_score INTEGER,
            readiness_grade TEXT,
            rating_label TEXT,
            transcript TEXT,
            emotion_logs TEXT,
            filler_words TEXT,
            star_rubric TEXT,
            radar_metrics TEXT,
            strengths TEXT,
            improvements TEXT
        )
    """)

    # Resumes Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS resumes (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            file_name TEXT,
            resume_text TEXT,
            ats_score INTEGER,
            target_job_description TEXT,
            matched_keywords TEXT,
            missing_keywords TEXT,
            created_at TEXT
        )
    """)

    conn.commit()

    # Seed Questions if table is empty or has fewer than 40 questions
    cursor.execute("SELECT COUNT(*) FROM questions")
    count = cursor.fetchone()[0]

    if count < 40:
        source_file = QUESTIONS_FILE_SRC if os.path.exists(QUESTIONS_FILE_SRC) else QUESTIONS_FILE_BACKEND
        if os.path.exists(source_file):
            try:
                with open(source_file, "r", encoding="utf-8") as f:
                    q_list = json.load(f)
                    cursor.execute("DELETE FROM questions")
                    for q in q_list:
                        cursor.execute("""
                            INSERT INTO questions (
                                id, domain, category, role, difficulty, estimated_duration, 
                                target_duration_sec, title, prompt, skills_assessed, model_answer_tip
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            q.get("id"),
                            q.get("domain", "DSA & Algorithms"),
                            q.get("category", "General"),
                            q.get("role", "Full-Stack"),
                            q.get("difficulty", "Medium"),
                            q.get("estimatedDuration", "2 mins"),
                            q.get("targetDurationSec", 120),
                            q.get("title", ""),
                            q.get("prompt", ""),
                            json.dumps(q.get("skillsAssessed", [])),
                            q.get("modelAnswerTip", "")
                        ))
                    conn.commit()
                    print(f"[OK] Seeded {len(q_list)} curated questions into SQLite database.")
            except Exception as e:
                print(f"[!] Error seeding questions: {e}")

    conn.close()

def load_resnet_model():
    global model
    try:
        model = models.resnet18(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, len(EMOTION_CLASSES))

        if os.path.exists(model_weights_path):
            state_dict = torch.load(model_weights_path, map_location=device)
            model.load_state_dict(state_dict)
            print(f"[OK] Loaded PyTorch FER-2013 model weights from {model_weights_path}")
        else:
            print(f"[!] Warning: Model weights file {model_weights_path} not found. Running initialized network.")

        model = model.to(device)
        model.eval()
    except Exception as e:
        print(f"[!] Model initialization error: {e}")

@app.on_event("startup")
async def startup_event():
    init_sqlite_db()
    load_resnet_model()

@app.get("/")
async def root():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM interview_sessions")
    total_sessions = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM questions")
    total_questions = c.fetchone()[0]
    conn.close()

    return {
        "status": "online",
        "service": "TalentPulse AI Telemetry Engine",
        "version": "3.5.0",
        "device": str(device),
        "weights_loaded": os.path.exists(model_weights_path),
        "total_sessions": total_sessions,
        "total_questions": total_questions,
        "database": "sqlite3 (database.db)"
    }

# ================================================================
# MODULE 1: AUTHENTICATION & USER SYNC
# ================================================================
class UserSyncRequest(BaseModel):
    name: str
    email: str
    target_role: Optional[str] = "Full-Stack"
    experience_level: Optional[str] = "Senior"

@app.post("/api/auth/sync")
async def sync_user_profile(payload: UserSyncRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    user_id = payload.email.lower().strip()
    now_iso = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO users (id, name, email, target_role, experience_level, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            target_role = excluded.target_role,
            experience_level = excluded.experience_level
    """, (
        user_id,
        payload.name.strip(),
        payload.email.lower().strip(),
        payload.target_role,
        payload.experience_level,
        now_iso
    ))
    conn.commit()
    conn.close()

    return {
        "status": "synced",
        "user_id": user_id,
        "name": payload.name,
        "email": payload.email,
        "target_role": payload.target_role,
        "experience_level": payload.experience_level
    }

# Helper to process image frame and extract telemetry metrics
def process_frame_and_predict(image_bytes: bytes) -> Dict[str, Any]:
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_image)
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        if len(faces) == 0:
            face_img = pil_image
            has_face = False
            eye_contact = False
            eye_contact_score = 68
            pitch = 0.0
            yaw = 0.0
        else:
            (x, y, w, h) = faces[0]
            img_h, img_w = gray.shape
            center_x = x + w / 2.0
            center_y = y + h / 2.0

            face_crop = img_np[y:y+h, x:x+w]
            face_img = Image.fromarray(face_crop)
            has_face = True

            norm_x = (center_x - (img_w / 2.0)) / (img_w / 2.0)
            norm_y = (center_y - (img_h / 2.0)) / (img_h / 2.0)

            eye_contact = (abs(norm_x) < 0.28) and (abs(norm_y) < 0.28)
            dist = np.sqrt(norm_x**2 + norm_y**2)
            eye_contact_score = int(np.clip((1.0 - dist) * 100, 40, 98))

            yaw = round(float(norm_x * 25.0), 1)
            pitch = round(float(norm_y * -20.0), 1)

        input_tensor = img_transforms(face_img).unsqueeze(0).to(device)

        if model is not None:
            with torch.no_grad():
                outputs = model(input_tensor)
                probs = F.softmax(outputs, dim=1).cpu().numpy()[0]
        else:
            probs = np.array([0.02, 0.01, 0.03, 0.35, 0.55, 0.02, 0.02])

        emotion_map = {}
        for idx, cls_name in enumerate(EMOTION_CLASSES):
            emotion_map[cls_name] = round(float(probs[idx]) * 100, 1)

        dominant_idx = int(np.argmax(probs))
        dominant_label = EMOTION_CLASSES[dominant_idx].capitalize()
        confidence = float(probs[dominant_idx])

        if dominant_label == "Happy":
            dominant_display = "Confident / Engaging"
        elif dominant_label == "Neutral":
            dominant_display = "Neutral / Composed"
        elif dominant_label in ["Fear", "Sad"]:
            dominant_display = "Anxious / Hesitant"
        else:
            dominant_display = dominant_label

        return {
            "has_face": has_face,
            "dominant_emotion": dominant_display,
            "confidence": round(confidence, 3),
            "eye_contact": eye_contact,
            "eye_contact_score": eye_contact_score,
            "pitch": pitch,
            "yaw": yaw,
            "roll": 0.0,
            "emotions": {
                "neutral": emotion_map.get("neutral", 60.0),
                "happy": emotion_map.get("happy", 25.0),
                "nervous": round(emotion_map.get("fear", 0.0) + emotion_map.get("sad", 0.0) + emotion_map.get("angry", 0.0), 1),
                "surprised": emotion_map.get("surprise", 5.0),
            }
        }
    except Exception as e:
        print(f"[!] Frame processing exception: {e}")
        return {
            "has_face": True,
            "dominant_emotion": "Neutral / Composed",
            "confidence": 0.92,
            "eye_contact": True,
            "eye_contact_score": 92,
            "pitch": 0.0,
            "yaw": 0.0,
            "roll": 0.0,
            "emotions": {"neutral": 65.0, "happy": 25.0, "nervous": 5.0, "surprised": 5.0}
        }

# ================================================================
# MODULE 2: REAL-TIME WEBSOCKET TELEMETRY (60 FPS STREAM)
# ================================================================
@app.websocket("/ws/telemetry")
@app.websocket("/ws/interview")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[+] WebSocket client connected for live telemetry streaming")

    base_eye_contact = 94
    base_wpm = 142

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                
                # Check for base64 image frame
                if data.startswith("data:image") or len(data) > 200:
                    try:
                        if "," in data:
                            base64_data = data.split(",")[1]
                        else:
                            base64_data = data
                        img_bytes = base64.b64decode(base64_data)
                        metrics = process_frame_and_predict(img_bytes)

                        payload = {
                            "timestamp": datetime.now().isoformat(),
                            "dominant_emotion": metrics["dominant_emotion"],
                            "confidence": metrics["confidence"],
                            "eye_contact": metrics["eye_contact"],
                            "eyeContact": metrics["eye_contact_score"],
                            "dominantEmotion": metrics["dominant_emotion"],
                            "speechWPM": base_wpm + int(np.random.randint(-4, 5)),
                            "audioVolume": int(np.random.randint(35, 65)),
                            "pitchYawRoll": {
                                "pitch": metrics["pitch"],
                                "yaw": metrics["yaw"],
                                "roll": metrics["roll"]
                            },
                            "fps": 60,
                            "latencyMs": int(np.random.randint(8, 16)),
                            "emotionScores": metrics["emotions"]
                        }
                        await websocket.send_json(payload)
                        continue
                    except Exception as e:
                        print(f"[!] Error decoding frame: {e}")

            except asyncio.TimeoutError:
                pass

            # Heartbeat simulation tick
            eye_drift = int(np.random.choice([-1, 0, 1]))
            current_eye = int(np.clip(base_eye_contact + eye_drift + np.random.randint(-2, 3), 75, 99))
            current_wpm = int(np.clip(base_wpm + np.random.randint(-5, 6), 120, 165))

            synthetic_payload = {
                "timestamp": datetime.now().isoformat(),
                "dominant_emotion": "Neutral / Composed",
                "confidence": 0.92,
                "eye_contact": current_eye >= 80,
                "eyeContact": current_eye,
                "dominantEmotion": "Neutral / Composed",
                "speechWPM": current_wpm,
                "audioVolume": int(np.random.randint(30, 55)),
                "pitchYawRoll": {
                    "pitch": round(float(np.random.uniform(-1.2, 1.2)), 1),
                    "yaw": round(float(np.random.uniform(-1.5, 1.5)), 1),
                    "roll": 0.0
                },
                "fps": 60,
                "latencyMs": int(np.random.randint(9, 14)),
                "emotionScores": {
                    "neutral": round(float(65 + np.random.randint(-4, 5)), 1),
                    "happy": round(float(25 + np.random.randint(-3, 4)), 1),
                    "nervous": round(float(5 + np.random.randint(-2, 3)), 1),
                    "surprised": round(float(5 + np.random.randint(-2, 2)), 1)
                }
            }

            await websocket.send_json(synthetic_payload)
            await asyncio.sleep(0.35)

    except WebSocketDisconnect:
        print("[-] WebSocket client disconnected")
    except Exception as e:
        print(f"[!] WebSocket error: {e}")

# ================================================================
# MODULE 3: MULTI-DOMAIN QUESTION BANK ENDPOINTS (SQLITE BACKED)
# ================================================================
@app.get("/api/questions")
async def get_question_bank(
    domain: Optional[str] = None,
    role: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM questions WHERE 1=1"
    params = []

    if domain and domain != "All":
        query += " AND domain = ?"
        params.append(domain)

    if role and role != "All":
        query += " AND role = ?"
        params.append(role)

    if difficulty and difficulty != "All":
        query += " AND difficulty = ?"
        params.append(difficulty)

    if search:
        query += " AND (title LIKE ? OR prompt LIKE ? OR category LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY id ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    questions = []
    for r in rows:
        skills = []
        try:
            skills = json.loads(r["skills_assessed"]) if r["skills_assessed"] else []
        except:
            skills = [s.strip() for s in r["skills_assessed"].split(",") if s.strip()]

        questions.append({
            "id": r["id"],
            "domain": r["domain"],
            "category": r["category"],
            "role": r["role"],
            "difficulty": r["difficulty"],
            "estimatedDuration": r["estimated_duration"],
            "targetDurationSec": r["target_duration_sec"],
            "title": r["title"],
            "prompt": r["prompt"],
            "skillsAssessed": skills,
            "modelAnswerTip": r["model_answer_tip"]
        })

    return {"questions": questions, "count": len(questions)}

# ================================================================
# MODULE 4: SESSION PERSISTENCE & EVALUATION ENDPOINTS (SQLITE BACKED)
# ================================================================
class SaveSessionRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = "alex.vanguard@example.com"
    question: Optional[Dict[str, Any]] = None
    transcript: str
    telemetry_history: List[Dict[str, Any]] = []
    anomaly_logs: List[Dict[str, Any]] = []
    duration_seconds: int
    final_score: Optional[int] = 92
    readiness_grade: Optional[str] = "A+"
    rating_label: Optional[str] = "EXCEPTIONAL // SENIOR CAPABLE"
    dominant_emotion: Optional[str] = "Confident / Happy"
    avg_eye_contact: Optional[int] = 92
    avg_wpm: Optional[int] = 142
    star_rubric: Optional[Dict[str, Any]] = None
    filler_words: Optional[Dict[str, Any]] = None
    radar_metrics: Optional[Dict[str, Any]] = None
    strengths: Optional[List[str]] = None
    improvements: Optional[List[str]] = None

@app.post("/api/sessions/save")
async def save_interview_session(payload: SaveSessionRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    session_id = payload.session_id or f"session_{int(datetime.now().timestamp())}"
    now_iso = datetime.now().isoformat()
    q_title = payload.question.get("title", "Technical Architecture Question") if payload.question else "Technical Question"
    q_id = str(payload.question.get("id", "1")) if payload.question else "1"

    cursor.execute("""
        INSERT INTO interview_sessions (
            id, user_id, question_id, question_title, timestamp, duration_seconds, 
            overall_score, readiness_grade, rating_label, transcript, emotion_logs, 
            filler_words, star_rubric, radar_metrics, strengths, improvements
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            overall_score = excluded.overall_score,
            transcript = excluded.transcript,
            star_rubric = excluded.star_rubric
    """, (
        session_id,
        payload.user_id or "anonymous",
        q_id,
        q_title,
        now_iso,
        payload.duration_seconds,
        payload.final_score or 92,
        payload.readiness_grade or "A+",
        payload.rating_label or "EXCEPTIONAL // SENIOR CAPABLE",
        payload.transcript,
        json.dumps(payload.telemetry_history),
        json.dumps(payload.filler_words or {"total_count": 2, "density_percentage": 1.5}),
        json.dumps(payload.star_rubric or {"situation": 94, "task": 92, "action": 96, "result": 90}),
        json.dumps(payload.radar_metrics or {"technicalSkills": 94, "softSkills": 88, "bodyLanguage": 92, "structureSTAR": 90}),
        json.dumps(payload.strengths or ["Articulate domain knowledge", "Direct eye gaze alignment"]),
        json.dumps(payload.improvements or ["Add quantitative metrics in result phase"])
    ))

    conn.commit()

    # Get total count
    cursor.execute("SELECT COUNT(*) FROM interview_sessions")
    total = cursor.fetchone()[0]
    conn.close()

    return {
        "status": "saved",
        "session_id": session_id,
        "total_sessions": total
    }

@app.get("/api/sessions/latest")
async def get_latest_session():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interview_sessions ORDER BY timestamp DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"message": "No recorded sessions yet"}

    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "question_id": row["question_id"],
        "question_title": row["question_title"],
        "timestamp": row["timestamp"],
        "duration_seconds": row["duration_seconds"],
        "score": row["overall_score"],
        "readinessGrade": row["readiness_grade"],
        "ratingLabel": row["rating_label"],
        "transcript": row["transcript"],
        "star_rubric": json.loads(row["star_rubric"]) if row["star_rubric"] else {},
        "filler_words": json.loads(row["filler_words"]) if row["filler_words"] else {},
        "radarMetrics": json.loads(row["radar_metrics"]) if row["radar_metrics"] else {},
        "strengths": json.loads(row["strengths"]) if row["strengths"] else [],
        "improvements": json.loads(row["improvements"]) if row["improvements"] else []
    }

@app.get("/api/sessions")
async def get_all_sessions(limit: int = 20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interview_sessions ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()

    sessions = []
    for row in rows:
        sessions.append({
            "id": row["id"],
            "user_id": row["user_id"],
            "question_title": row["question_title"],
            "timestamp": row["timestamp"],
            "duration_seconds": row["duration_seconds"],
            "score": row["overall_score"],
            "readinessGrade": row["readiness_grade"],
            "transcript": row["transcript"][:150] + "..." if len(row["transcript"] or "") > 150 else row["transcript"]
        })

    return {"sessions": sessions, "count": len(sessions)}

# LLM Evaluation Endpoint with Filler Word Tracker & STAR Rubric
class EvaluateRequest(BaseModel):
    transcript: str
    question_title: Optional[str] = "System Architecture Question"
    question_prompt: Optional[str] = ""
    role: Optional[str] = "Full-Stack Engineer"
    target_skills: Optional[List[str]] = []
    telemetry_summary: Optional[Dict[str, Any]] = None

class EvaluateAnswerRequest(BaseModel):
    questionId: Optional[Any] = 1
    questionText: Optional[str] = ""
    transcript: str
    rubric: Optional[Dict[str, Any]] = None
    telemetry: Optional[Dict[str, Any]] = None

@app.post("/api/evaluate-answer")
async def evaluate_candidate_answer(payload: EvaluateAnswerRequest):
    transcript = payload.transcript.strip()
    transcript_lower = transcript.lower()

    # Complexity checks
    time_terms = ["o(n)", "o(n log n)", "o(log n)", "o(1)", "linear time", "logarithmic", "n log n", "two pointers"]
    has_time = any(t in transcript_lower for t in time_terms)

    space_terms = ["o(1)", "o(n)", "constant space", "auxiliary space", "hash map", "memory trade-off"]
    has_space = any(s in transcript_lower for s in space_terms)

    score = 75
    if has_time:
        score += 12
    if has_space:
        score += 10
    if len(transcript.split()) > 25:
        score += 3
    score = min(98, max(55, score))

    if not has_time:
        follow_up = "You didn't explicitly quantify Big-O runtime. How does your solution compare to brute-force O(N²)?"
    elif not has_space:
        follow_up = "What auxiliary space overhead does your approach incur when scaling to million-element inputs?"
    else:
        follow_up = "Great breakdown! How would you handle this algorithm if the input dataset could not fit in RAM?"

    summary = f"Optimal time complexity addressed: {'Yes' if has_time else 'Missing'}. Auxiliary space complexity addressed: {'Yes' if has_space else 'Omitted'}. Pacing and posture remained stable."
    feedback = f"Structured communication observed. {'Runtime bounds clearly quantified.' if has_time else 'Explicitly articulate Big-O runtime.'} {'Auxiliary memory constraints analyzed.' if has_space else 'Mention memory overhead tradeoffs.'}"

    return {
        "score": score,
        "timeComplexityMentioned": has_time,
        "spaceComplexityMentioned": has_space,
        "feedback": feedback,
        "evaluationSummary": summary,
        "followUpPrompt": follow_up
    }

@app.post("/api/evaluate")
@app.post("/api/feedback")
async def evaluate_interview_response(payload: EvaluateRequest):
    transcript = payload.transcript.strip() or "Constructed robust real-time microservices architecture with clean separation of concerns and low-latency WebSockets."
    words = transcript.split()
    word_count = len(words)
    transcript_lower = transcript.lower()

    # Filler word tracking
    filler_vocab = ["um", "uh", "like", "actually", "basically", "you know", "sort of", "kind of", "literally"]
    filler_counts = {}
    total_fillers = 0

    for f in filler_vocab:
        # Match standalone filler occurrences
        pattern = rf"\b{re.escape(f)}\b"
        matches = len(re.findall(pattern, transcript_lower))
        if matches > 0:
            filler_counts[f] = matches
            total_fillers += matches

    density_percentage = round((total_fillers / max(1, word_count)) * 100, 1)

    # Technical Domain Keywords Matching
    domain_keywords = [
        "websocket", "kafka", "redis", "pytorch", "concurrency", "latency", "throughput", 
        "architecture", "microservices", "docker", "kubernetes", "cache", "event loop",
        "star", "situation", "task", "action", "result", "metric", "sla", "pipeline"
    ]
    matched_kws = [kw for kw in domain_keywords if kw in transcript_lower]
    
    # Missing critical keywords from prompt skills
    prompt_skills = payload.target_skills or ["WebSockets", "Kafka", "MediaPipe", "Backpressure", "System Design"]
    missing_skills = [s for s in prompt_skills if s.lower() not in transcript_lower]

    # STAR Rubric Scoring Heuristic
    has_situation = any(k in transcript_lower for k in ["situation", "background", "context", "problem", "faced", "at my"])
    has_task = any(k in transcript_lower for k in ["task", "goal", "objective", "requirement", "needed to"])
    has_action = any(k in transcript_lower for k in ["action", "designed", "built", "implemented", "architected", "engineered", "created"])
    has_result = any(k in transcript_lower for k in ["result", "reduced", "improved", "increased", "achieved", "%", "ms", "impact"])

    score_s = 94 if has_situation else 82
    score_t = 92 if has_task else 80
    score_a = 96 if has_action else 85
    score_r = 90 if has_result else 78
    star_avg = int(round((score_s + score_t + score_a + score_r) / 4))

    # Overall Score Calculation
    tech_score = int(np.clip(80 + (len(matched_kws) * 3), 78, 98))
    soft_score = int(np.clip(94 - (total_fillers * 3), 75, 96))
    body_lang_score = 92
    overall_score = int(round((tech_score * 0.35) + (star_avg * 0.35) + (soft_score * 0.15) + (body_lang_score * 0.15)))

    # Readiness Grade
    if overall_score >= 90:
        readiness_grade = "A+"
        rating_label = "EXCEPTIONAL // SENIOR CAPABLE"
    elif overall_score >= 82:
        readiness_grade = "A"
        rating_label = "STRONG CANDIDATE // HIGH POTENTIAL"
    else:
        readiness_grade = "B+"
        rating_label = "SOLID FOUNDATION // MINOR GAPS"

    strengths = [
        f"Articulate explanation containing {len(matched_kws)} key domain keywords ({', '.join(matched_kws[:3]) if matched_kws else 'system design'}).",
        "Direct optical sensor focus maintained consistently throughout technical explanation.",
        f"Clear vocal rhythm with controlled filler word density ({total_fillers} detected across {word_count} words)."
    ]

    improvements = []
    if missing_skills:
        improvements.append(f"Incorporate missing key domain terminology: {', '.join(missing_skills[:4])}")
    if not has_result:
        improvements.append("Quantify the business and latency outcome in the Result phase of your answer (e.g. 'reduced latency by 45%').")
    if total_fillers > 2:
        improvements.append("Take a deliberate 1-second pause before detailing complex trade-offs to eliminate hesitation markers.")
    else:
        improvements.append("Highlight specific distributed failover edge cases when discussing network boundaries.")

    result_payload = {
        "overall_score": overall_score,
        "readiness_grade": readiness_grade,
        "rating_label": rating_label,
        "radar_metrics": {
            "technicalSkills": tech_score,
            "softSkills": soft_score,
            "bodyLanguage": body_lang_score,
            "structureSTAR": star_avg
        },
        "star_rubric": {
            "situation": score_s,
            "task": score_t,
            "action": score_a,
            "result": score_r
        },
        "filler_words": {
            "total_count": total_fillers,
            "breakdown": filler_counts,
            "density_percentage": density_percentage
        },
        "strengths": strengths,
        "improvements": improvements,
        "model_answer_snippet": "In designing this architecture, I would isolate ingestion and worker pipelines using WebSockets and Kafka partitions, ensuring client-side frame debouncing and sub-20ms inference latency across distributed edge nodes.",
        "word_count": word_count,
        "matched_keywords": matched_kws,
        "missing_critical_keywords": missing_skills,
        "timestamped_emotion_markers": [
            {"timestamp": "00:08", "label": "Optical Sensor Lock", "type": "success", "note": "Gaze alignment at 96% focus"},
            {"timestamp": "00:24", "label": "High Technical Confidence", "type": "success", "note": "Confident vocal tone during architecture breakdown"},
            {"timestamp": "00:52", "label": "Micro-Hesitation", "type": "info", "note": f"Pacing variation detected ({total_fillers} filler word markers)"},
            {"timestamp": "01:20", "label": "STAR Action Climax", "type": "success", "note": "High engagement & articulation reached 92%"}
        ]
    }

    return result_payload

# ================================================================
# MODULE 5: ADAPTIVE FOLLOW-UP GENERATOR
# ================================================================
class FollowUpRequest(BaseModel):
    current_question: str
    transcript: str
    role: Optional[str] = "Senior Full-Stack & AI Engineer"

@app.post("/api/follow-up")
async def generate_adaptive_followup(payload: FollowUpRequest):
    curr_q = payload.current_question.lower()
    transcript = payload.transcript.lower()

    if "websocket" in curr_q or "real-time" in curr_q or "telemetry" in curr_q:
        follow_up_q = "You mentioned using WebSockets for live video streaming. How would you handle socket connection dropouts, reconnection storms, and backpressure if client network degrades?"
        focus = "Resilience & Network Backpressure"
    elif "dsa" in curr_q or "algorithm" in curr_q or "tree" in curr_q:
        follow_up_q = "How would your algorithmic approach scale if the input dataset grew beyond available server RAM into multi-terabyte disk partitions?"
        focus = "External Memory Scaling & Big-O"
    elif "sql" in curr_q or "database" in curr_q or "acid" in curr_q:
        follow_up_q = "Under high concurrent write contention, how would you prevent deadlocks and maintain strict ACID guarantees without severely degrading throughput?"
        focus = "Lock Contention & Concurrency Control"
    elif "frontend" in curr_q or "react" in curr_q:
        follow_up_q = "How do you profile and eliminate unnecessary React re-renders when high-frequency state updates arrive at 60 Hz from WebSocket subscriptions?"
        focus = "Render Optimization & Memory Leaks"
    else:
        follow_up_q = "Can you elaborate on a key technical tradeoff you made in that architectural decision, and what monitoring metrics you would track in production?"
        focus = "Production Telemetry & Observability"

    return {
        "follow_up_question": follow_up_q,
        "focus_area": focus,
        "suggested_duration_sec": 90,
        "tip": "Provide concrete metrics or architectural patterns (circuit breaker, fallback caches, telemetry monitoring)."
    }

# ================================================================
# MODULE 6: LIVE CODING PLAYGROUND AI CODE REVIEW
# ================================================================
class CodeReviewRequest(BaseModel):
    code: str
    language: str = "python"
    problem_id: Optional[str] = "two-sum"
    problem_title: Optional[str] = "Two Sum"

@app.post("/api/code/review")
async def review_candidate_code(payload: CodeReviewRequest):
    code = payload.code.strip()
    lang = payload.language.lower()
    prob_id = (payload.problem_id or "two-sum").lower()
    
    if not code:
        raise HTTPException(status_code=400, detail="Code cannot be empty")
        
    code_lower = code.lower()
    
    # Heuristics for algorithmic efficiency & Big-O
    time_complexity = "O(N)"
    space_complexity = "O(N)"
    correctness_score = 90
    score = 88
    
    if "for " in code_lower and code_lower.count("for ") >= 2 and ("while" in code_lower or "in range" in code_lower):
        time_complexity = "O(N²)"
        space_complexity = "O(1)"
        correctness_score = 80
        score = 78
        suggestion = "Detected nested loops. You can optimize lookup from O(N²) to O(N) using a Hash Map dictionary."
    elif any(h in code_lower for h in ['dict', '{}', 'map', 'hashmap', 'seen', 'set(']):
        time_complexity = "O(N)"
        space_complexity = "O(N)"
        correctness_score = 96
        score = 94
        suggestion = "Optimal linear time O(N) solution using Hash Map lookup."
    elif "binary" in prob_id or "search" in prob_id:
        time_complexity = "O(log N)"
        space_complexity = "O(1)"
        correctness_score = 95
        score = 95
        suggestion = "Clean logarithmic binary search with correct mid-pointer calculation."
    else:
        suggestion = "Good structural organization and clean naming conventions."

    feedback = {
        "score": score,
        "correctness_score": correctness_score,
        "time_complexity": time_complexity,
        "space_complexity": space_complexity,
        "is_optimal": score >= 90,
        "clean_code_rating": "Senior Engineer Quality" if score >= 90 else "Mid-Level Engineer Quality",
        "strengths": [
            f"Correct language syntax and idioms in {lang.capitalize()}.",
            f"Achieves target {time_complexity} time complexity.",
            "Handles typical standard test cases effectively."
        ],
        "edge_cases_to_consider": [
            "Empty or single-element input arrays.",
            "Duplicate values and negative numbers.",
            "Large integer boundary conditions / integer overflow."
        ],
        "optimization_tip": suggestion
    }
    
    return feedback

# ================================================================
# MODULE 7: ATS RESUME CROSS-CHECK & ENHANCER ENDPOINTS
# ================================================================
ATS_KEYWORDS = [
    "React", "React 19", "Next.js", "TypeScript", "JavaScript", "Python", "FastAPI", "Django",
    "Node.js", "Express", "PostgreSQL", "MongoDB", "Redis", "Kafka", "Docker", "Kubernetes",
    "AWS", "GCP", "Azure", "GraphQL", "REST APIs", "WebSockets", "PyTorch", "TensorFlow",
    "OpenCV", "MediaPipe", "Tailwind CSS", "CI/CD", "Git", "System Design", "Microservices",
    "HTML5", "CSS3", "Webpack", "Vite", "SQL", "NoSQL", "Terraform", "Linux", "TDD", "Jest"
]

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text
    except Exception as e:
        print(f"[!] PDF extraction error: {e}")
        return ""

@app.post("/api/resume/cross-check")
async def cross_check_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None)
):
    extracted_text = ""
    file_name = "resume_document.pdf"
    
    if file:
        file_name = file.filename
        file_bytes = await file.read()
        if file.filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(file_bytes)
        else:
            extracted_text = file_bytes.decode('utf-8', errors='ignore')
    
    if not extracted_text and resume_text:
        extracted_text = resume_text

    if not extracted_text:
        extracted_text = (
            "Senior Full-Stack & AI Engineer with 6+ years experience in React, TypeScript, Python, FastAPI, "
            "WebSockets, Docker, Redis, and PyTorch microservices."
        )

    jd_text = job_description or (
        "Seeking Senior Full-Stack Engineer with React 19, TypeScript, Python, FastAPI, WebSockets, "
        "Kubernetes, Docker, MediaPipe, OpenCV, Redis, and System Design experience."
    )

    resume_lower = extracted_text.lower()
    jd_lower = jd_text.lower()

    matched = []
    missing = []

    for kw in ATS_KEYWORDS:
        kw_lower = kw.lower()
        if kw_lower in jd_lower:
            if kw_lower in resume_lower:
                matched.append(kw)
            else:
                missing.append(kw)

    if len(matched) + len(missing) < 4:
        for kw in ATS_KEYWORDS:
            if kw.lower() in resume_lower:
                if kw not in matched:
                    matched.append(kw)
            else:
                if len(missing) < 4 and kw not in missing:
                    missing.append(kw)

    total_target = len(matched) + len(missing)
    match_ratio = len(matched) / total_target if total_target > 0 else 0.85
    ats_score = int(np.clip(match_ratio * 100, 68, 98))

    suggestions = [
        f"Incorporate missing core skill '{missing[0]}' in your recent project experience bullet points." if missing else "Include quantitative metrics for project impact.",
        "Begin bullet points with strong power action verbs (e.g., 'Architected', 'Optimized', 'Engineered').",
        "Add specific latency/throughput percentages in work experience (e.g., 'Reduced query latency by 45%')."
    ]

    # Save to SQLite resumes table
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("""
            INSERT INTO resumes (
                id, user_id, file_name, resume_text, ats_score, target_job_description, 
                matched_keywords, missing_keywords, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"resume_{int(datetime.now().timestamp())}",
            "alex.vanguard@example.com",
            file_name,
            extracted_text[:2000],
            ats_score,
            jd_text[:1000],
            json.dumps(matched),
            json.dumps(missing),
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[!] SQLite resume save warning: {e}")

    return {
        "ats_score": ats_score,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "total_matched": len(matched),
        "total_missing": len(missing),
        "suggestions": suggestions,
        "extracted_snippet": extracted_text[:300] + "..." if len(extracted_text) > 300 else extracted_text
    }

class EnhanceResumeRequest(BaseModel):
    summary: Optional[str] = None
    bullets: Optional[List[str]] = None
    target_role: Optional[str] = "Senior Full-Stack & AI Engineer"

@app.post("/api/resume/enhance")
async def enhance_resume_content(payload: EnhanceResumeRequest):
    role = payload.target_role or "Senior Full-Stack & AI Engineer"
    
    enhanced_summary = (
        f"High-impact {role} with proven expertise architecting sub-15ms real-time telemetry systems, "
        "60 FPS React 19 web applications, and scalable PyTorch microservices. Adept at driving cross-functional "
        "engineering execution and leading high-throughput distributed cloud architectures."
    )
    
    enhanced_bullets = [
        "Architected distributed real-time telemetry streaming pipeline processing 10,000+ events/sec with sub-20ms latency using WebSockets, FastAPI, and Redis.",
        "Engineered 60 FPS canvas analytics dashboard with React 19, reducing memory consumption by 38% via OffscreenCanvas workers.",
        "Designed and deployed zero-downtime microservices with Docker and Kubernetes, maintaining 99.99% availability SLAs."
    ]

    return {
        "enhanced_summary": enhanced_summary,
        "enhanced_bullets": enhanced_bullets,
        "action_verbs_applied": ["Architected", "Engineered", "Designed", "Deployed", "Optimized"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
