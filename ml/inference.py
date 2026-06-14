from pathlib import Path

import torch
import torch.nn as nn


MODEL_PATH = Path(__file__).resolve().parents[1] / "mnist_cnn.pth"
LABELS = [str(index) for index in range(10)]


class CNN(nn.Module):
    def __init__(self):
        super().__init__()

        self.conv = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )

        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 7 * 7, 128),
            nn.ReLU(),
            nn.Linear(128, len(LABELS)),
        )

    def forward(self, x):
        x = self.conv(x)
        x = self.fc(x)
        return x


device = torch.device("cpu")

model = CNN()
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()


def _prepare_tensor(img):
    return torch.tensor(img, dtype=torch.float32).unsqueeze(0).unsqueeze(0)


def predict(img):
    result = predict_with_scores(img)
    return result["label"]


def predict_with_scores(img, top_k=3):
    tensor = _prepare_tensor(img)

    with torch.no_grad():
        output = model(tensor)
        probabilities = torch.softmax(output, dim=1)[0]
        top_scores, top_indices = torch.topk(probabilities, k=min(top_k, len(LABELS)))

    top_predictions = [
        {
            "label": LABELS[index],
            "confidence": round(float(score) * 100, 2),
        }
        for score, index in zip(top_scores.tolist(), top_indices.tolist())
    ]

    best = top_predictions[0]
    return {
        "label": best["label"],
        "confidence": best["confidence"],
        "top_predictions": top_predictions,
    }
