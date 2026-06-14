import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

const PredictionPanel = () => {
  const latestPrediction = useAppStore((state) => state.latestPrediction);
  const isBackendConnected = useAppStore((state) => state.isBackendConnected);

  // Fallback data if no prediction yet
  const data = latestPrediction || {
    prediction: "?",
    confidence: 0,
    top3: [],
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="gradient-text">Prediction Panel</span>
          </h2>
          <p className="text-muted-foreground">Real-time AI character prediction with live confidence scores.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-glow p-6"
        >
          {!isBackendConnected && (
            <div className="text-center p-4 mb-4 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">
              <p className="text-sm">Backend is currently offline or warming up. Predictions may not work.</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={data.prediction}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              {/* Main prediction */}
              <div className="mb-6">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  className="inline-flex items-center justify-center w-28 h-28 rounded-2xl glow-border bg-secondary/30"
                >
                  <span className="text-6xl font-extrabold gradient-text">{data.prediction}</span>
                </motion.div>
                <div className="mt-3">
                  <span className="text-sm text-muted-foreground">Confidence: </span>
                  <span className="text-accent font-bold text-lg">
                    {data.confidence ? `${(data.confidence * 100).toFixed(1)}%` : "0%"}
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="w-48 h-1.5 mx-auto mt-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.confidence ? data.confidence * 100 : 0}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Top 3 (if provided by backend) */}
              {data.top3 && data.top3.length > 0 && (
                <div className="flex justify-center gap-3 mt-8 pt-6 border-t border-glass-border">
                  {data.top3.map((pred, i) => (
                    <div
                      key={pred.char + i}
                      className={`glass-card px-5 py-3 text-center ${i === 0 ? "glow-border" : ""}`}
                    >
                      <div className="text-2xl font-bold text-foreground">{pred.char}</div>
                      <div className="text-xs text-muted-foreground mt-1">{(pred.score * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default PredictionPanel;
