import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera as CameraIcon, CameraOff, Eraser, Save, Loader2, Type, Hash } from "lucide-react";
import { useHandTracking } from "@/hooks/useHandTracking";
import { Results } from "@mediapipe/hands";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import PredictionPanel from "./PredictionPanel";

const GESTURE_DELAY_MS = 1500;
const ERASE_DELAY_MS = 1000;

type GestureState = "writing" | "submitting" | "erasing" | null;

const LiveDemoSection = () => {
  const [cameraOn, setCameraOn] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [gestureProgress, setGestureProgress] = useState(0);
  const [gestureState, setGestureState] = useState<GestureState>(null);
  
  // App Mode: digits vs alphabets (currently UI only, model is digits)
  const [appMode, setAppMode] = useState<"digits" | "alphabets">("digits");

  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null);

  const prevIndexTipRef = useRef<{ x: number; y: number } | null>(null);
  const actionStartTimeRef = useRef<number | null>(null);

  const setHandDetected = useAppStore((state) => state.setHandDetected);
  const setLatestPrediction = useAppStore((state) => state.setLatestPrediction);

  const clearCanvas = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const sendPrediction = useCallback(async () => {
    if (isPredicting) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    setIsPredicting(true);
    toast.info("Analyzing drawing...");

    try {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, 0);
      }

      const base64Image = tempCanvas.toDataURL("image/png");
      const res = await api.predictImage(base64Image);
      
      setLatestPrediction(res);
      toast.success(`Predicted: ${res.prediction} (${res.confidence}%)`);
      clearCanvas();
    } catch (err) {
      console.error(err);
      toast.error("Failed to predict image. Ensure backend is awake.");
    } finally {
      setIsPredicting(false);
    }
  }, [isPredicting, setLatestPrediction, clearCanvas]);

  const onHandsResults = useCallback(
    (results: Results) => {
      const skelCanvas = skeletonCanvasRef.current;
      const drawCanvas = drawingCanvasRef.current;
      if (!skelCanvas || !drawCanvas) return;

      const skelCtx = skelCanvas.getContext("2d");
      const drawCtx = drawCanvas.getContext("2d");
      if (!skelCtx || !drawCtx) return;

      if (videoRef.current && skelCanvas.width !== videoRef.current.videoWidth) {
        skelCanvas.width = videoRef.current.videoWidth;
        skelCanvas.height = videoRef.current.videoHeight;
        drawCanvas.width = videoRef.current.videoWidth;
        drawCanvas.height = videoRef.current.videoHeight;
        
        drawCtx.lineCap = "round";
        drawCtx.lineJoin = "round";
        drawCtx.lineWidth = 12;
        drawCtx.strokeStyle = "white";
      }

      skelCtx.clearRect(0, 0, skelCanvas.width, skelCanvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setHandDetected(true);
        const landmarks = results.multiHandLandmarks[0];

        skelCtx.fillStyle = "rgba(0, 255, 255, 0.8)";
        skelCtx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        skelCtx.lineWidth = 2;
        landmarks.forEach((lm) => {
          skelCtx.beginPath();
          skelCtx.arc(lm.x * skelCanvas.width, lm.y * skelCanvas.height, 4, 0, 2 * Math.PI);
          skelCtx.fill();
        });

        const thumbTip = landmarks[4];
        const thumbIp = landmarks[3];
        const indexTip = landmarks[8];
        const indexMcp = landmarks[5];
        const middleTip = landmarks[12];
        const middleMcp = landmarks[9];
        const ringTip = landmarks[16];
        const ringMcp = landmarks[13];
        const pinkyTip = landmarks[20];
        const pinkyMcp = landmarks[17];

        const x = indexTip.x * drawCanvas.width;
        const y = indexTip.y * drawCanvas.height;

        const isThumbExtended = thumbTip.y < thumbIp.y - 0.05;
        const isIndexExtended = indexTip.y < indexMcp.y;
        const isMiddleExtended = middleTip.y < middleMcp.y;
        const isRingExtended = ringTip.y < ringMcp.y;
        const isPinkyExtended = pinkyTip.y < pinkyMcp.y;

        const isIndexFolded = !isIndexExtended;
        const isMiddleFolded = !isMiddleExtended;
        const isRingFolded = !isRingExtended;
        const isPinkyFolded = !isPinkyExtended;

        // 1. Erase Gesture: Open Palm (All fingers up)
        if (isThumbExtended && isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
          setGestureState("erasing");
          if (!actionStartTimeRef.current) actionStartTimeRef.current = Date.now();
          const elapsed = Date.now() - actionStartTimeRef.current;
          setGestureProgress(Math.min((elapsed / ERASE_DELAY_MS) * 100, 100));

          if (elapsed >= ERASE_DELAY_MS) {
            actionStartTimeRef.current = null;
            setGestureProgress(0);
            clearCanvas();
            toast.success("Canvas Erased!");
          }
          prevIndexTipRef.current = null;
        } 
        // 2. Predict Gesture: Thumbs Up (Thumb up, rest folded)
        else if (isThumbExtended && isIndexFolded && isMiddleFolded && isRingFolded && isPinkyFolded) {
          setGestureState("submitting");
          if (!actionStartTimeRef.current) actionStartTimeRef.current = Date.now();
          const elapsed = Date.now() - actionStartTimeRef.current;
          setGestureProgress(Math.min((elapsed / GESTURE_DELAY_MS) * 100, 100));

          if (elapsed >= GESTURE_DELAY_MS && !isPredicting) {
            actionStartTimeRef.current = null;
            setGestureProgress(0);
            sendPrediction();
          }
          prevIndexTipRef.current = null;
        }
        // 3. Write Gesture: Index extended, rest folded
        else if (isIndexExtended && isMiddleFolded && isRingFolded && isPinkyFolded) {
          setGestureState("writing");
          actionStartTimeRef.current = null;
          setGestureProgress(0);
          
          if (prevIndexTipRef.current) {
            drawCtx.beginPath();
            drawCtx.moveTo(prevIndexTipRef.current.x, prevIndexTipRef.current.y);
            drawCtx.lineTo(x, y);
            drawCtx.stroke();
          }
          prevIndexTipRef.current = { x, y };
        } 
        // Idle
        else {
          setGestureState(null);
          actionStartTimeRef.current = null;
          setGestureProgress(0);
          prevIndexTipRef.current = null;
        }

      } else {
        setHandDetected(false);
        prevIndexTipRef.current = null;
        actionStartTimeRef.current = null;
        setGestureProgress(0);
        setGestureState(null);
      }
    },
    [setHandDetected, sendPrediction, isPredicting, clearCanvas]
  );

  const { start, stop, isActive } = useHandTracking(videoRef, onHandsResults);

  useEffect(() => {
    if (cameraOn && !isActive) start();
    else if (!cameraOn && isActive) stop();
  }, [cameraOn, start, stop, isActive]);

  return (
    <section id="demo" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="gradient-text">Live Air Writing</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            1️⃣ <strong>Index Up:</strong> Write &nbsp; • &nbsp;
            2️⃣ <strong>Thumbs Up:</strong> Submit &nbsp; • &nbsp;
            3️⃣ <strong>Open Palm:</strong> Erase
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Camera Feed & Canvas (col-span-8) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card-glow p-5 lg:col-span-8 w-full"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              
              {/* App Mode Toggle */}
              <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-glass-border">
                <button
                  onClick={() => setAppMode("alphabets")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    appMode === "alphabets" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Type className="w-4 h-4" /> Letters
                </button>
                <button
                  onClick={() => setAppMode("digits")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    appMode === "digits" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Hash className="w-4 h-4" /> Digits
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
                <button
                  onClick={sendPrediction}
                  disabled={isPredicting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50"
                >
                  {isPredicting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 
                  Predict
                </button>
                <button
                  onClick={() => setCameraOn(!cameraOn)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    cameraOn
                      ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                      : "btn-primary-glow"
                  }`}
                >
                  {cameraOn ? <CameraOff className="w-4 h-4" /> : <CameraIcon className="w-4 h-4" />}
                  {cameraOn ? "Stop Camera" : "Start Camera"}
                </button>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-xl bg-black border border-glass-border overflow-hidden shadow-2xl">
              {/* Video Element */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                style={{ transform: "scaleX(-1)", display: cameraOn ? "block" : "none" }}
              />

              {/* Drawing Canvas */}
              <canvas
                ref={drawingCanvasRef}
                className="absolute inset-0 w-full h-full object-cover z-10"
                style={{ transform: "scaleX(-1)", display: cameraOn ? "block" : "none" }}
              />

              {/* Skeleton/UI Canvas */}
              <canvas
                ref={skeletonCanvasRef}
                className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                style={{ transform: "scaleX(-1)", display: cameraOn ? "block" : "none" }}
              />

              {/* Gesture State Overlays */}
              <AnimatePresence>
                {cameraOn && gestureState === "writing" && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 left-4 z-30 bg-primary/20 backdrop-blur-md border border-primary/50 text-primary px-4 py-2 rounded-full font-bold shadow-lg"
                  >
                    ✍️ Writing...
                  </motion.div>
                )}

                {cameraOn && (gestureState === "submitting" || gestureState === "erasing") && gestureProgress > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  >
                    <div className="bg-background/80 p-6 rounded-2xl border border-primary/50 text-center shadow-2xl">
                      <p className="text-xl font-bold gradient-text mb-4">
                        {gestureState === "submitting" ? "🔍 Submitting Drawing..." : "🗑️ Erasing Canvas..."}
                      </p>
                      <div className="w-56 h-3 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-100 ease-linear ${gestureState === "submitting" ? "bg-primary" : "bg-destructive"}`}
                          style={{ width: `${gestureProgress}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30">
                  <CameraIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground/60">Camera is off. Start the camera to interact.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Prediction Panel (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
             <PredictionPanel />
          </div>

        </div>
      </div>
    </section>
  );
};

export default LiveDemoSection;
