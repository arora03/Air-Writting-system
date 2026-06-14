export interface HealthResponse {
  ok: boolean;
  camera_active: boolean;
  model: {
    name: string;
    dataset: string;
    supported_labels: string[];
    letters_available: boolean;
    next_dataset: string;
    model_path: string;
  };
}

export interface PredictionResponse {
  // According to standard ML APIs, this would return the prediction and confidence
  prediction: string;
  confidence: number;
  // Let's assume there's a top3 or similar as mocked, but we will make them optional
  top3?: Array<{ char: string; score: number }>;
}

const BASE_URL = "https://air-writting-system.onrender.com";

export const api = {
  async pingHealth(): Promise<HealthResponse> {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with status: ${res.status}`);
    }
    return res.json();
  },

  async predictImage(base64Image: string): Promise<PredictionResponse> {
    const res = await fetch(`${BASE_URL}/api/predict-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_data: base64Image }),
    });

    if (!res.ok) {
      throw new Error(`Prediction failed with status: ${res.status}`);
    }
    return res.json();
  },
};
