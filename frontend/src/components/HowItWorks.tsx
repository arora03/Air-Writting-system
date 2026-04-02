import { motion } from "framer-motion";
import { Video, Hand, Fingerprint, PenTool, Brain } from "lucide-react";

const steps = [
  { icon: Video, title: "Capture Video", desc: "Stream webcam input" },
  { icon: Hand, title: "Detect Hand", desc: "MediaPipe landmark detection" },
  { icon: Fingerprint, title: "Track Finger", desc: "Follow index fingertip" },
  { icon: PenTool, title: "Generate Stroke", desc: "Render air writing path" },
  { icon: Brain, title: "Predict with AI", desc: "CNN character recognition" },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 px-4">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="gradient-text">How It Works</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">Five steps from finger motion to recognized character.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card-glow p-5 text-center group hover:scale-105 transition-transform duration-300"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center group-hover:from-neon-purple/30 group-hover:to-neon-cyan/30 transition-colors">
              <step.icon className="w-5 h-5 text-accent" />
            </div>
            <div className="text-xs text-accent font-semibold mb-1">Step {i + 1}</div>
            <h4 className="text-sm font-semibold text-foreground mb-1">{step.title}</h4>
            <p className="text-xs text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
