import { PenTool } from "lucide-react";

const SiteFooter = () => (
  <footer id="about" className="border-t border-glass-border py-16 px-4">
    <div className="max-w-5xl mx-auto text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl border border-glass-border bg-gradient-to-br from-neon-blue/80 to-neon-cyan/80 flex items-center justify-center">
          <span className="text-sm font-black tracking-tight text-slate-950">AW</span>
        </div>
        <span className="text-base font-bold gradient-text">AirScript AI</span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xl mx-auto">
        The project now runs as a full website backed by the live Python computer-vision pipeline. Digits are powered by the existing MNIST model, and the next milestone is training EMNIST for letter prediction.
      </p>
      <p className="mt-4 text-xs text-muted-foreground/70">
        <span className="inline-flex items-center gap-2">
          <PenTool className="w-3.5 h-3.5" />
          © 2026 AirScript AI. Built with FastAPI, MediaPipe, OpenCV, PyTorch, Vite, and React.
        </span>
      </p>
    </div>
  </footer>
);

export default SiteFooter;
