import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Settings } from "lucide-react";

import type { AirWritingStatus } from "@/hooks/use-air-writing";

type RuntimeSettingsProps = {
  status: AirWritingStatus | null;
  activeAction: string | null;
  onUpdateSettings: (payload: Partial<AirWritingStatus["settings"]>) => Promise<void>;
};

const RuntimeSettings = ({ status, activeAction, onUpdateSettings }: RuntimeSettingsProps) => {
  const [thickness, setThickness] = useState(12);
  const [sensitivity, setSensitivity] = useState(70);
  const [smoothing, setSmoothing] = useState(true);

  useEffect(() => {
    if (!status) {
      return;
    }

    setThickness(status.settings.thickness);
    setSensitivity(status.settings.sensitivity);
    setSmoothing(status.settings.smoothing);
  }, [status]);

  return (
    <section id="controls" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-glow p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Runtime Controls</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <ToggleRow
                label="Stroke smoothing"
                description="Switch between stabilized stroke rendering and raw fingertip movement."
                checked={smoothing}
                onChange={(nextValue) => {
                  setSmoothing(nextValue);
                  void onUpdateSettings({ smoothing: nextValue });
                }}
              />

              <SliderRow
                label="Stroke thickness"
                value={thickness}
                min={4}
                max={18}
                suffix="px"
                onChange={(nextValue) => {
                  setThickness(nextValue);
                  void onUpdateSettings({ thickness: nextValue });
                }}
              />

              <SliderRow
                label="Gesture sensitivity"
                value={sensitivity}
                min={10}
                max={100}
                suffix="%"
                onChange={(nextValue) => {
                  setSensitivity(nextValue);
                  void onUpdateSettings({ sensitivity: nextValue });
                }}
              />
            </div>

            <div className="rounded-3xl border border-glass-border bg-secondary/30 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Database className="w-4 h-4 text-accent" />
                Recognition Roadmap
              </div>
              <div className="mt-4 space-y-3">
                <RoadmapCard title="Digits" description="Live now through the trained MNIST CNN." active />
                <RoadmapCard title="Letters" description="Next step: train an EMNIST-based classifier and expose it through the same API." />
              </div>
              <div className="mt-5 text-sm text-muted-foreground">
                Current hold-to-confirm time:{" "}
                <span className="text-accent font-semibold">
                  {status?.settings.hold_time_seconds?.toFixed(2) ?? "1.50"}s
                </span>
              </div>
              {activeAction === "settings" ? (
                <div className="mt-2 text-xs text-muted-foreground">Saving runtime settings...</div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

const ToggleRow = ({ label, description, checked, onChange }: ToggleRowProps) => (
  <div className="rounded-2xl border border-glass-border bg-secondary/20 p-4">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-primary" : "bg-secondary"}`}
      >
        <motion.span
          className="absolute top-1 h-5 w-5 rounded-full bg-foreground"
          animate={{ left: checked ? 26 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  </div>
);

type SliderRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
};

const SliderRow = ({ label, value, min, max, suffix, onChange }: SliderRowProps) => (
  <div className="rounded-2xl border border-glass-border bg-secondary/20 p-4">
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="text-sm font-semibold text-accent">
        {value}
        {suffix}
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="mt-4 w-full accent-primary"
    />
  </div>
);

type RoadmapCardProps = {
  title: string;
  description: string;
  active?: boolean;
};

const RoadmapCard = ({ title, description, active = false }: RoadmapCardProps) => (
  <div className={`rounded-2xl border p-4 ${active ? "border-accent/50 bg-accent/10" : "border-glass-border bg-secondary/20"}`}>
    <div className="text-sm font-semibold text-foreground">{title}</div>
    <div className="mt-1 text-xs text-muted-foreground">{description}</div>
  </div>
);

export default RuntimeSettings;
