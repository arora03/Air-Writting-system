import { useState } from "react";
import { Check, Copy, Download, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

type RecognitionOutputProps = {
  text: string;
  setText: (value: string) => void;
  onAppendPrediction: () => void;
  canAppendPrediction: boolean;
};

const RecognitionOutput = ({
  text,
  setText,
  onAppendPrediction,
  canAppendPrediction,
}: RecognitionOutputProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const exportText = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "airscript-output.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-glow p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Recognized Output</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Build up a string from accepted predictions now, then swap this same workflow to letters once the EMNIST model is trained.
              </p>
            </div>
            <button
              onClick={onAppendPrediction}
              disabled={!canAppendPrediction}
              className="btn-outline-glow px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Append Latest Prediction
              </span>
            </button>
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-glass-border bg-secondary/30 px-4 py-4 text-lg tracking-[0.25em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            placeholder="Predicted characters will collect here..."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => void handleCopy()} className="btn-outline-glow px-4 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
            <button onClick={() => setText("")} className="btn-outline-glow px-4 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear Output
              </span>
            </button>
            <button onClick={exportText} className="btn-outline-glow px-4 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Text
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RecognitionOutput;
