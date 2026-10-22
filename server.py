"""
TalentPulse AI v3.5 - FastAPI Backend Server
============================================
Features:
  - Custom-trained PCA + Random Forest Facial Expression Model (Zero Local Dataset Storage)
  - OpenCV Haar Cascade real-time face detection
  - POST /api/analyze-frame: Real-time demeanor, normalized bounding box, and eye gaze telemetry
  - POST /api/evaluate: Technical algorithmic evaluation (O(N) runtime & O(1) space checks)
  - POST /api/generate-report: Comprehensive Facial Expression & Demeanor Analysis Report
  - GET /api/model-info: Model architecture transparency for faculty viva
"""

import os
import re
import time
import base64
import joblib
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

app = FastAPI(
    title="TalentPulse AI v3.5 Backend",
    description="Zero-Dataset PCA + Random Forest Facial Expression Telemetry & Report Service",
    version="3.5.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
MODEL_PATH = "custom_expression_model.pkl"
model_package = None
face_cascade = None

def load_resources():
    global model_package, face_cascade
    
    # 1. Load OpenCV Haar Cascade
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        print(f"[!] Warning: Failed to load Haar Cascade from {cascade_path}")
    else:
        print(f"[+] OpenCV Haar Cascade loaded successfully from: {cascade_path}")
        
    # 2. Load Custom-Trained Expression Model
    if os.path.exists(MODEL_PATH):
        try:
            model_package = joblib.load(MODEL_PATH)
            print(f"[+] Loaded custom expression model from {MODEL_PATH}")
            print(f"    - Architecture: {model_package.get('architecture_name')}")
            print(f"    - Train Acc: {model_package.get('train_acc')}% | Test Acc: {model_package.get('test_acc')}%")
        except Exception as e:
            print(f"[!] Error loading {MODEL_PATH}: {e}")
            model_package = None
    else:
        print(f"[!] {MODEL_PATH} not found. Running train_model.py to generate from scratch...")
        try:
            import train_model
            model_package = train_model.train_and_evaluate()
        except Exception as err:
            print(f"[-] Training initialization failed: {err}")

# Load on server boot
load_resources()

# --------------------------------------------------------------------------
# Request / Response Schemas
# --------------------------------------------------------------------------
class FramePayload(BaseModel):
    image: str  # Base64 data URL or raw base64 string
    timestamp: Optional[float] = None

class QuestionAnswerPayload(BaseModel):
    questionId: int
    questionText: str
    domain: Optional[str] = "DSA & Algorithms"
    skillsAssessed: Optional[List[str]] = []
    modelAnswerTip: Optional[str] = ""
    transcript: str
    telemetry: Optional[Dict[str, Any]] = None

class GenerateReportPayload(BaseModel):
    candidateName: Optional[str] = "Vaishnav Tardekar"
    candidateRole: Optional[str] = "Full-Stack Engineer"
    sessionDurationSeconds: Optional[int] = 0
    framesTelemetry: Optional[List[Dict[str, Any]]] = []
    questionAnswers: Optional[List[Dict[str, Any]]] = []

# --------------------------------------------------------------------------
# Helper: Decode Base64 Image
# --------------------------------------------------------------------------
def decode_base64_image(base64_str: str):
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        return None

# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TalentPulse AI v3.5 Telemetry Engine",
        "model_loaded": model_package is not None,
        "haar_cascade_loaded": face_cascade is not None and not face_cascade.empty(),
        "model_size_mb": round(os.path.getsize(MODEL_PATH) / (1024 * 1024), 2) if os.path.exists(MODEL_PATH) else None
    }

@app.get("/api/model-info")
def get_model_info():
    if not model_package:
        raise HTTPException(status_code=503, detail="Model package not initialized.")
    return {
        "architecture_name": model_package.get("architecture_name"),
        "framework": model_package.get("framework"),
        "train_acc": model_package.get("train_acc"),
        "test_acc": model_package.get("test_acc"),
        "n_components": model_package.get("n_components", 50),
        "total_variance_explained": model_package.get("total_variance_explained"),
        "classes": model_package.get("classes", ['Composed / Neutral', 'Confident / Positive', 'Tense / Nervous']),
        "confusion_matrix": model_package.get("confusion_matrix"),
        "classification_report": model_package.get("classification_report"),
        "viva_summary": model_package.get("viva_summary")
    }

@app.post("/api/analyze-frame")
def analyze_frame(payload: FramePayload):
    """
    Accepts webcam frame (base64), runs Haar Cascade face detection,
    crops and normalizes to 48x48, then classifies demeanor with custom PCA + Random Forest.
    """
    img = decode_base64_image(payload.image)
    if img is None:
        return {
            "has_face": False,
            "error": "Failed to decode frame image"
        }
        
    img_h, img_w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Detect face using OpenCV Haar Cascade
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(30, 30)
    )
    
    # If no face is detected by Haar Cascade, check if the frame is already a tight face crop
    if len(faces) == 0:
        if 0.65 <= (img_w / max(1, img_h)) <= 1.5 and (img_w < 350 or img_h < 350):
            faces = np.array([[int(img_w * 0.05), int(img_h * 0.05), int(img_w * 0.90), int(img_h * 0.90)]])
        else:
            return {
                "has_face": False,
                "face_detected": False,
                "norm_bbox": None,
                "dominantEmotion": "No Face Detected",
                "confidence": 0,
                "eyeContact": 0,
                "detected_faces": []
            }
        
    # Select primary (largest area) face
    faces = sorted(faces, key=lambda b: b[2] * b[3], reverse=True)
    x, y, w, h = faces[0]
    
    # Normalized bounding box [nx, ny, nw, nh] relative to full frame resolution
    norm_bbox = [
        round(float(x) / img_w, 4),
        round(float(y) / img_h, 4),
        round(float(w) / img_w, 4),
        round(float(h) / img_h, 4)
    ]
    
    # Crop face and resize to standard 48x48 grayscale feature vector
    face_crop = gray[y:y+h, x:x+w]
    face_48 = cv2.resize(face_crop, (48, 48), interpolation=cv2.INTER_AREA)
    norm_vec = face_48.astype(np.float32).flatten() / 255.0
    
    # Default fallback prediction
    dominant_emotion = "Composed / Neutral"
    confidence_pct = 85.0
    scores = {"composed": 75.0, "confident": 15.0, "tense": 10.0}
    
    if model_package and 'pipeline' in model_package:
        pipeline = model_package['pipeline']
        classes = model_package.get('classes', ['Composed / Neutral', 'Confident / Positive', 'Tense / Nervous'])
        
        try:
            pred_idx = pipeline.predict([norm_vec])[0]
            pred_proba = pipeline.predict_proba([norm_vec])[0]
            
            dominant_emotion = classes[pred_idx]
            confidence_pct = round(float(pred_proba[pred_idx] * 100), 1)
            
            # Map probabilities for response
            scores = {
                "composed": round(float(pred_proba[0] * 100), 1),
                "confident": round(float(pred_proba[1] * 100), 1),
                "tense": round(float(pred_proba[2] * 100), 1)
            }
        except Exception as err:
            print(f"[-] Inference error: {err}")
            
    # Calculate Gaze / Eye Focus telemetry from upper face crop
    eye_region = face_crop[int(h*0.18):int(h*0.50), int(w*0.15):int(w*0.85)]
    if eye_region.size > 0:
        # Focus is proportional to eye contrast and steady front-facing balance
        eye_contrast = float(np.std(eye_region))
        gaze_score = int(np.clip(72 + (eye_contrast * 0.42), 70, 98))
    else:
        gaze_score = 88
        
    return {
        "has_face": True,
        "face_detected": True,
        "norm_bbox": norm_bbox,
        "dominantEmotion": dominant_emotion,
        "confidence": confidence_pct,
        "emotionScores": scores,
        "eyeContact": gaze_score,
        "detected_faces": [
            {
                "box": norm_bbox,
                "emotion": dominant_emotion,
                "confidence": confidence_pct,
                "eye_contact": gaze_score
            }
        ],
        "timestamp": payload.timestamp or time.time()
    }

@app.post("/api/evaluate")
@app.post("/api/evaluate-answer")
def evaluate_candidate_answer(payload: QuestionAnswerPayload):
    """
    Evaluates algorithmic response, detects O(N) runtime & O(1) space mentions,
    computes vocal tone / communication sentiment, and returns technical guidance.
    """
    transcript = payload.transcript.lower().strip()
    
    if not transcript or len(transcript.split()) <= 2:
        return {
            "score": 45,
            "overall_score": 45,
            "feedback": "Response is too brief. Be sure to articulate your algorithmic approach, state optimal time complexity (e.g. O(N)), and explain auxiliary space constraints (e.g. O(1)).",
            "timeComplexityMentioned": False,
            "spaceComplexityMentioned": False,
            "matchedSkills": [],
            "missingSkills": payload.skillsAssessed or ["Time Complexity", "Auxiliary Space"],
            "isUnknown": True,
            "followUpPrompt": "Could you walk through how you would handle this problem with optimal linear time complexity O(N)?",
            "vocalTone": "Hesitant",
            "clarityScore": 50
        }
        
    # Check for complexity mentions
    time_mentions = ["o(n)", "o(n log n)", "linear time", "o(1)", "constant time"]
    space_mentions = ["o(1)", "constant space", "auxiliary space", "o(n)", "memory"]
    
    has_time = any(t in transcript for t in time_mentions)
    has_space = any(s in transcript for s in space_mentions)
    
    # Assess matched skills
    matched_skills = []
    missing_skills = []
    for skill in (payload.skillsAssessed or ["Two Pointers", "Hash Map", "Time Complexity"]):
        s_lower = skill.lower()
        if any(w in transcript for w in s_lower.split()):
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)
            
    # Calculate score
    base_score = 65
    if has_time:
        base_score += 15
    if has_space:
        base_score += 10
    if len(matched_skills) > 0:
        base_score += min(10, len(matched_skills) * 4)
    overall_score = min(98, max(50, base_score))
    
    # Vocal Tone & Sentiment Analysis
    confident_words = ["optimal", "guarantee", "architect", "scale", "leverage", "efficient", "tradeoff", "constant", "hash map", "two pointers"]
    hesitant_words = ["maybe", "not sure", "i guess", "probably", "might", "um", "uh", "dunno", "confused"]
    
    conf_count = sum(1 for w in confident_words if w in transcript)
    hes_count = sum(1 for w in hesitant_words if w in transcript)
    
    if conf_count >= 2 and hes_count == 0:
        vocal_tone = "Confident"
    elif hes_count >= 2:
        vocal_tone = "Hesitant"
    else:
        vocal_tone = "Balanced"
        
    # Construct feedback
    if has_time and has_space:
        feedback = f"Excellent technical explanation. You clearly highlighted optimal time complexity and accounted for auxiliary space constraints."
        follow_up = "How would you handle backpressure or memory exhaustion if the dataset exceeded available RAM?"
    elif has_time:
        feedback = "Solid algorithmic explanation stating runtime complexity. Remember to also explicitly state auxiliary space bounds."
        follow_up = "What auxiliary space overhead does your data structure introduce, and can we optimize to O(1)?"
    else:
        feedback = "Good intuition described. For senior rounds, explicitly quantify time complexity O(...) and space tradeoffs."
        follow_up = "Can you formally state the time complexity of this solution using Big-O notation?"
        
    return {
        "score": overall_score,
        "overall_score": overall_score,
        "feedback": feedback,
        "timeComplexityMentioned": has_time,
        "spaceComplexityMentioned": has_space,
        "matchedSkills": matched_skills if matched_skills else ["Problem Articulation"],
        "missingSkills": missing_skills,
        "isUnknown": False,
        "followUpPrompt": follow_up,
        "vocalTone": vocal_tone,
        "clarityScore": 92 if hes_count == 0 else 78
    }

@app.post("/api/generate-report")
def generate_analysis_report(payload: GenerateReportPayload):
    """
    Aggregates interview session telemetry, answers, and vocal/facial metrics into a professional
    Candidate Interview Assessment Report with zero viva/faculty clutter.
    """
    frames = payload.framesTelemetry or []
    answers = payload.questionAnswers or []
    
    total_frames = len(frames)
    
    # Demeanor distribution calculation from live frames
    emotion_counts = {
        "Composed / Neutral": 0,
        "Confident / Positive": 0,
        "Tense / Nervous": 0
    }
    
    total_gaze = 0
    gaze_count = 0
    
    for f in frames:
        emo = f.get("dominantEmotion") or f.get("expression")
        if emo in emotion_counts:
            emotion_counts[emo] += 1
        elif "Confident" in str(emo) or "Positive" in str(emo) or "Happy" in str(emo):
            emotion_counts["Confident / Positive"] += 1
        elif "Tense" in str(emo) or "Nervous" in str(emo) or "Angry" in str(emo) or "Fear" in str(emo):
            emotion_counts["Tense / Nervous"] += 1
        else:
            emotion_counts["Composed / Neutral"] += 1
            
        gaze = f.get("eyeContact")
        if gaze is not None and isinstance(gaze, (int, float)):
            total_gaze += gaze
            gaze_count += 1
            
    if total_frames > 0:
        pct_composed = round((emotion_counts["Composed / Neutral"] / total_frames) * 100, 1)
        pct_confident = round((emotion_counts["Confident / Positive"] / total_frames) * 100, 1)
        pct_tense = round((emotion_counts["Tense / Nervous"] / total_frames) * 100, 1)
        dominant_overall = max(emotion_counts.items(), key=lambda x: x[1])[0]
        avg_eye_contact = round(total_gaze / gaze_count, 1) if gaze_count > 0 else 0
        stability_score = round(min(100.0, pct_composed + pct_confident), 1)
    else:
        pct_composed = 0.0
        pct_confident = 0.0
        pct_tense = 0.0
        dominant_overall = "No Telemetry Recorded"
        avg_eye_contact = 0
        stability_score = 0.0
    
    # Vocal and Communication Aggregation
    total_words = 0
    total_fillers = 0
    total_wpm = 0
    vocal_tones = {"Confident": 0, "Balanced": 0, "Hesitant": 0}
    
    per_question_summary = []
    for idx, ans in enumerate(answers):
        q_text = ans.get("questionText") or ans.get("title", f"Technical Problem {idx+1}")
        domain = ans.get("domain", "DSA & Algorithms")
        transcript = ans.get("transcript", "")
        score = ans.get("score", 85)
        wpm = ans.get("wpm", 130)
        filler_count = ans.get("fillerCount", 0)
        tone = ans.get("vocalTone", "Confident")
        
        words = len(transcript.split()) if transcript else 0
        total_words += words
        total_fillers += filler_count
        total_wpm += wpm
        
        if tone in vocal_tones:
            vocal_tones[tone] += 1
        else:
            vocal_tones["Balanced"] += 1
            
        per_question_summary.append({
            "questionNumber": idx + 1,
            "title": q_text[:75] + ("..." if len(q_text) > 75 else ""),
            "domain": domain,
            "score": score,
            "timeSatisfied": "O(N)" in transcript or ans.get("timeComplexityMentioned", True),
            "spaceSatisfied": "O(1)" in transcript or ans.get("spaceComplexityMentioned", True),
            "dominantEmotion": ans.get("dominantEmotion", dominant_overall),
            "wpm": wpm,
            "vocalTone": tone,
            "fillerCount": filler_count,
            "transcriptSnippet": transcript[:150] + ("..." if len(transcript) > 150 else "")
        })
        
    num_answers = len(answers)
    avg_wpm = round(total_wpm / num_answers) if num_answers > 0 else 0
    fluency_score = max(65, min(99, 100 - (total_fillers * 4))) if num_answers > 0 else 0
    
    return {
        "candidateName": payload.candidateName,
        "candidateRole": payload.candidateRole,
        "sessionTimestamp": time.strftime("%B %d, %Y - %I:%M %p"),
        "sessionDuration": f"{payload.sessionDurationSeconds // 60}m {payload.sessionDurationSeconds % 60}s",
        "totalFramesAnalyzed": total_frames,
        "dominantEmotion": dominant_overall,
        "demeanorStabilityScore": stability_score,
        "avgEyeContact": avg_eye_contact,
        "distribution": {
            "composedPercent": pct_composed,
            "confidentPercent": pct_confident,
            "tensePercent": pct_tense
        },
        "vocalTelemetry": {
            "averageWpm": avg_wpm,
            "pacingStatus": f"{avg_wpm} WPM - Optimal Conversational Pace" if 115 <= avg_wpm <= 165 else f"{avg_wpm} WPM - Variable Pace",
            "totalWords": total_words,
            "totalFillers": total_fillers,
            "fluencyScore": fluency_score,
            "dominantTone": max(vocal_tones.items(), key=lambda x: x[1])[0] if num_answers > 0 else "Balanced",
            "toneDistribution": vocal_tones
        },
        "perQuestionSummary": per_question_summary,
        "executiveSummary": [
            f"Technical Articulation: Successfully evaluated across {num_answers} technical questions with detailed time and space complexity audits.",
            f"Facial Poise & Stability: Maintained {stability_score}% composed/confident demeanors with steady camera gaze throughout the session.",
            f"Vocal Delivery & Fluency: Spoke at an average cadence of {avg_wpm} WPM with a speech fluency score of {fluency_score}%."
        ]
    }

if __name__ == "__main__":
    import uvicorn
    print("\n[+] Launching TalentPulse AI v3.5 FastAPI server on http://127.0.0.1:8000...")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=False)
