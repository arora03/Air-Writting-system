import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = ["Alphabets", "Digits"] as const;

const mockPredictions = {
  Alphabets: { main: "A", confidence: 94, top3: [{ char: "A", score: 94 }, { char: "H", score: 4 }, { char: "R", score: 2 }] },
  Digits: { main: "7", confidence: 89, top3: [{ char: "7", score: 89 }, { char: "1", score: 7 }, { char: "2", score: 4 }] },
};

const PredictionPanel = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Alphabets");
  const data = mockPredictions[activeTab];

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
          <p className="text-muted-foreground">Real-time AI character prediction with confidence scores.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-glow p-6"
        >
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-6 w-fit mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "Alphabets" ? "🔤 Alphabets (A–Z)" : "🔢 Digits (0–9)"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
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
                  <span className="text-6xl font-extrabold gradient-text">{data.main}</span>
                </motion.div>
                <div className="mt-3">
                  <span className="text-sm text-muted-foreground">Confidence: </span>
                  <span className="text-accent font-bold text-lg">{data.confidence}%</span>
                </div>
                {/* Confidence bar */}
                <div className="w-48 h-1.5 mx-auto mt-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.confidence}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Top 3 */}
              <div className="flex justify-center gap-3">
                {data.top3.map((pred, i) => (
                  <div
                    key={pred.char}
                    className={`glass-card px-5 py-3 text-center ${i === 0 ? "glow-border" : ""}`}
                  >
                    <div className="text-2xl font-bold text-foreground">{pred.char}</div>
                    <div className="text-xs text-muted-foreground mt-1">{pred.score}%</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default PredictionPanel;
