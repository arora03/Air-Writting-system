import { motion } from "framer-motion";

import type { AirWritingStatus } from "@/hooks/use-air-writing";

type SystemOverviewProps = {
  status: AirWritingStatus | null;
  error: string | null;
};

const SystemOverview = ({ status, error }: SystemOverviewProps) => {
  const cards = [
    {
      label: "Backend API",
      value: error ? "Offline" : "Online",
      tone: error ? "indicator-red" : "indicator-green",
    },
    {
      label: "Camera",
      value: status?.camera_active ? "Active" : "Idle",
      tone: status?.camera_active ? "indicator-green" : "indicator-orange",
    },
    {
      label: "Hand Detection",
      value: status?.hand_detected ? "Hand found" : "Searching",
      tone: status?.hand_detected ? "indicator-green" : "indicator-orange",
    },
    {
      label: "Model Scope",
      value: status?.model.letters_available ? "Digits + letters" : "Digits now",
      tone: "indicator-green",
    },
  ];

  return (
    <section className="py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-4 md:grid-cols-4"
        >
          {cards.map((card) => (
            <div key={card.label} className="glass-card p-5">
              <div className="flex items-center gap-3">
                <span className={card.tone} />
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{card.label}</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">{card.value}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SystemOverview;
