import { motion } from "framer-motion";

const statuses = [
  { label: "Camera Active", status: "active" as const },
  { label: "Hand Detected", status: "warning" as const },
  { label: "Writing Mode", status: "inactive" as const },
];

const indicatorClass = {
  active: "indicator-green",
  warning: "indicator-orange",
  inactive: "indicator-red",
};

const statusText = {
  active: "ON",
  warning: "Searching...",
  inactive: "OFF",
};

const SystemStatus = () => (
  <section className="py-12 px-4">
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">System Status</h3>
        <div className="grid grid-cols-3 gap-4">
          {statuses.map((s) => (
            <div key={s.label} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-4 py-3">
              <span className={indicatorClass[s.status]} />
              <div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{statusText[s.status]}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default SystemStatus;
