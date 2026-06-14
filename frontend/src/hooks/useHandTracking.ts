import { useEffect, useRef, useState, useCallback } from "react";
import type { Hands, Results } from "@mediapipe/hands";
import type { Camera } from "@mediapipe/camera_utils";

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export const useHandTracking = (
  videoRef: React.RefObject<HTMLVideoElement>,
  onResults: (results: Results) => void
) => {
  const [isActive, setIsActive] = useState(false);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  // Use useCallback to keep the reference stable
  const handleResults = useCallback((results: Results) => {
    onResults(results);
  }, [onResults]);

  useEffect(() => {
    if (!window.Hands) {
      console.error("MediaPipe Hands not loaded from CDN.");
      return;
    }

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(handleResults);
    handsRef.current = hands;

    return () => {
      hands.close();
    };
  }, [handleResults]);

  const start = useCallback(() => {
    if (videoRef.current && handsRef.current && window.Camera) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      
      camera.start().then(() => setIsActive(true)).catch(console.error);
      cameraRef.current = camera;
    }
  }, [videoRef]);

  const stop = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      setIsActive(false);
      
      // Clear the video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [videoRef]);

  return { start, stop, isActive };
};
