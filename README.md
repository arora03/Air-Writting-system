<div align="center">
  <img src="./frontend/public/favicon.ico" width="80" alt="AirScript AI Logo" />
  <h1>AirScript AI: Real-Time Air Writing Recognition</h1>
  <p><strong>A full-stack computer vision application that translates mid-air finger gestures into digitized text using a custom Convolutional Neural Network.</strong></p>

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
  [![MediaPipe](https://img.shields.io/badge/MediaPipe-00A67E?style=for-the-badge&logo=google&logoColor=white)](https://google.github.io/mediapipe/)
</div>

---

## 🚀 Project Overview

AirScript AI bridges the gap between physical motion and digital input. By utilizing advanced hand-landmark tracking (MediaPipe) on the frontend, users can write characters in the air using only their webcam—no stylus or touchscreen required. The drawn trajectories are translated into a normalized image canvas and sent to a FastAPI backend, where a custom-trained Convolutional Neural Network (CNN) classifies the handwritten character in real-time.

## ✨ Key Features
- **Real-Time Hand Tracking:** Client-side 21-point 3D hand skeleton tracking using Google MediaPipe.
- **Gesture Control System:**
  - ✍️ **Write:** Extended Index Finger (2s confirmation delay).
  - 🗑️ **Erase:** Open Palm (Clears canvas).
  - 🔍 **Predict:** Thumbs Up (Dispatches drawing to backend).
- **Sub-50ms Inference:** Highly optimized FastAPI backend utilizing a lightweight PyTorch CNN for near-instant prediction feedback.
- **Dynamic Pre-processing:** Canvas strokes are auto-cropped, centered, and scaled to MNIST standards before inference, making the system highly robust to off-center human air-writing.
- **Premium UI/UX:** Built with React, TailwindCSS, and Framer Motion for a sleek, glassmorphic, and dynamic user experience.

---

## 🧠 Machine Learning Architecture

The character classification engine is powered by a custom Convolutional Neural Network built from scratch in PyTorch, trained on the **MNIST** dataset.

### CNN Topology
- **Input Shape**: `1x28x28` (Grayscale)
- **Layer 1**: `Conv2D (32 filters, 3x3)` → `ReLU` → `MaxPool2D (2x2)`
- **Layer 2**: `Conv2D (64 filters, 3x3)` → `ReLU` → `MaxPool2D (2x2)`
- **Classification Head**: `Flatten` → `Dense (128 units)` → `ReLU` → `Dense (10 units)`
- **Total Parameters**: ~410,000

---

## 📊 Evaluation Metrics

Tested against the standard `10,000` unseen MNIST Test Split. The model achieves production-grade accuracy while remaining incredibly lightweight for CPU deployment.

| Metric | Score | Description |
| :--- | :--- | :--- |
| **Accuracy** | `98.94%` | Overall percentage of correctly classified digits. |
| **Precision** | `98.95%` | The ratio of true positive predictions to total positive predictions. |
| **Recall** | `98.93%` | The ratio of true positive predictions to all actual positives. |
| **F1-Score** | `98.94%` | The harmonic mean of precision and recall. |
| **Inference Time**| `< 15ms` | Time taken for a single forward pass on standard hardware. |

**Confusion Matrix Highlights:**
- **4 vs 9:** ~0.3% confusion rate. Occurs when the top loop of the '9' is not fully closed.
- **3 vs 5:** ~0.2% confusion rate. Occurs if the top horizontal line of the '5' is drawn too curved.

---

## 💻 Technology Stack

### Frontend (Client)
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + custom glassmorphic aesthetics
- **Animations:** Framer Motion
- **Computer Vision:** `@mediapipe/hands` (Loaded via CDN for Vite optimization)
- **State Management:** Zustand (Global store for cross-component gesture state)

### Backend (Server & ML)
- **API Framework:** FastAPI + Uvicorn
- **Machine Learning:** PyTorch
- **Image Processing:** OpenCV (`cv2`) + NumPy + Pillow (PIL)
- **CORS:** Configured for cross-origin frontend-backend communication

---

## ⚙️ System Workflow (How it Works)

1. **Capture:** The browser requests webcam access. The video feed is mirrored horizontally for intuitive user interaction.
2. **Track:** MediaPipe analyzes the video frames at 30+ FPS, calculating 21 3D coordinates for the hand joints.
3. **Logic:** The frontend evaluates finger angles (e.g., if `indexTip.y < indexMcp.y`, the index is extended). If the `Write` gesture is held for 2 seconds, drawing mode initiates.
4. **Draw:** The index fingertip's `(x, y)` trajectory is drawn onto an invisible HTML5 `<canvas>`.
5. **Transform:** Upon the `Predict` gesture, the canvas is flipped (to undo the camera mirror) and converted to a `base64` PNG.
6. **Pre-process (Backend):** FastAPI receives the image. OpenCV converts it to grayscale, finds the bounding box of the ink, crops out the empty space, and pads it to perfectly fit a `28x28` tensor—matching the MNIST format.
7. **Inference:** PyTorch runs a forward pass. Softmax is applied to extract confidence scores.
8. **Response:** The digit and confidence score are returned to the React frontend and displayed via a Framer Motion animation.

---

## 🚀 Local Installation & Setup

If you want to run this project locally, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/arora03/Air-Writting-system.git
cd Air-Writting-system
```

### 2. Start the FastAPI Backend
```bash
# We recommend using a virtual environment
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Start the server (runs on http://localhost:8000)
uvicorn api.main:app --reload
```

### 3. Start the React Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (runs on http://localhost:5173)
npm run dev
```

---
*Designed and built by Arora.*
