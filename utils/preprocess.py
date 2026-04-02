import cv2
import numpy as np


def preprocess_image(img):
    coords = cv2.findNonZero(img)
    if coords is None:
        return None

    x, y, w, h = cv2.boundingRect(coords)
    pad = 12

    x0 = max(x - pad, 0)
    y0 = max(y - pad, 0)
    x1 = min(x + w + pad, img.shape[1])
    y1 = min(y + h + pad, img.shape[0])

    cropped = img[y0:y1, x0:x1]
    side = max(cropped.shape[:2])

    square = np.zeros((side, side), dtype=cropped.dtype)
    y_offset = (side - cropped.shape[0]) // 2
    x_offset = (side - cropped.shape[1]) // 2
    square[
        y_offset:y_offset + cropped.shape[0],
        x_offset:x_offset + cropped.shape[1],
    ] = cropped

    inner_size = 20
    resized = cv2.resize(square, (inner_size, inner_size), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((28, 28), dtype=np.float32)
    canvas[4:24, 4:24] = resized
    canvas /= 255.0

    return canvas
