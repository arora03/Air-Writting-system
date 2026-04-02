import { motion } from "framer-motion";
import { Camera, Database, Zap } from "lucide-react";

import type { AirWritingStatus } from "@/hooks/use-air-writing";

type HeroSectionProps = {
  status: AirWritingStatus | null;
  loading: boolean;
};

const HeroSection = ({ status, loading }: HeroSectionProps) => {
  const prediction = status?.prediction?.label ?? "0";
  const confidence = status?.prediction?.confidence ?? 0;
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-glass-border bg-secondary/50 text-xs text-muted-foreground mb-8">
            <span className="indicator-green" />
            MediaPipe + PyTorch website integration
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
        >
          Write in Air.{" "}
          <span className="gradient-text text-glow">Watch the website understand.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Track your finger movements through a webcam and let our AI predict handwritten characters in real-time — no stylus, no touchscreen, just air.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#demo" className="btn-primary-glow flex items-center gap-2 text-base">
            <Zap className="w-4 h-4" />
            Start Live Demo
          </a>
          <button className="btn-outline-glow flex items-center gap-2 text-base">
            <Play className="w-4 h-4" />
            Watch Demo
          </button>
        </motion.div>

        {/* Floating illustration hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 flex justify-center"
        >
          <div className="glass-card-glow p-6 rounded-2xl max-w-md w-full">
            <div className="flex items-center gap-3 mb-3">
              <span className="indicator-green" />
              <span className="text-xs text-muted-foreground">Live Preview</span>
            </div>
            <div className="h-32 rounded-xl bg-secondary/30 border border-glass-border flex items-center justify-center overflow-hidden relative">
              <motion.span
                className="text-6xl font-bold gradient-text"
                animate={{ scale: [0.9, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                A
              </motion.span>
              <div className="absolute bottom-2 right-3 text-xs text-accent font-semibold">94% confidence</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
