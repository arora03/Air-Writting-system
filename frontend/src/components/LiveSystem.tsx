import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, Eraser, Expand, Hand, Minimize, Sparkles, WandSparkles } from "lucide-react";

import type { AirWritingStatus } from "@/hooks/use-air-writing";

type LiveSystemProps = {
  status: AirWritingStatus | null;
  loading: boolean;
  error: string | null;
  activeAction: string | null;
  streamUrl: string;
  onStartCamera: () => Promise<void>;
  onStopCamera: () => Promise<void>;
  onClearCanvas: () => Promise<void>;
  onPredict: () => Promise<unknown>;
};

const gestures = [
  { title: "Write", detail: "Raise your index finger" },
  { title: "Erase", detail: "Raise index + middle fingers" },
  { title: "Pause", detail: "Close your hand to stop drawing" },
  { title: "Predict", detail: "Show a thumbs-up to classify" },
];

const LiveSystem = ({
  status,
  loading,
  error,
  activeAction,
  streamUrl,
  onStartCamera,
  onStopCamera,
  onClearCanvas,
  onPredict,
}: LiveSystemProps) => {
  const cameraActive = Boolean(status?.camera_active);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCameraToggle = async () => {
    if (cameraActive) {
      await onStopCamera();
      return;
    }

    const allowed = window.confirm(
      "This will start the project camera stream. Continue and allow camera use for this session?",
    );

    if (!allowed) {
      return;
    }

    await onStartCamera();
  };

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
            The video panel below is streamed from the Python backend, with hand landmarks, drawing strokes, gesture confirmation, and prediction overlay generated server-side.
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
                  <div className="text-sm font-semibold text-foreground">Backend Camera Stream</div>
                  <div className="text-xs text-muted-foreground">
                    {loading ? "Checking backend..." : cameraActive ? "Tracking live" : "Camera stopped"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleCameraToggle()}
                  className={!cameraActive ? "btn-primary-glow px-4 py-2 text-sm" : "btn-outline-glow px-4 py-2 text-sm"}
                  disabled={activeAction === "start" || activeAction === "stop"}
                >
                  <span className="inline-flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    {cameraActive ? "Camera Running" : "Start Camera"}
                  </span>
                </button>
                <button
                  onClick={() => setIsExpanded((current) => !current)}
                  className="btn-outline-glow px-4 py-2 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    {isExpanded ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
                    {isExpanded ? "Normal Size" : "Enlarge Canvas"}
                  </span>
                </button>
                <button
                  onClick={() => void onStopCamera()}
                  className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!cameraActive || activeAction === "stop"}
                >
                  <span className="inline-flex items-center gap-2">
                    <CameraOff className="w-4 h-4" />
                    Switch Off Camera
                  </span>
                </button>
                <button
                  onClick={() => void onPredict()}
                  className="btn-outline-glow px-4 py-2 text-sm"
                  disabled={!cameraActive || activeAction === "predict"}
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
              }`}
            >
              {cameraActive ? (
                <img src={streamUrl} alt="Live air-writing stream" className="w-full h-full object-contain bg-black/40" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <Camera className="w-12 h-12 text-muted-foreground/40" />
                  <div className="mt-4 text-lg font-semibold text-foreground">Camera offline</div>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Start the camera to let the backend open your webcam and stream the annotated air-writing feed into the website.
                  </p>
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-glass-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
              Every camera start now asks for confirmation in the UI, and the backend will switch the stream off automatically if the page disconnects.
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
              onClick={() => void onClearCanvas()}
              className="mt-5 w-full btn-outline-glow py-3 text-sm"
              disabled={!cameraActive || activeAction === "clear"}
            >
              <span className="inline-flex items-center gap-2">
                <Eraser className="w-4 h-4" />
                Clear Backend Canvas
              </span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveSystem;
