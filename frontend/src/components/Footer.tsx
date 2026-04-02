import { Sparkles } from "lucide-react";

const Footer = () => (
  <footer id="about" className="py-16 px-4 border-t border-glass-border">
    <div className="max-w-5xl mx-auto text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="text-base font-bold gradient-text">AirScript AI</span>
      </div>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        An AI-powered air writing recognition system that transforms finger movements into text using computer vision and deep learning.
      </p>
      <p className="text-xs text-muted-foreground/60">
        © 2026 AirScript AI. Built with MediaPipe, TensorFlow &amp; React.
      </p>
    </div>
  </footer>
);

export default Footer;
