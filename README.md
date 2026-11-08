# Hidden Seal Nexus

A Naruto-inspired web app that recognizes hand seals through your camera and lets users weave them into elemental jutsu.

A Naruto-themed jutsu trainer. Hold the twelve zodiac hand seals in front of your camera (or tap them in practice mode) to weave sequences and release elemental jutsu.

## What it does

- Tracks one hand with MediaPipe and classifies seals with a trained model
- Commits a seal only after a stable hold, then matches known jutsu patterns
- Shows shinobi rank, chakra progress, a sign guide, jutsu scrolls, and an activation burst
- Practice mode works without a camera: tap seals in the Hand Sign Guide

## Local development

You need two terminals.

**Backend**

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

The API listens on `http://127.0.0.1:8000` (`/api/health`, `/api/predict`, `/docs`).

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend.

## Production / Docker

The Docker image builds the React app and serves it from FastAPI on a single port.

```bash
docker compose up --build
```

Then open `http://localhost:8000`.

On Render, Railway, or Fly, deploy from this Dockerfile. The container uses `PORT` when the host provides it. `render.yaml` is included for Render.

Production health check: `GET /api/health` should return `"ok": true` once the landmarker and classifier files are present.

## Training (optional)

Hand-sign images live under `backend/dataset`. Retrain with:

```bash
cd backend
python train_model.py
```

Trained files are written to `backend/models/`. Keep `scikit-learn==1.7.2` in sync with the pickled model.

## Tips

- Hold each seal still until it appears in **Seal Sequence**
- Shadow Clone is the shortest combo: Ox → Hare → Monkey
- If the camera is running, practice taps are paused so live tracking owns the sequence
