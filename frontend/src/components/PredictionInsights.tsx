import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit } from "lucide-react";

import type { Prediction } from "@/hooks/use-air-writing";

type PredictionInsightsProps = {
  prediction: Prediction | null;
  onAppendPrediction: () => void;
};

const PredictionInsights = ({ prediction, onAppendPrediction }: PredictionInsightsProps) => (
  <section className="py-20 px-4">
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card-glow p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BrainCircuit className="w-4 h-4 text-accent" />
              Prediction Panel
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              The current backend model is trained on MNIST, so this panel shows real digit predictions. Letters will appear here once we train the EMNIST model.
            </p>
          </div>
          <button
            onClick={onAppendPrediction}
            disabled={!prediction}
            className="btn-outline-glow px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-2">
              Add To Output
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[0.8fr_1.2fr] items-center">
          <div className="rounded-3xl border border-glass-border bg-secondary/30 p-6 text-center">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Best Match</div>
            <div className="mt-4 text-7xl font-black gradient-text">{prediction?.label ?? "-"}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Confidence{" "}
              <span className="text-accent font-semibold">
                {prediction ? `${prediction.confidence.toFixed(1)}%` : "Not available"}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(prediction?.top_predictions ?? []).map((candidate, index) => (
              <div key={`${candidate.label}-${index}`} className="glass-card p-5 text-center">
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Rank {index + 1}
                </div>
                <div className="mt-3 text-4xl font-bold text-foreground">{candidate.label}</div>
                <div className="mt-2 text-sm text-accent">{candidate.confidence.toFixed(1)}%</div>
              </div>
            ))}
            {!prediction ? (
              <div className="sm:col-span-3 rounded-2xl border border-dashed border-glass-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                Trigger a prediction from the live system to populate this panel.
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default PredictionInsights;
