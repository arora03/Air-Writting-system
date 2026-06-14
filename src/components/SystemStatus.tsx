import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";
import { api } from "@/lib/api";

const SystemStatus = () => {
  const isBackendConnected = useAppStore((state) => state.isBackendConnected);
  const setBackendConnected = useAppStore((state) => state.setBackendConnected);
  const isHandDetected = useAppStore((state) => state.isHandDetected);

  useEffect(() => {
    // Poll the backend health every 5 seconds
    const checkHealth = async () => {
      try {
        const res = await api.pingHealth();
        setBackendConnected(res.ok);
      } catch (err) {
        setBackendConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [setBackendConnected]);

  const statuses = [
    { 
      label: "Backend Connection", 
      status: isBackendConnected ? "active" : "warning",
      text: isBackendConnected ? "Connected" : "Connecting..."
    },
    { 
      label: "Hand Tracking", 
      status: isHandDetected ? "active" : "inactive",
      text: isHandDetected ? "Detected" : "Searching"
    },
    { 
      label: "System Mode", 
      status: "active",
      text: "Air Canvas AI"
    },
  ];

  const indicatorClass = {
    active: "indicator-green",
    warning: "indicator-orange",
    inactive: "indicator-red",
  };

  return (
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
                <span className={indicatorClass[s.status as keyof typeof indicatorClass]} />
                <div>
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SystemStatus;
