import { motion } from "framer-motion";
import { Camera, Database, ScanSearch, Sparkles, type LucideIcon } from "lucide-react";

import type { AirWritingStatus } from "@/hooks/use-air-writing";

type IntegratedHeroProps = {
  status: AirWritingStatus | null;
  loading: boolean;
};

const IntegratedHero = ({ status, loading }: IntegratedHeroProps) => {
  const prediction = status?.prediction?.label ?? "0";
  const confidence = status?.prediction?.confidence ?? 0;

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--neon-purple)/0.18),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(var(--neon-cyan)/0.18),transparent_35%)]" />
      <div className="relative z-10 max-w-6xl mx-auto grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-secondary/50 px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Website integrated with the live Python stack
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
          >
            Air writing is now a{" "}
            <span className="gradient-text text-glow">working website</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground"
          >
            The site now controls the real webcam-based tracking pipeline in this repo, streams the processed frames, and shows live MNIST digit predictions. EMNIST letters are the next training milestone.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <a href="#demo" className="btn-primary-glow text-center">
              Open Live Demo
            </a>
            <a href="#controls" className="btn-outline-glow text-center">
              Tune Runtime Settings
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card-glow p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              icon={Camera}
              label="Camera"
              value={loading ? "Checking..." : status?.camera_active ? "Running" : "Ready"}
            />
            <MetricCard
              icon={ScanSearch}
              label="Mode"
              value={status?.current_mode ?? "pause"}
              capitalize
            />
            <MetricCard
              icon={Database}
              label="Dataset"
              value={status?.model.dataset ?? "MNIST"}
            />
          </div>

          <div className="mt-5 rounded-3xl border border-glass-border bg-secondary/30 p-6 text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Latest Prediction</div>
            <div className="mt-4 text-7xl font-black gradient-text">{prediction}</div>
            <div className="mt-3 text-sm text-muted-foreground">
              Confidence <span className="text-accent font-semibold">{confidence.toFixed(1)}%</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan"
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  capitalize?: boolean;
};

const MetricCard = ({ icon: Icon, label, value, capitalize = false }: MetricCardProps) => (
  <div className="rounded-2xl border border-glass-border bg-secondary/40 p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5 text-accent" />
      {label}
    </div>
    <div className={`mt-2 text-lg font-semibold text-foreground ${capitalize ? "capitalize" : ""}`}>{value}</div>
  </div>
);

export default IntegratedHero;
