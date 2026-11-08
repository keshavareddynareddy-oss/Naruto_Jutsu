import React, { useRef, useEffect, useState, useCallback } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";
import API, { resetPredictionState } from "../services/api";

// FIX: Increased from 320 ms → 200 ms so the backend receives more frames
// per second, giving the stability counter more data points to work with.
// The backend already gates on STABLE_FRAME_REQUIREMENT so sending more
// frames doesn't cause over-triggering — it actually helps the smoother.
const PREDICTION_INTERVAL_MS = 200;

// FIX: Minimum number of landmarks MediaPipe must detect before we bother
// sending the frame.  Avoids wasting a round-trip on a frame where the hand
// is only partially in view.
const MIN_LANDMARK_VISIBILITY = 0.6;

export default function CameraFeed({ onPrediction, onRunningChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const lastPredictAtRef = useRef(0);
  const retryAfterRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  const [running, setRunning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const onPredictionRef = useRef(onPrediction);

  useEffect(() => {
    onPredictionRef.current = onPrediction;
  }, [onPrediction]);

  const stopCamera = useCallback(async () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }

    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    setRunning(false);
    setServiceError("");

    try {
      await resetPredictionState();
    } catch {
      // Ignore reset errors when backend is unavailable.
    }
  }, []);

  // FIX: Filter out landmarks with low visibility before computing the crop
  // region.  Previously a single occluded fingertip at visibility=0.01 could
  // push the bounding box far outside the actual hand, producing a huge crop
  // with mostly background and degrading landmark quality.
  const getPredictionImage = useCallback((landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    if (!landmarks || landmarks.length === 0) {
      return canvas.toDataURL("image/jpeg", 0.85);
    }

    // FIX: Only use landmarks with sufficient visibility for crop calculation.
    const visible = landmarks.filter(
      (lm) => lm.visibility === undefined || lm.visibility >= MIN_LANDMARK_VISIBILITY
    );
    const pts = visible.length > 0 ? visible : landmarks;

    const xs = pts.map((lm) => lm.x);
    const ys = pts.map((lm) => lm.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // FIX: Reduced padding from 25 % → 20 % — keeps more hand, less background.
    const padX = (maxX - minX) * 0.20;
    const padY = (maxY - minY) * 0.20;

    const sx = Math.max(0, Math.floor((minX - padX) * canvas.width));
    const sy = Math.max(0, Math.floor((minY - padY) * canvas.height));
    const ex = Math.min(canvas.width, Math.ceil((maxX + padX) * canvas.width));
    const ey = Math.min(canvas.height, Math.ceil((maxY + padY) * canvas.height));

    const sw = ex - sx;
    const sh = ey - sy;

    if (sw <= 0 || sh <= 0) {
      return canvas.toDataURL("image/jpeg", 0.85);
    }

    const cropCanvas = document.createElement("canvas");
    // FIX: Standardise crop output to 224×224 — consistent with the resolution
    // MediaPipe was trained on, avoiding landmark drift from varying input sizes.
    cropCanvas.width = 224;
    cropCanvas.height = 224;

    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return canvas.toDataURL("image/jpeg", 0.85);

    cropCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, 224, 224);
    return cropCanvas.toDataURL("image/jpeg", 0.88);
  }, []);

  const sendFrameForPrediction = useCallback(async (landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const now = Date.now();
    if (
      requestInFlightRef.current ||
      now < retryAfterRef.current ||
      now - lastPredictAtRef.current < PREDICTION_INTERVAL_MS
    ) {
      return;
    }

    requestInFlightRef.current = true;
    lastPredictAtRef.current = now;

    try {
      const image = getPredictionImage(landmarks);
      if (!image) return;

      const response = await API.post("/predict", { image });
      if (mountedRef.current) setServiceError("");
      if (mountedRef.current && typeof onPredictionRef.current === "function") {
        onPredictionRef.current(response.data);
      }
    } catch (error) {
      if (mountedRef.current) {
        setServiceError(error.userMessage || "Prediction service unavailable.");
      }
      retryAfterRef.current = Date.now() + 1500;
    } finally {
      requestInFlightRef.current = false;
    }
  }, [getPredictionImage]);

  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: "#7df9ff",
          lineWidth: 4,
        });
        drawLandmarks(ctx, landmarks, {
          color: "#ffb347",
          lineWidth: 1,
          radius: 3,
        });
      }
    }

    ctx.restore();

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      sendFrameForPrediction(results.multiHandLandmarks[0]);
    }
  }, [sendFrameForPrediction]);

  const startCamera = async () => {
    if (cameraRef.current) return;
    setCameraError("");

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setCameraError("Camera access requires HTTPS or localhost.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera access.");
      return;
    }

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      // FIX: Matched to backend MediaPipe thresholds (0.72) so both sides
      // agree on what constitutes a valid detection.
      minDetectionConfidence: 0.72,
      minTrackingConfidence: 0.72,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    try {
      await cameraRef.current.start();
      setRunning(true);
    } catch (error) {
      await stopCamera();
      const name = error?.name;
      const message =
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow access and retry."
          : name === "NotFoundError"
            ? "No camera was found on this device."
            : "Camera access failed. Check your browser permissions and retry.";
      setCameraError(message);
      setRunning(false);
    }
  };

  useEffect(() => {
    if (typeof onRunningChange === "function") {
      onRunningChange(running);
    }
  }, [running, onRunningChange]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="panel camera-panel">
      <div className="camera-panel-head">
        <h3 className="panel-title">Live Hand Sign Capture</h3>
        <div className={`status-pill ${running ? "live" : "idle"}`}>
          {running ? "LIVE" : "OFFLINE"}
        </div>
      </div>

      <div className="camera-action-row">
        {!running && (
          <button className="camera-btn" onClick={startCamera}>
            Start Camera
          </button>
        )}
        {running && (
          <button className="camera-btn stop" onClick={stopCamera}>
            Stop + Reset
          </button>
        )}
      </div>

      {cameraError && <p className="inline-error">{cameraError}</p>}
      {serviceError && running && <p className="inline-error">{serviceError}</p>}

      <div className="camera-stage">
        {!running && (
          <div className="camera-placeholder">
            <span className="camera-placeholder-mark">忍</span>
            <p>Camera idle. Start capture to track seals, or tap the guide to practice.</p>
          </div>
        )}
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          className="camera-canvas"
          style={{ display: running ? "block" : "none" }}
        />
      </div>
    </div>
  );
}