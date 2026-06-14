# hand_tracking.py

import cv2
import mediapipe as mp


class HandTracker:
    def __init__(self, max_hands=1, detection_conf=0.7, tracking_conf=0.7):
        self.max_hands = max_hands

        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            max_num_hands=self.max_hands,
            min_detection_confidence=detection_conf,
            min_tracking_confidence=tracking_conf
        )

        self.mp_draw = mp.solutions.drawing_utils

    def process(self, frame):
        """
        Takes BGR frame, returns processed results
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        return results

    def get_landmarks(self, frame, results, draw=True):
        """
        Returns landmarks of first detected hand
        """
        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0]

            if draw:
                self.mp_draw.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS
                )

            return hand_landmarks.landmark

        return None