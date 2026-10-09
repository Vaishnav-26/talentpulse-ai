import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Radio, 
  Layers,
  Server
} from 'lucide-react';


export default function DevWebSocketModal({
  isOpen,
  onClose,
  wsUrl,
  wsStatus,
  onConnectWs
}) {
  const [inputUrl, setInputUrl] = useState(wsUrl);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const pythonSnippet = `import asyncio
import json
import websockets
import cv2
import base64

# TALENTPULSE AI // PyTorch ResNet-18 Real-Time Telemetry Client
WS_URI = "ws://localhost:8000/ws/telemetry"

async def stream_optical_telemetry():
    async with websockets.connect(WS_URI) as websocket:
        print("Connected to TalentPulse AI WebSocket Telemetry Engine")
        
        cap = cv2.VideoCapture(0)
        
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
                
            # Encode frame to JPEG Base64
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
            b64_str = base64.b64encode(buffer).decode('utf-8')
            
            # Send payload to PyTorch ResNet-18 backend
            payload = {"frame": b64_str}
            await websocket.send(json.dumps(payload))
            
            # Receive real-time cognitive metrics
            response = await websocket.recv()
            metrics = json.loads(response)
            print(f"[RESNET-18] Dominant: {metrics.get('dominantEmotion')} | Eye Contact: {metrics.get('eyeContact')}%")
            
            await asyncio.sleep(0.066) # ~15 FPS transmission

asyncio.run(stream_optical_telemetry())
`;

  const jsonSchemaExample = `{
  "dominant_emotion": "Happy",
  "confidence": 0.94,
  "eye_contact": true,
  "eyeContact": 94,
  "dominantEmotion": "Happy",
  "speechWPM": 145,
  "face_detected": true,
  "emotionScores": {
    "neutral": 20,
    "happy": 68,
    "nervous": 5,
    "surprised": 4,
    "composed": 3
  }
}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      
      <div className="relative w-full max-w-4xl glass-panel-solid rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] flex flex-col my-auto overflow-hidden border border-white">
        
        {/* Header */}
        <div className="p-6 bg-white/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shadow-sm">
              <Code2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-extrabold text-slate-900 uppercase tracking-wide">
                PYTHON & WEBSOCKET INTEGRATION STANDARD
              </h3>
              <p className="text-xs font-mono-tech text-slate-500 font-medium">
                REAL-TIME TELEMETRY DATA FEED & JSON SCHEMA SPECIFICATIONS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 lg:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* WebSocket Server Connection Bar */}
          <div className="glass-panel p-5 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech font-bold text-cyan-800 uppercase flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-600 animate-pulse" />
                <span>WEBSOCKET FEED CONNECTOR</span>
              </span>
              
              <span className={`px-2.5 py-0.5 text-xs font-mono-tech font-bold rounded-lg uppercase border ${
                wsStatus === 'connected' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : wsStatus === 'connecting'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                STATUS: {wsStatus}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="ws://localhost:8000/ws/telemetry"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-xs font-mono-tech text-slate-800 focus:outline-none"
                />
              </div>

              <button
                onClick={() => onConnectWs(inputUrl)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-mono-tech font-bold text-xs shadow-[0_4px_15px_rgba(99,102,241,0.35)] transition-all cursor-pointer"
              >
                CONNECT ENDPOINT
              </button>
            </div>
          </div>

          {/* Browser Global Window Hook */}
          <div className="glass-panel p-5 rounded-2xl space-y-2">
            <h4 className="text-xs font-mono-tech font-bold text-indigo-700 uppercase flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>DIRECT IN-BROWSER JS DISPATCH (WINDOW HOOK)</span>
            </h4>
            <p className="text-xs text-slate-600 font-sans font-medium">
              Call the global JavaScript dispatcher from your browser dev tools or custom backend script:
            </p>
            <pre className="p-3.5 bg-slate-900 text-cyan-300 rounded-xl font-mono-tech text-xs overflow-x-auto shadow-inner">
              {`window.CognitiveLab.pushTelemetry({ eyeContact: 96, dominantEmotion: "Happy", speechWPM: 152 })`}
            </pre>
          </div>

          {/* Python OpenCV Code Snippet */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech font-bold text-slate-800 uppercase flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>PYTHON CLIENT TEMPLATE (OPENCV / PYTORCH / WEBSOCKETS)</span>
              </span>

              <button
                onClick={() => copyToClipboard(pythonSnippet, 'code')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono-tech font-bold transition-all shadow-2xs cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'COPIED' : 'COPY SCRIPT'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono-tech text-xs overflow-x-auto max-h-56 leading-relaxed shadow-inner">
              {pythonSnippet}
            </pre>
          </div>

          {/* JSON Schema Format */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech font-bold text-slate-800 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>TELEMETRY JSON PAYLOAD SCHEMA</span>
              </span>

              <button
                onClick={() => copyToClipboard(jsonSchemaExample, 'json')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono-tech font-bold transition-all shadow-2xs cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'COPIED' : 'COPY JSON'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-cyan-300 rounded-xl font-mono-tech text-xs overflow-x-auto leading-relaxed shadow-inner">
              {jsonSchemaExample}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
