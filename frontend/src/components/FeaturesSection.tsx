import { motion } from "framer-motion";
import { Zap, Hand, Brain, Waves, MonitorSmartphone } from "lucide-react";

const features = [
  { icon: Zap, title: "Real-time Recognition", desc: "Instant character prediction as you write in air with zero perceptible delay." },
  { icon: Hand, title: "Gesture Control", desc: "Use hand gestures to clear canvas, switch modes, and control the interface." },
  { icon: Brain, title: "ML-Powered Prediction", desc: "Deep learning CNN model trained on extensive handwriting datasets." },
  { icon: Waves, title: "Smooth Tracking", desc: "Advanced smoothing algorithms for clean, noise-free stroke rendering." },
  { icon: MonitorSmartphone, title: "No Hardware Required", desc: "Works with any standard webcam — no special sensors or stylus needed." },
];

const FeaturesSection = () => (
  <section id="features" className="py-24 px-4">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="gradient-text">Features</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Everything you need for seamless air writing recognition.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-glow p-6 group hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center mb-4 group-hover:from-neon-purple/30 group-hover:to-neon-cyan/30 transition-colors">
              <f.icon className="w-5 h-5 text-accent" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-2">{f.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
