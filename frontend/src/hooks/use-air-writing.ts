import { useEffect, useMemo, useState } from "react";

export type Prediction = {
  label: string;
  confidence: number;
  timestamp: number;
  top_predictions: Array<{
    label: string;
    confidence: number;
  }>;
};

export type AirWritingStatus = {
  backend_online: boolean;
  camera_active: boolean;
  hand_detected: boolean;
  current_mode: string;
  pending_gesture: string | null;
  gesture_locked: boolean;
  prediction: Prediction | null;
  frame_updated_at: number | null;
  error: string | null;
  settings: {
    smoothing: boolean;
    thickness: number;
    sensitivity: number;
    hold_time_seconds: number;
  };
  model: {
    name: string;
    dataset: string;
    supported_labels: string[];
    letters_available: boolean;
    next_dataset: string;
    model_path: string;
  };
};

type ApiError = {
  detail?: string;
};

type HealthResponse = {
  ok: boolean;
  camera_active: boolean;
  model: AirWritingStatus["model"];
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function buildApiUrl(path: string) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const error = (await response.json()) as ApiError;
      if (error.detail) {
        message = error.detail;
      }
    } catch {
      // Keep fallback.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

const defaultModel: AirWritingStatus["model"] = {
  name: "mnist-cnn",
  dataset: "MNIST",
  supported_labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  letters_available: false,
  next_dataset: "EMNIST Letters",
  model_path: "mnist_cnn.pth",
};

const defaultStatus: AirWritingStatus = {
  backend_online: false,
  camera_active: false,
  hand_detected: false,
  current_mode: "pause",
  pending_gesture: null,
  gesture_locked: false,
  prediction: null,
  frame_updated_at: null,
  error: null,
  settings: {
    smoothing: true,
    thickness: 12,
    sensitivity: 70,
    hold_time_seconds: 1.23,
  },
  model: defaultModel,
};

export function useAirWriting() {
  const [status, setStatus] = useState<AirWritingStatus>(defaultStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const refreshHealth = async () => {
    try {
      const response = await requestJson<HealthResponse>("/api/health");
      setStatus((current) => ({
        ...current,
        backend_online: response.ok,
        model: response.model,
      }));
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Unable to reach backend API.";
      setStatus((current) => ({
        ...current,
        backend_online: false,
      }));
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshHealth();
  }, []);

  const setRuntimeError = (message: string | null) => {
    setError(message);
    setStatus((current) => ({
      ...current,
      error: message,
    }));
  };

  const updateTrackingStatus = (patch: Partial<AirWritingStatus>) => {
    setStatus((current) => ({
      ...current,
      ...patch,
    }));
  };

  const clearCanvas = async () => {
    setStatus((current) => ({
      ...current,
      prediction: null,
      current_mode: "pause",
      pending_gesture: null,
    }));
  };

  const predictNow = async (imageData?: string) => {
    if (!imageData) {
      return { prediction: null };
    }

    setActiveAction("predict");
    setRuntimeError(null);

    try {
      const response = await requestJson<{ prediction: Omit<Prediction, "timestamp"> | null; message: string }>(
        "/api/predict-image",
        {
          method: "POST",
          body: JSON.stringify({ image_data: imageData }),
        },
      );

      const prediction = response.prediction
        ? {
            ...response.prediction,
            timestamp: Date.now(),
          }
        : null;

      setStatus((current) => ({
        ...current,
        prediction,
      }));

      return { prediction };
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Prediction request failed.";
      setRuntimeError(message);
      throw nextError;
    } finally {
      setActiveAction(null);
    }
  };

  const updateSettings = async (payload: Partial<AirWritingStatus["settings"]>) => {
    setActiveAction("settings");
    setStatus((current) => {
      const nextSettings = {
        ...current.settings,
        ...payload,
      };

      const sensitivity = nextSettings.sensitivity;
      const holdTimeSeconds = Number(
        (2.1 - ((sensitivity - 10) / 90) * 1.3).toFixed(2),
      );

      return {
        ...current,
        settings: {
          ...nextSettings,
          hold_time_seconds: holdTimeSeconds,
        },
      };
    });
    setActiveAction(null);
  };

  const apiInfo = useMemo(
    () => ({
      apiBaseUrl,
      predictEndpoint: buildApiUrl("/api/predict-image"),
    }),
    [],
  );

  return {
    status,
    loading,
    error,
    activeAction,
    refreshStatus: refreshHealth,
    clearCanvas,
    predictNow,
    updateSettings,
    updateTrackingStatus,
    setRuntimeError,
    apiInfo,
  };
}
