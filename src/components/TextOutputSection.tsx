import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Trash2, Download, Check } from "lucide-react";

const TextOutputSection = () => {
  const [text, setText] = useState("HELLO WORLD");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-glow p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">📝 Recognized Text Output</h3>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full bg-secondary/30 border border-glass-border rounded-xl px-4 py-3 text-foreground text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-secondary hover:bg-secondary/80 text-foreground transition-colors">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={() => setText("")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-secondary hover:bg-secondary/80 text-foreground transition-colors">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-secondary hover:bg-secondary/80 text-foreground transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TextOutputSection;
