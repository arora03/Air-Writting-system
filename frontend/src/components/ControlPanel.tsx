import { useState } from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

const ControlPanel = () => {
  const [smoothing, setSmoothing] = useState(true);
  const [gesture, setGesture] = useState(false);
  const [thickness, setThickness] = useState(3);
  const [sensitivity, setSensitivity] = useState(70);
  const [mode, setMode] = useState<"letter" | "digit">("letter");

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
              <Toggle label="Gesture Detection" checked={gesture} onChange={setGesture} />
            </div>

            {/* Sliders */}
            <div className="space-y-5">
              <SliderControl label="Stroke Thickness" value={thickness} min={1} max={8} onChange={setThickness} />
              <SliderControl label="Sensitivity" value={sensitivity} min={10} max={100} onChange={setSensitivity} unit="%" />
            </div>
          </div>

          {/* Mode selector */}
          <div className="mt-6 pt-6 border-t border-glass-border">
            <p className="text-sm text-muted-foreground mb-3">Recognition Mode</p>
            <div className="flex gap-2">
              {(["letter", "digit"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    mode === m
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "letter" ? "🔤 Letter Mode" : "🔢 Digit Mode"}
                </button>
              ))}
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

const SliderControl = ({ label, value, min, max, onChange, unit }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string }) => (
  <div>
    <div className="flex justify-between mb-1.5">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-sm text-accent font-medium">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
    />
  </div>
);

export default ControlPanel;
