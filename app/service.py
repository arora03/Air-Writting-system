import threading
import time

import cv2

from app.drawing import DrawingEngine
from app.gesture import get_finger_states, get_gesture
from app.hand_tracking import HandTracker
from ml.inference import LABELS, MODEL_PATH, predict_with_scores
from utils.constants import *
from utils.preprocess import preprocess_image


class AirWritingService:
    def __init__(self):
        self._lock = threading.RLock()
        self._thread = None
        self._capture = None
        self._tracker = HandTracker(
            max_hands=MAX_HANDS,
            detection_conf=DETECTION_CONFIDENCE,
            tracking_conf=TRACKING_CONFIDENCE,
        )
        self._latest_frame = None
        self._running = False

        self._drawer = DrawingEngine()
        self._prediction = None
        self._error = None
        self._frame_updated_at = None
        self._hand_detected = False

        self._current_mode = GESTURE_PAUSE
        self._pending_gesture = None
        self._gesture_start_time = 0.0
        self._confirmation_time = 0.0
        self._gesture_locked = False

        self._delay_after_confirm = 1.0
        self._smoothing_enabled = True
        self._sensitivity = 70
        self._jpeg_quality = 55
        self._stream_interval = 1 / 16
        self._processing_interval = 1 / 20
        self._idle_timeout_seconds = 5
        self._last_client_ping = 0.0
        self._set_hold_time(self._sensitivity)

    def start(self):
        with self._lock:
            if self._running:
                return self.get_status()

            self._error = None
            self._latest_frame = None
            self._prediction = None
            self._hand_detected = False
            self._current_mode = GESTURE_PAUSE
            self._pending_gesture = None
            self._gesture_start_time = 0.0
            self._confirmation_time = 0.0
            self._gesture_locked = False
            self._last_client_ping = time.time()
            thickness = self._drawer.thickness
            self._drawer = DrawingEngine()
            self._drawer.alpha = 0.6 if self._smoothing_enabled else 0.0
            self._drawer.thickness = max(1, min(int(thickness), 18))

            capture = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            capture.set(3, CAMERA_WIDTH)
            capture.set(4, CAMERA_HEIGHT)
            capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            capture.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))

            if not capture.isOpened():
                capture.release()
                self._error = "Unable to access webcam. Check whether another app is using it."
                raise RuntimeError(self._error)

            self._capture = capture
            self._running = True
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()

        return self.get_status()

    def stop(self):
        thread = None
        with self._lock:
            self._running = False
            thread = self._thread

        if thread is not None:
            thread.join(timeout=2)

        with self._lock:
            if self._capture is not None:
                self._capture.release()
                self._capture = None
            self._tracker = None
            self._thread = None
            self._latest_frame = None
            self._hand_detected = False
            self._current_mode = GESTURE_PAUSE

        return self.get_status()

    def clear_canvas(self):
        with self._lock:
            self._drawer.clear_canvas()
            self._drawer.reset_previous()
            self._prediction = None
        return self.get_status()

    def predict_now(self):
        with self._lock:
            self._predict_current_canvas_locked()
            return self._prediction

    def update_settings(self, *, smoothing=None, thickness=None, sensitivity=None):
        with self._lock:
            if smoothing is not None:
                self._smoothing_enabled = bool(smoothing)
                self._drawer.alpha = 0.6 if self._smoothing_enabled else 0.0

            if thickness is not None:
                self._drawer.thickness = max(1, min(int(thickness), 18))

            if sensitivity is not None:
                self._sensitivity = max(10, min(int(sensitivity), 100))
                self._set_hold_time(self._sensitivity)

        return self.get_status()

    def get_status(self):
        with self._lock:
            if self._running:
                self._last_client_ping = time.time()
            return {
                "camera_active": self._running,
                "hand_detected": self._hand_detected,
                "current_mode": self._current_mode,
                "pending_gesture": self._pending_gesture,
                "gesture_locked": self._gesture_locked,
                "prediction": self._prediction,
                "frame_updated_at": self._frame_updated_at,
                "error": self._error,
                "settings": {
                    "smoothing": self._smoothing_enabled,
                    "thickness": self._drawer.thickness,
                    "sensitivity": self._sensitivity,
                    "hold_time_seconds": round(self._hold_time, 2),
                },
                "model": {
                    "name": "mnist-cnn",
                    "dataset": "MNIST",
                    "supported_labels": LABELS,
                    "letters_available": False,
                    "next_dataset": "EMNIST Letters",
                    "model_path": str(MODEL_PATH.name),
                },
            }

    def mark_client_active(self):
        with self._lock:
            self._last_client_ping = time.time()

    def frame_generator(self):
        while True:
            with self._lock:
                running = self._running
                frame = self._latest_frame
                if running:
                    self._last_client_ping = time.time()

            if not running:
                break

            if frame is None:
                time.sleep(0.05)
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            )
            time.sleep(self._stream_interval)

    def _run_loop(self):
        while True:
            frame_start = time.time()
            with self._lock:
                if not self._running or self._capture is None or self._tracker is None:
                    break

                if self._last_client_ping and frame_start - self._last_client_ping > self._idle_timeout_seconds:
                    self._running = False
                    self._error = "Camera stopped because the page disconnected."
                    break

                capture = self._capture
                tracker = self._tracker
                drawer = self._drawer
                current_mode = self._current_mode
                pending_gesture = self._pending_gesture
                gesture_start_time = self._gesture_start_time
                confirmation_time = self._confirmation_time
                gesture_locked = self._gesture_locked

            ok, frame = capture.read()
            if not ok:
                with self._lock:
                    self._error = "Video capture stopped unexpectedly."
                    self._running = False
                break

            frame = cv2.flip(frame, 1)
            drawer.initialize_canvas(frame)

            results = tracker.process(frame)
            landmarks = tracker.get_landmarks(frame, results)
            current_time = time.time()

            hand_detected = landmarks is not None

            if landmarks:
                fingers = get_finger_states(landmarks)
                gesture = get_gesture(fingers)

                if not gesture_locked and gesture != GESTURE_UNKNOWN:
                    if pending_gesture != gesture:
                        pending_gesture = gesture
                        gesture_start_time = current_time
                    else:
                        elapsed = current_time - gesture_start_time
                        if elapsed < self._hold_time:
                            cv2.putText(
                                frame,
                                f"Hold {gesture}... {elapsed:.1f}s",
                                (200, 80),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.7,
                                (0, 255, 255),
                                2,
                            )
                        else:
                            current_mode = gesture
                            confirmation_time = current_time
                            gesture_locked = True
                            pending_gesture = None
                elif gesture_locked and gesture != current_mode and gesture != GESTURE_UNKNOWN:
                    gesture_locked = False

                if current_time - confirmation_time > self._delay_after_confirm:
                    if current_mode == GESTURE_WRITE:
                        drawer.draw(frame, landmarks)
                    elif current_mode == GESTURE_ERASE:
                        drawer.clear_canvas()
                    elif current_mode == GESTURE_PAUSE:
                        drawer.reset_previous()
                    elif current_mode == GESTURE_PREDICT:
                        with self._lock:
                            self._predict_current_canvas_locked()
                        current_mode = GESTURE_PAUSE
                        drawer.reset_previous()
                        gesture_locked = False
            else:
                drawer.reset_previous()

            frame = drawer.overlay(frame)
            self._annotate_frame(
                frame,
                current_mode=current_mode,
                confirmation_time=confirmation_time,
                current_time=current_time,
            )

            ok, encoded = cv2.imencode(
                ".jpg",
                frame,
                [cv2.IMWRITE_JPEG_QUALITY, self._jpeg_quality],
            )
            if ok:
                with self._lock:
                    self._latest_frame = encoded.tobytes()
                    self._frame_updated_at = time.time()
                    self._hand_detected = hand_detected
                    self._current_mode = current_mode
                    self._pending_gesture = pending_gesture
                    self._gesture_start_time = gesture_start_time
                    self._confirmation_time = confirmation_time
                    self._gesture_locked = gesture_locked

            elapsed = time.time() - frame_start
            if elapsed < self._processing_interval:
                time.sleep(self._processing_interval - elapsed)

        with self._lock:
            if self._capture is not None:
                self._capture.release()
                self._capture = None
            self._thread = None
            self._running = False

    def _annotate_frame(self, frame, *, current_mode, confirmation_time, current_time):
        cv2.putText(
            frame,
            f"Mode: {current_mode}",
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )

        prediction = self._prediction
        if prediction is not None:
            cv2.putText(
                frame,
                f"Pred: {prediction['label']} ({prediction['confidence']:.1f}%)",
                (180, 145),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 255, 0),
                2,
            )

        if current_time - confirmation_time < self._delay_after_confirm:
            cv2.putText(
                frame,
                f"{current_mode.upper()} CONFIRMED",
                (180, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
            )

    def _predict_current_canvas_locked(self):
        processed = preprocess_image(self._drawer.get_canvas_image())
        if processed is None:
            self._prediction = None
            return None

        result = predict_with_scores(processed)
        self._prediction = {
            **result,
            "timestamp": time.time(),
        }
        return self._prediction

    def _set_hold_time(self, sensitivity):
        self._hold_time = round(2.1 - ((sensitivity - 10) / 90) * 1.3, 2)


service = AirWritingService()
