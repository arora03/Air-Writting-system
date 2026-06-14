import { useState } from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

import { useAppStore } from "@/lib/store";

const ControlPanel = () => {
  const smoothing = useAppStore((state) => state.smoothing);
  const setSmoothing = useAppStore((state) => state.setSmoothing);
  const thickness = useAppStore((state) => state.thickness);
  const setThickness = useAppStore((state) => state.setThickness);

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-glow p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Control Panel</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Toggles */}
            <div className="space-y-4">
              <Toggle label="Enable Smoothing" checked={smoothing} onChange={setSmoothing} />
            </div>

            {/* Sliders */}
            <div className="space-y-5">
              <SliderControl label="Stroke Thickness" value={thickness} min={1} max={8} onChange={setThickness} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-foreground">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      aria-label={`Toggle ${label}`}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
        checked ? "bg-primary" : "bg-secondary"
      }`}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-foreground"
        animate={{ left: checked ? "22px" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

const SliderControl = ({ label, value, min, max, onChange, unit }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string }) => {
  const id = label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label htmlFor={id} className="text-sm text-foreground">{label}</label>
        <span className="text-sm text-accent font-medium">{value}{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
};

export default ControlPanel;
