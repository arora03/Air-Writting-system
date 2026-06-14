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
}

export const useAppStore = create<AppState>((set) => ({
  isBackendConnected: false,
  setBackendConnected: (status) => set({ isBackendConnected: status }),

  isHandDetected: false,
  setHandDetected: (status) => set({ isHandDetected: status }),

  latestPrediction: null,
  setLatestPrediction: (pred) => set({ latestPrediction: pred }),
}));
