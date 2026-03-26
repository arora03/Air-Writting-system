# main.py

import cv2
import time

from app.hand_tracking import HandTracker
from app.gesture import get_finger_states, get_gesture
from app.drawing import DrawingEngine
from utils.constants import *
from utils.preprocess import preprocess_image
from ml.inference import predict


def main():
    cap = cv2.VideoCapture(0)
    cap.set(3, CAMERA_WIDTH)
    cap.set(4, CAMERA_HEIGHT)

    tracker = HandTracker(
        max_hands=MAX_HANDS,
        detection_conf=DETECTION_CONFIDENCE,
        tracking_conf=TRACKING_CONFIDENCE
    )

    drawer = DrawingEngine()

    # 🔥 STATE
    current_mode = GESTURE_PAUSE
    pending_gesture = None
    gesture_start_time = 0
    confirmation_time = 0
    gesture_locked = False

    HOLD_TIME = 1.5
    DELAY_AFTER_CONFIRM = 1.0

    prediction = None  # store last prediction

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        drawer.initialize_canvas(frame)

        results = tracker.process(frame)
        landmarks = tracker.get_landmarks(frame, results)

        current_time = time.time()

        if landmarks:
            fingers = get_finger_states(landmarks)
            gesture = get_gesture(fingers)

            # -------------------------
            # 🔒 GESTURE SYSTEM
            # -------------------------

            if not gesture_locked:

                if gesture != GESTURE_UNKNOWN:

                    if pending_gesture != gesture:
                        pending_gesture = gesture
                        gesture_start_time = current_time

                    else:
                        elapsed = current_time - gesture_start_time

                        if elapsed < HOLD_TIME:
                            cv2.putText(
                                frame,
                                f"Hold {gesture}... {elapsed:.1f}s",
                                (200, 80),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.7,
                                (0, 255, 255),
                                2
                            )

                        elif elapsed >= HOLD_TIME:
                            current_mode = gesture
                            confirmation_time = current_time
                            gesture_locked = True
                            pending_gesture = None

            else:
                if gesture != current_mode and gesture != GESTURE_UNKNOWN:
                    gesture_locked = False

            # -------------------------
            # 🎯 ACTION SYSTEM
            # -------------------------

            if current_time - confirmation_time > DELAY_AFTER_CONFIRM:

                if current_mode == GESTURE_WRITE:
                    drawer.draw(frame, landmarks)

                elif current_mode == GESTURE_ERASE:
                    drawer.clear_canvas()

                elif current_mode == GESTURE_PAUSE:
                    drawer.reset_previous()

                elif current_mode == GESTURE_PREDICT:
                    img = drawer.get_canvas_image()
                    processed = preprocess_image(img)

                    if processed is not None:
                        pred = predict(processed)
                        prediction = pred
                        print("Prediction:", pred)

                    # reset after prediction
                    current_mode = GESTURE_PAUSE
                    drawer.reset_previous()
                    gesture_locked = False

            # -------------------------
            # 🧪 UI
            # -------------------------

            cv2.putText(frame, f"Mode: {current_mode}", (10, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            if prediction is not None:
                cv2.putText(
                    frame,
                    f"Pred: {prediction}",
                    (200, 150),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    2,
                    (0, 255, 0),
                    3
                )

            if current_time - confirmation_time < DELAY_AFTER_CONFIRM:
                cv2.putText(
                    frame,
                    f"{current_mode.upper()} CONFIRMED",
                    (200, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2
                )

        else:
            drawer.reset_previous()

        frame = drawer.overlay(frame)

        cv2.imshow("Air Writing AI", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()