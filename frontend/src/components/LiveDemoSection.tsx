import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, Eraser, Save } from "lucide-react";

const LiveDemoSection = () => {
  const [cameraOn, setCameraOn] = useState(false);

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
            Start your camera and begin writing in the air. Your finger movements are tracked and rendered in real-time.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Camera Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card-glow p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={cameraOn ? "indicator-green" : "indicator-red"} />
                <span className="text-sm font-medium text-foreground">Live Camera Feed</span>
              </div>
              <button
                onClick={() => setCameraOn(!cameraOn)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  cameraOn
                    ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                    : "btn-primary-glow"
                }`}
              >
                {cameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {cameraOn ? "Stop" : "Start"}
              </button>
            </div>
            <div className="aspect-video rounded-xl bg-secondary/30 border border-glass-border flex items-center justify-center overflow-hidden">
              {cameraOn ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5" />
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-accent/50 flex items-center justify-center"
                    >
                      <div className="w-3 h-3 rounded-full bg-accent animate-pulse-glow" />
                    </motion.div>
                    <p className="text-xs text-muted-foreground">Tracking active — move your finger</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground/60">Camera is off</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Drawing Canvas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card-glow p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground">Air Writing Canvas</span>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-secondary hover:bg-secondary/80 text-foreground transition-colors">
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-secondary hover:bg-secondary/80 text-foreground transition-colors">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
            <div className="aspect-video rounded-xl bg-secondary/20 border border-glass-border glow-border-cyan flex items-center justify-center relative overflow-hidden">
              {/* Simulated stroke */}
              <svg viewBox="0 0 400 225" className="w-full h-full absolute inset-0" preserveAspectRatio="xMidYMid meet">
                {cameraOn && (
                  <motion.path
                    d="M120,180 Q140,40 200,60 Q260,80 240,140 Q220,200 280,180"
                    stroke="hsl(187, 72%, 54%)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                )}
              </svg>
              {!cameraOn && (
                <p className="text-xs text-muted-foreground/40">Start camera to begin writing</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveDemoSection;
