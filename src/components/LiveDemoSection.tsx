import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera as CameraIcon, CameraOff, Eraser, Save, Loader2 } from "lucide-react";
import { useHandTracking } from "@/hooks/useHandTracking";
import { Results } from "@mediapipe/hands";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const GESTURE_DELAY_MS = 1500;

const LiveDemoSection = () => {
  const [cameraOn, setCameraOn] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [gestureProgress, setGestureProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null);

  const prevIndexTipRef = useRef<{ x: number; y: number } | null>(null);
  const thumbsUpStartTimeRef = useRef<number | null>(null);

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
      // Create a white background canvas for better prediction accuracy
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "black"; // Or white depending on what the model expects. Usually MNIST expects black background, white text
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, 0);
      }

      const base64Image = tempCanvas.toDataURL("image/png");
      const res = await api.predictImage(base64Image);
      
      setLatestPrediction(res);
      toast.success(`Predicted: ${res.prediction} (${res.confidence}%)`);
      clearCanvas(); // clear after prediction
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

      // Match canvas sizes to video
      if (videoRef.current && skelCanvas.width !== videoRef.current.videoWidth) {
        skelCanvas.width = videoRef.current.videoWidth;
        skelCanvas.height = videoRef.current.videoHeight;
        drawCanvas.width = videoRef.current.videoWidth;
        drawCanvas.height = videoRef.current.videoHeight;
        
        // initialize drawing canvas with transparent background
        drawCtx.lineCap = "round";
        drawCtx.lineJoin = "round";
        drawCtx.lineWidth = 12;
        drawCtx.strokeStyle = "white"; // White stroke for model
      }

      skelCtx.clearRect(0, 0, skelCanvas.width, skelCanvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setHandDetected(true);
        const landmarks = results.multiHandLandmarks[0];

        // Draw skeleton for visual feedback
        skelCtx.fillStyle = "rgba(0, 255, 255, 0.8)";
        skelCtx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        skelCtx.lineWidth = 2;
        landmarks.forEach((lm) => {
          skelCtx.beginPath();
          skelCtx.arc(lm.x * skelCanvas.width, lm.y * skelCanvas.height, 4, 0, 2 * Math.PI);
          skelCtx.fill();
        });

        // Track Index Finger (Landmark 8)
        const indexTip = landmarks[8];
        const indexMcp = landmarks[5];
        const thumbTip = landmarks[4];
        const thumbIp = landmarks[3];
        const middleTip = landmarks[12];
        const middleMcp = landmarks[9];

        const x = indexTip.x * drawCanvas.width;
        const y = indexTip.y * drawCanvas.height;

        // Simple heuristic: if index is extended (tip higher than mcp) and middle is folded (tip lower than mcp)
        // Note: y axis is inverted in canvas (0 is top)
        const isIndexExtended = indexTip.y < indexMcp.y;
        const isMiddleFolded = middleTip.y > middleMcp.y;

        if (isIndexExtended && isMiddleFolded) {
          // Drawing Mode!
          if (prevIndexTipRef.current) {
            drawCtx.beginPath();
            drawCtx.moveTo(prevIndexTipRef.current.x, prevIndexTipRef.current.y);
            drawCtx.lineTo(x, y);
            drawCtx.stroke();
          }
          prevIndexTipRef.current = { x, y };
        } else {
          prevIndexTipRef.current = null;
        }

        // Thumbs up gesture: Thumb is up, Index and Middle are folded
        const isThumbExtended = thumbTip.y < thumbIp.y - 0.05; // Thumb pointing up
        const isIndexFolded = indexTip.y > indexMcp.y;
        
        if (isThumbExtended && isIndexFolded && isMiddleFolded) {
          if (!thumbsUpStartTimeRef.current) {
            thumbsUpStartTimeRef.current = Date.now();
          }
          const elapsed = Date.now() - thumbsUpStartTimeRef.current;
          setGestureProgress(Math.min((elapsed / GESTURE_DELAY_MS) * 100, 100));

          if (elapsed >= GESTURE_DELAY_MS && !isPredicting) {
            thumbsUpStartTimeRef.current = null;
            setGestureProgress(0);
            sendPrediction();
          }
        } else {
          thumbsUpStartTimeRef.current = null;
          setGestureProgress(0);
        }

      } else {
        setHandDetected(false);
        prevIndexTipRef.current = null;
        thumbsUpStartTimeRef.current = null;
        setGestureProgress(0);
      }
    },
    [setHandDetected, sendPrediction, isPredicting]
  );

  const { start, stop, isActive } = useHandTracking(videoRef, onHandsResults);

  useEffect(() => {
    if (cameraOn && !isActive) {
      start();
    } else if (!cameraOn && isActive) {
      stop();
    }
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
            Raise your index finger to write. Give a <strong>Thumbs Up</strong> and hold for 1.5s to submit!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Camera Feed & Canvas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card-glow p-5 lg:col-span-2 max-w-3xl mx-auto w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={cameraOn ? "indicator-green" : "indicator-red"} />
                <span className="text-sm font-medium text-foreground">Live Camera Feed</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
                <button
                  onClick={sendPrediction}
                  disabled={isPredicting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50"
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

            <div className="relative aspect-video rounded-xl bg-black border border-glass-border overflow-hidden shadow-2xl">
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

              {/* Gesture Progress Overlay */}
              {gestureProgress > 0 && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none transition-opacity">
                  <div className="bg-background/80 p-6 rounded-2xl border border-primary/50 text-center shadow-xl">
                    <p className="text-lg font-bold gradient-text mb-4">Submitting Drawing...</p>
                    <div className="w-48 h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-100 ease-linear"
                        style={{ width: `${gestureProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30">
                  <CameraIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground/60">Camera is off. Start the camera to interact.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveDemoSection;
