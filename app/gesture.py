# gesture.py

from utils.constants import *


def get_finger_states(landmarks):
    fingers = {}

    # Fingers (vertical detection)
    fingers["index"] = landmarks[INDEX_TIP].y < landmarks[INDEX_PIP].y
    fingers["middle"] = landmarks[MIDDLE_TIP].y < landmarks[MIDDLE_PIP].y
    fingers["ring"] = landmarks[RING_TIP].y < landmarks[RING_PIP].y
    fingers["pinky"] = landmarks[PINKY_TIP].y < landmarks[PINKY_PIP].y

    # Thumb (horizontal detection - better for 👍)
    fingers["thumb"] = landmarks[THUMB_TIP].x < landmarks[THUMB_IP].x

    return fingers


def get_gesture(fingers):
    index = fingers["index"]
    middle = fingers["middle"]
    ring = fingers["ring"]
    pinky = fingers["pinky"]
    thumb = fingers["thumb"]

    total = sum([index, middle, ring, pinky])

    # ✅ PAUSE → no fingers
    if total == 0 and not thumb:
        return GESTURE_PAUSE

    # ✅ WRITE → 1 finger
    elif total == 1 and index:
        return GESTURE_WRITE

    # ✅ ERASE → 2 fingers
    elif total == 2 and index and middle:
        return GESTURE_ERASE

    # ✅ PREDICT → thumb only
    elif thumb and total == 0:
        return GESTURE_PREDICT

    else:
        return GESTURE_UNKNOWN