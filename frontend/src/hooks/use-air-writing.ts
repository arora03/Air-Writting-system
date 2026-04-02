import { useEffect, useState } from "react";

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
      // Keep the generic fallback when the response body is empty.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function useAirWriting() {
  const [status, setStatus] = useState<AirWritingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [streamVersion, setStreamVersion] = useState(0);

  useEffect(() => {
    if (!status?.camera_active) {
      return;
    }

    const stopCameraOnUnload = () => {
      fetch(buildApiUrl("/api/control/stop"), {
        method: "POST",
        keepalive: true,
      }).catch(() => {
        // The backend also has an inactivity timeout as a fallback.
      });
    };

    window.addEventListener("pagehide", stopCameraOnUnload);
    window.addEventListener("beforeunload", stopCameraOnUnload);

    return () => {
      window.removeEventListener("pagehide", stopCameraOnUnload);
      window.removeEventListener("beforeunload", stopCameraOnUnload);
      stopCameraOnUnload();
    };
  }, [status?.camera_active]);

  const refreshStatus = async () => {
    try {
      const nextStatus = await requestJson<AirWritingStatus>("/api/status");
      setStatus(nextStatus);
      setError(nextStatus.error);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Unable to reach backend API.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();

    const intervalId = window.setInterval(() => {
      void refreshStatus();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const runAction = async <T,>(
    label: string,
    action: () => Promise<T>,
    options?: { refreshAfter?: boolean },
  ) => {
    setActiveAction(label);
    setError(null);

    try {
      const result = await action();
      if (options?.refreshAfter) {
        await refreshStatus();
      }
      return result;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Request failed.";
      setError(message);
      throw nextError;
    } finally {
      setActiveAction(null);
    }
  };

  const applyStatus = (nextStatus: AirWritingStatus) => {
    setStatus(nextStatus);
    setError(nextStatus.error);
    setLoading(false);
  };

  const startCamera = async () => {
    const nextStatus = await runAction("start", () =>
      requestJson<AirWritingStatus>("/api/control/start", { method: "POST" }),
    );
    applyStatus(nextStatus);
    setStreamVersion((current) => current + 1);
  };

  const stopCamera = async () => {
    const nextStatus = await runAction("stop", () =>
      requestJson<AirWritingStatus>("/api/control/stop", { method: "POST" }),
    );
    applyStatus(nextStatus);
    setStreamVersion((current) => current + 1);
  };

  const clearCanvas = async () => {
    const nextStatus = await runAction("clear", () =>
      requestJson<AirWritingStatus>("/api/control/clear", { method: "POST" }),
    );
    applyStatus(nextStatus);
  };

  const predictNow = async () => {
    return runAction(
      "predict",
      () =>
        requestJson<{ prediction: Prediction | null; status: AirWritingStatus }>("/api/control/predict", {
          method: "POST",
        }),
      { refreshAfter: true },
    );
  };

  const updateSettings = async (payload: Partial<AirWritingStatus["settings"]>) => {
    const nextStatus = await runAction("settings", () =>
      requestJson<AirWritingStatus>("/api/settings", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    applyStatus(nextStatus);
  };

  return {
    status,
    loading,
    error,
    activeAction,
    streamUrl: buildApiUrl(`/api/stream?stream=${streamVersion}`),
    refreshStatus,
    startCamera,
    stopCamera,
    clearCanvas,
    predictNow,
    updateSettings,
  };
}
