import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, PenTool, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Live Demo", href: "#demo" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-glass-border/50 backdrop-blur-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl border border-glass-border bg-gradient-to-br from-neon-blue/80 to-neon-cyan/80 flex items-center justify-center shadow-[0_0_18px_hsl(var(--neon-cyan)/0.25)]">
              <span className="text-sm font-black tracking-tight text-slate-950">AW</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold gradient-text">AirScript AI</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Computer Vision Lab</span>
            </div>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-secondary/50"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <a href="#demo" className="btn-primary-glow text-sm inline-flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Launch Workspace
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card border-t border-glass-border/50"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a href="#demo" className="block btn-primary-glow text-sm text-center mt-3">
                Launch Workspace
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
