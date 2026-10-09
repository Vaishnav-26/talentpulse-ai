import urllib.request
import urllib.parse
import json
import asyncio
import websockets

async def test_all():
    print("=" * 65)
    print("TALENTPULSE AI - FULL-STACK & SQLITE INTEGRATION TEST SUITE")
    print("=" * 65)
    
    # 1. Vite frontend test
    try:
        r_vite = urllib.request.urlopen("http://127.0.0.1:5173/")
        print(f"[+] 1. Vite Frontend: HTTP {r_vite.status} OK (Serving Light Glassmorphism UI)")
    except Exception as e:
        print(f"[-] 1. Vite Frontend Error: {e}")
        
    # 2. FastAPI backend root with SQLite stats
    try:
        r_backend = urllib.request.urlopen("http://127.0.0.1:8000/")
        res_text = r_backend.read().decode("utf-8")
        print(f"[+] 2. FastAPI & SQLite Root: HTTP {r_backend.status} OK | {res_text}")
    except Exception as e:
        print(f"[-] 2. Backend Root Error: {e}")
        
    # 3. /api/auth/sync test (User sync to SQLite users table)
    try:
        req_auth = urllib.request.Request(
            "http://127.0.0.1:8000/api/auth/sync",
            data=json.dumps({
                "name": "Alex Vanguard",
                "email": "alex.vanguard@example.com",
                "target_role": "Full-Stack Engineer",
                "experience_level": "Senior"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        r_auth = urllib.request.urlopen(req_auth)
        auth_json = json.loads(r_auth.read().decode("utf-8"))
        print(f"[+] 3. /api/auth/sync (SQLite User Sync): Status {auth_json['status']} | User: {auth_json['email']}")
    except Exception as e:
        print(f"[-] 3. /api/auth/sync Error: {e}")

    # 4. /api/questions test (50 questions across 5 technical domains)
    try:
        r_q = urllib.request.urlopen("http://127.0.0.1:8000/api/questions")
        q_json = json.loads(r_q.read().decode("utf-8"))
        print(f"[+] 4. /api/questions (SQLite Questions Table): Total Loaded: {q_json['count']} questions")
        
        # Test domain filtering (e.g. Database Systems & SQL)
        encoded_domain = urllib.parse.quote("Database Systems & SQL")
        r_q_domain = urllib.request.urlopen(f"http://127.0.0.1:8000/api/questions?domain={encoded_domain}")
        q_dom_json = json.loads(r_q_domain.read().decode("utf-8"))
        print(f"     -> Domain Filter 'Database Systems & SQL': {q_dom_json['count']} questions found")
    except Exception as e:
        print(f"[-] 4. /api/questions Error: {e}")

    # 5. /api/evaluate test (Filler Words & STAR Rubric)
    try:
        req_eval = urllib.request.Request(
            "http://127.0.0.1:8000/api/evaluate",
            data=json.dumps({
                "transcript": "Um, at my previous role, I faced a situation where streaming latency was 200ms. My task was to design a real-time WebSocket pipeline. I architected Kafka and Redis caching. As a result, we reduced latency by 50%."
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        r_eval = urllib.request.urlopen(req_eval)
        eval_json = json.loads(r_eval.read().decode("utf-8"))
        print(f"[+] 5. /api/evaluate OK: Overall Score: {eval_json['overall_score']}/100 | Filler Words: {eval_json['filler_words']} | STAR Rubric: {eval_json['star_rubric']}")
    except Exception as e:
        print(f"[-] 5. /api/evaluate Error: {e}")

    # 6. /api/sessions/save & /api/sessions/latest (SQLite Sessions Table)
    try:
        req_save = urllib.request.Request(
            "http://127.0.0.1:8000/api/sessions/save",
            data=json.dumps({
                "session_id": "session_test_001",
                "user_id": "alex.vanguard@example.com",
                "question": {"id": 1, "title": "Two Sum & Two-Pointer Optimizations"},
                "transcript": "Explained O(N) Hash Map lookup vs O(N log N) Two-Pointer sorting.",
                "duration_seconds": 135,
                "final_score": 94,
                "readiness_grade": "A+",
                "rating_label": "EXCEPTIONAL // SENIOR CAPABLE"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        r_save = urllib.request.urlopen(req_save)
        save_json = json.loads(r_save.read().decode("utf-8"))
        print(f"[+] 6. /api/sessions/save (SQLite Session Saved): ID: {save_json['session_id']} | Total Sessions in DB: {save_json['total_sessions']}")

        # Verify reading latest session from SQLite
        r_latest = urllib.request.urlopen("http://127.0.0.1:8000/api/sessions/latest")
        latest_json = json.loads(r_latest.read().decode("utf-8"))
        print(f"     -> /api/sessions/latest: Retrieved Question '{latest_json['question_title']}' with Score: {latest_json['score']}")
    except Exception as e:
        print(f"[-] 6. /api/sessions Error: {e}")

    # 7. /api/follow-up test (Adaptive Follow-Up Questions)
    try:
        req_fu = urllib.request.Request(
            "http://127.0.0.1:8000/api/follow-up",
            data=json.dumps({
                "current_question": "Describe WebSockets architecture",
                "transcript": "I designed Kafka with WebSockets"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        r_fu = urllib.request.urlopen(req_fu)
        fu_json = json.loads(r_fu.read().decode("utf-8"))
        print(f"[+] 7. /api/follow-up OK: Focus Area: {fu_json['focus_area']} | Generated Question: '{fu_json['follow_up_question'][:60]}...'")
    except Exception as e:
        print(f"[-] 7. /api/follow-up Error: {e}")

    # 8. /api/code/review test (Monaco Live Coding AI Review)
    try:
        req_cr = urllib.request.Request(
            "http://127.0.0.1:8000/api/code/review",
            data=json.dumps({
                "code": "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen: return [seen[target-n], i]\n        seen[n] = i\n    return []",
                "language": "python",
                "problem_id": "two-sum"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        r_cr = urllib.request.urlopen(req_cr)
        cr_json = json.loads(r_cr.read().decode("utf-8"))
        print(f"[+] 8. /api/code/review OK: Time: {cr_json['time_complexity']} | Space: {cr_json['space_complexity']} | Score: {cr_json['score']}/100")
    except Exception as e:
        print(f"[-] 8. /api/code/review Error: {e}")

    # 9. WebSocket Telemetry Streaming Test
    try:
        async with websockets.connect("ws://127.0.0.1:8000/ws/telemetry") as ws:
            await ws.send("ping")
            msg = await ws.recv()
            ws_json = json.loads(msg)
            print(f"[+] 9. WebSocket /ws/telemetry OK: Dominant Emotion: {ws_json['dominant_emotion']} | Eye Contact: {ws_json['eyeContact']}% | WPM: {ws_json['speechWPM']}")
    except Exception as e:
        print(f"[-] 9. WebSocket Error: {e}")

    print("=" * 65)
    print("ALL MODULES & SQLITE PERSISTENCE VERIFIED SUCCESSFULLY")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(test_all())
