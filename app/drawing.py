# drawing.py

import cv2
import numpy as np
from utils.constants import INDEX_TIP


class DrawingEngine:
    def __init__(self):
        self.canvas = None
        self.prev_x = None
        self.prev_y = None

        self.color = (255, 255, 255)
        self.thickness = 5

        # 🔥 tuned smoothing
        self.alpha = 0.6

    def initialize_canvas(self, frame):
        if self.canvas is None:
            self.canvas = np.zeros_like(frame)

    def reset_previous(self):
        self.prev_x = None
        self.prev_y = None

    def clear_canvas(self):
        if self.canvas is not None:
            self.canvas[:] = 0

    def draw(self, frame, landmarks):
        h, w, _ = frame.shape

        x = int(landmarks[INDEX_TIP].x * w)
        y = int(landmarks[INDEX_TIP].y * h)

        # First point
        if self.prev_x is None or self.prev_y is None:
            self.prev_x, self.prev_y = x, y
            return

        # 🔥 smoothing (balanced)
        smooth_x = int(self.alpha * self.prev_x + (1 - self.alpha) * x)
        smooth_y = int(self.alpha * self.prev_y + (1 - self.alpha) * y)

        # 🔥 direct line (NO interpolation)
        cv2.line(
            self.canvas,
            (self.prev_x, self.prev_y),
            (smooth_x, smooth_y),
            self.color,
            self.thickness
        )

        self.prev_x, self.prev_y = smooth_x, smooth_y

    def overlay(self, frame):
        return cv2.add(frame, self.canvas)