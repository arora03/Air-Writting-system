import { create } from "zustand";
import { PredictionResponse } from "./api";

interface AppState {
  // Backend Connection
  isBackendConnected: boolean;
  setBackendConnected: (status: boolean) => void;

  // Hand Tracking Status
  isHandDetected: boolean;
  setHandDetected: (status: boolean) => void;

  // Predictions
  latestPrediction: PredictionResponse | null;
  setLatestPrediction: (pred: PredictionResponse) => void;

  // Settings
  thickness: number;
  setThickness: (val: number) => void;
  smoothing: boolean;
  setSmoothing: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isBackendConnected: false,
  setBackendConnected: (status) => set({ isBackendConnected: status }),

  isHandDetected: false,
  setHandDetected: (status) => set({ isHandDetected: status }),

  latestPrediction: null,
  setLatestPrediction: (pred) => set({ latestPrediction: pred }),

  thickness: 4,
  setThickness: (val) => set({ thickness: val }),
  
  smoothing: true,
  setSmoothing: (val) => set({ smoothing: val }),
}));
