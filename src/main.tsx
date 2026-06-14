import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ping the backend to wake it up
fetch("https://air-writting-system.onrender.com/api/health").catch(() => {});

createRoot(document.getElementById("root")!).render(<App />);
