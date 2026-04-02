import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { Camera, CameraOff, Eraser, Expand, Hand, Minimize, Sparkles, WandSparkles } from "lucide-react";

import type { AirWritingStatus } from "@/hooks/use-air-writing";

type LiveSystemProps = {
  status: AirWritingStatus | null;
  loading: boolean;
  error: string | null;
  activeAction: string | null;
  onClearCanvas: () => Promise<void>;
  onPredict: (imageData?: string) => Promise<unknown>;
  onUpdateTrackingStatus: (patch: Partial<AirWritingStatus>) => void;
  onSetError: (message: string | null) => void;
};

type Landmark = {
  x: number;
  y: number;
  z: number;
};

const THUMB_TIP = 4;
const THUMB_IP = 3;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;

const gestures = [
  { title: "Write", detail: "Raise your index finger" },
  { title: "Erase", detail: "Raise index + middle fingers" },
  { title: "Pause", detail: "Close your hand to stop drawing" },
  { title: "Predict", detail: "Show a thumbs-up to classify" },
];

function waitForVideoReady(video: HTMLVideoElement) {
  if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("The browser camera stream did not become ready."));
    };

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("canplay", onLoaded);
      video.removeEventListener("error", onError);
    };

    video.addEventListener("loadedmetadata", onLoaded, { once: true });
    video.addEventListener("canplay", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Camera permission was denied. Use the lock/camera icon in your browser bar and allow camera access.";
    }
    if (error.name === "NotFoundError") {
      return "No camera device was found on this system.";
    }
    if (error.name === "NotReadableError") {
      return "The camera is already in use by another application. Close other camera apps and try again.";
    }
    if (error.name === "SecurityError") {
      return "Camera access is blocked by browser security settings.";
    }
    if (error.name === "OverconstrainedError") {
      return "The requested camera settings are not supported on this device.";
    }
    return error.message || "The browser could not access the camera.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unable to access the browser camera.";
}

const LiveSystem = ({
  status,
  loading,
  error,
  activeAction,
  onClearCanvas,
  onPredict,
  onUpdateTrackingStatus,
  onSetError,
}: LiveSystemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const currentModeRef = useRef("pause");
  const pendingGestureRef = useRef<string | null>(null);
  const gestureStartTimeRef = useRef(0);
  const confirmationTimeRef = useRef(0);
  const gestureLockedRef = useRef(false);
  const previousPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPredictionTriggerRef = useRef(0);
  const settingsRef = useRef(status?.settings);

  useEffect(() => {
    settingsRef.current = status?.settings;
  }, [status?.settings]);

  useEffect(() => {
    currentModeRef.current = status?.current_mode ?? "pause";
  }, [status?.current_mode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const ensureDrawingCanvas = () => {
    const canvas = drawingCanvasRef.current ?? document.createElement("canvas");
    drawingCanvasRef.current = canvas;
    return canvas;
  };

  const stopCamera = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    previousPointRef.current = null;
    pendingGestureRef.current = null;
    gestureLockedRef.current = false;
    currentModeRef.current = "pause";

    onUpdateTrackingStatus({
      camera_active: false,
      hand_detected: false,
      current_mode: "pause",
      pending_gesture: null,
      gesture_locked: false,
      frame_updated_at: Date.now(),
    });
  };

  const clearLocalCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previousPointRef.current = null;
  };

  const exportDrawing = () => {
    if (!drawingCanvasRef.current) {
      return undefined;
    }

    return drawingCanvasRef.current.toDataURL("image/png");
  };

  const getFingerStates = (landmarks: Landmark[]) => {
    const index = landmarks[INDEX_TIP].y < landmarks[INDEX_PIP].y;
    const middle = landmarks[MIDDLE_TIP].y < landmarks[MIDDLE_PIP].y;
    const ring = landmarks[RING_TIP].y < landmarks[RING_PIP].y;
    const pinky = landmarks[PINKY_TIP].y < landmarks[PINKY_PIP].y;
    const thumb = landmarks[THUMB_TIP].x < landmarks[THUMB_IP].x;

    return { index, middle, ring, pinky, thumb };
  };

  const getGesture = (landmarks: Landmark[]) => {
    const fingers = getFingerStates(landmarks);
    const total = [fingers.index, fingers.middle, fingers.ring, fingers.pinky].filter(Boolean).length;

    if (total === 0 && !fingers.thumb) {
      return "pause";
    }
    if (total === 1 && fingers.index) {
      return "write";
    }
    if (total === 2 && fingers.index && fingers.middle) {
      return "erase";
    }
    if (fingers.thumb && total === 0) {
      return "predict";
    }
    return "unknown";
  };

  const annotateFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 23, 0.52)";
    ctx.fillRect(14, 14, 240, 84);
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 22px Arial";
    ctx.fillText(`Mode: ${currentModeRef.current}`, 26, 44);

    if (status?.prediction) {
      ctx.fillStyle = "#67e8f9";
      ctx.font = "bold 20px Arial";
      ctx.fillText(`Pred: ${status.prediction.label} (${status.prediction.confidence.toFixed(1)}%)`, 26, 74);
    }

    ctx.strokeStyle = "rgba(34,211,238,0.7)";
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.restore();
  };

  const drawStroke = (landmarks: Landmark[], width: number, height: number) => {
    const canvas = ensureDrawingCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const x = (1 - landmarks[INDEX_TIP].x) * width;
    const y = landmarks[INDEX_TIP].y * height;

    if (!previousPointRef.current) {
      previousPointRef.current = { x, y };
      return;
    }

    const alpha = settingsRef.current?.smoothing ? 0.55 : 0;
    const smoothX = alpha * previousPointRef.current.x + (1 - alpha) * x;
    const smoothY = alpha * previousPointRef.current.y + (1 - alpha) * y;

    ctx.strokeStyle = "#ffffff";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = settingsRef.current?.thickness ?? 12;
    ctx.beginPath();
    ctx.moveTo(previousPointRef.current.x, previousPointRef.current.y);
    ctx.lineTo(smoothX, smoothY);
    ctx.stroke();

    previousPointRef.current = { x: smoothX, y: smoothY };
  };

  const processFrame = async () => {
    const video = videoRef.current;
    const displayCanvas = displayCanvasRef.current;
    const landmarker = handLandmarkerRef.current;

    if (!video || !displayCanvas || !landmarker || !streamRef.current) {
      return;
    }

    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        void processFrame();
      });
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    if (displayCanvas.width !== width || displayCanvas.height !== height) {
      displayCanvas.width = width;
      displayCanvas.height = height;
      const drawingCanvas = ensureDrawingCanvas();
      drawingCanvas.width = width;
      drawingCanvas.height = height;
    }

    const ctx = displayCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.landmarks?.[0] as Landmark[] | undefined;
      const now = performance.now();

      if (landmarks) {
        const gesture = getGesture(landmarks);
        const holdTime = (settingsRef.current?.hold_time_seconds ?? 1.2) * 1000;
        const delayAfterConfirm = 260;

        if (!gestureLockedRef.current && gesture !== "unknown") {
          if (pendingGestureRef.current !== gesture) {
            pendingGestureRef.current = gesture;
            gestureStartTimeRef.current = now;
          } else if (now - gestureStartTimeRef.current >= holdTime) {
            currentModeRef.current = gesture;
            confirmationTimeRef.current = now;
            gestureLockedRef.current = true;
            pendingGestureRef.current = null;
          }
        } else if (gestureLockedRef.current && gesture !== currentModeRef.current && gesture !== "unknown") {
          gestureLockedRef.current = false;
        }

        if (now - confirmationTimeRef.current > delayAfterConfirm) {
          if (currentModeRef.current === "write") {
            drawStroke(landmarks, width, height);
          } else if (currentModeRef.current === "erase") {
            clearLocalCanvas();
          } else if (currentModeRef.current === "pause") {
            previousPointRef.current = null;
          } else if (currentModeRef.current === "predict" && now - lastPredictionTriggerRef.current > 1200) {
            lastPredictionTriggerRef.current = now;
            previousPointRef.current = null;
            currentModeRef.current = "pause";
            gestureLockedRef.current = false;
            await onPredict(exportDrawing());
          }
        }

        onUpdateTrackingStatus({
          camera_active: true,
          hand_detected: true,
          current_mode: currentModeRef.current,
          pending_gesture: pendingGestureRef.current,
          gesture_locked: gestureLockedRef.current,
          frame_updated_at: Date.now(),
        });
      } else {
        previousPointRef.current = null;
        onUpdateTrackingStatus({
          camera_active: true,
          hand_detected: false,
          pending_gesture: null,
          gesture_locked: gestureLockedRef.current,
          frame_updated_at: Date.now(),
        });
      }
    }

    if (drawingCanvasRef.current) {
      ctx.drawImage(drawingCanvasRef.current, 0, 0, width, height);
    }
    annotateFrame(ctx, width, height);

    animationFrameRef.current = window.requestAnimationFrame(() => {
      void processFrame();
    });
  };

  const startCamera = async () => {
    const allowed = window.confirm(
      "This will use your browser camera for live hand tracking. Continue and allow camera access?",
    );

    if (!allowed) {
      return;
    }

    try {
      onSetError(null);

      if (!window.isSecureContext) {
        throw new Error("Camera access requires HTTPS or localhost.");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support webcam access.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (!videoRef.current) {
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      await waitForVideoReady(videoRef.current);

      if (!handLandmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm",
        );
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/hand_landmarker.task",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      onUpdateTrackingStatus({
        camera_active: true,
        hand_detected: false,
        current_mode: "pause",
        pending_gesture: null,
        gesture_locked: false,
        frame_updated_at: Date.now(),
      });

      animationFrameRef.current = window.requestAnimationFrame(() => {
        void processFrame();
      });
    } catch (nextError) {
      console.error("Camera startup failed:", nextError);
      const message = getCameraErrorMessage(nextError);
      onSetError(message);
      stopCamera();
    }
  };

  const handlePredict = async () => {
    await onPredict(exportDrawing());
  };

  const handleClear = async () => {
    clearLocalCanvas();
    await onClearCanvas();
  };

  const cameraActive = Boolean(status?.camera_active);

  return (
    <section id="demo" className="relative py-24 px-4">
      <div className={`${isExpanded ? "max-w-[1800px]" : "max-w-7xl"} mx-auto transition-all duration-300`}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-text">Live System</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            The deployed site now uses your browser camera directly, tracks your hand in-page, draws locally, and sends only the handwritten canvas to the backend for prediction.
          </p>
        </motion.div>

        <div className={`grid gap-6 ${isExpanded ? "xl:grid-cols-[1.7fr_0.55fr]" : "lg:grid-cols-[1.4fr_0.6fr]"}`}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card-glow p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className={cameraActive ? "indicator-green" : "indicator-red"} />
                <div>
                  <div className="text-sm font-semibold text-foreground">Browser Camera Workspace</div>
                  <div className="text-xs text-muted-foreground">
                    {loading ? "Checking backend..." : cameraActive ? "Tracking live in your browser" : "Camera stopped"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => void (cameraActive ? Promise.resolve(stopCamera()) : startCamera())}
                  className={!cameraActive ? "btn-primary-glow px-4 py-2 text-sm" : "btn-outline-glow px-4 py-2 text-sm"}
                >
                  <span className="inline-flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    {cameraActive ? "Camera Running" : "Start Camera"}
                  </span>
                </button>
                <button onClick={() => setIsExpanded((current) => !current)} className="btn-outline-glow px-4 py-2 text-sm">
                  <span className="inline-flex items-center gap-2">
                    {isExpanded ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
                    {isExpanded ? "Normal Size" : "Enlarge Canvas"}
                  </span>
                </button>
                <button
                  onClick={() => stopCamera()}
                  className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!cameraActive}
                >
                  <span className="inline-flex items-center gap-2">
                    <CameraOff className="w-4 h-4" />
                    Switch Off Camera
                  </span>
                </button>
                <button
                  onClick={() => void handlePredict()}
                  className="btn-outline-glow px-4 py-2 text-sm"
                  disabled={activeAction === "predict"}
                >
                  <span className="inline-flex items-center gap-2">
                    <WandSparkles className="w-4 h-4" />
                    Predict Now
                  </span>
                </button>
              </div>
            </div>

            <div
              className={`rounded-3xl border border-glass-border bg-secondary/30 overflow-hidden ${
                isExpanded ? "min-h-[70vh]" : "aspect-video"
              } flex items-center justify-center relative`}
            >
              <video
                ref={videoRef}
                className={`absolute inset-0 h-full w-full object-contain bg-black/40 scale-x-[-1] transition-opacity ${
                  cameraActive ? "opacity-100" : "opacity-0"
                }`}
                playsInline
                muted
                autoPlay
              />
              <canvas
                ref={displayCanvasRef}
                className={`absolute inset-0 h-full w-full object-contain pointer-events-none transition-opacity ${
                  cameraActive ? "opacity-100" : "opacity-0"
                }`}
              />
              {!cameraActive ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <Camera className="w-12 h-12 text-muted-foreground/40" />
                  <div className="mt-4 text-lg font-semibold text-foreground">Camera offline</div>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Start the camera to use your own browser webcam for the live hand-tracking demo.
                  </p>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-glass-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
              The browser now asks for webcam permission directly. Drawing happens locally on this page, and only the drawn image is sent to the backend for AI prediction.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card-glow p-5"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-accent" />
              Gesture Map
            </div>

            <div className="mt-4 space-y-3">
              {gestures.map((gesture) => (
                <div key={gesture.title} className="rounded-2xl border border-glass-border bg-secondary/30 px-4 py-3">
                  <div className="text-sm font-semibold text-foreground">{gesture.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{gesture.detail}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-glass-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                <Hand className="w-3.5 h-3.5 text-accent" />
                Live Mode
              </div>
              <div className="mt-3 text-2xl font-bold capitalize text-foreground">{status?.current_mode ?? "pause"}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {status?.pending_gesture
                  ? `Pending confirmation: ${status.pending_gesture}`
                  : "No gesture waiting for confirmation."}
              </div>
            </div>

            <button
              onClick={() => void handleClear()}
              className="mt-5 w-full btn-outline-glow py-3 text-sm"
              disabled={activeAction === "clear"}
            >
              <span className="inline-flex items-center gap-2">
                <Eraser className="w-4 h-4" />
                Clear Local Canvas
              </span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveSystem;
