# preprocess.py

import cv2


def preprocess_image(img):
    # 1. Find drawing region
    coords = cv2.findNonZero(img)
    if coords is None:
        return None

    x, y, w, h = cv2.boundingRect(coords)

    cropped = img[y:y+h, x:x+w]

    # 2. Resize directly
    resized = cv2.resize(cropped, (28, 28), interpolation=cv2.INTER_AREA)

    # 3. Normalize
    resized = resized / 255.0

    return resized