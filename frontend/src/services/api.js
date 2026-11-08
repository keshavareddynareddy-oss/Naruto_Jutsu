import axios from "axios";

const SESSION_KEY = "hidden-seal-session";

function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  timeout: 8000,
});

API.interceptors.request.use((config) => {
  config.headers["X-Session-Id"] = getSessionId();
  return config;
});

export const resetPredictionState = async () => {
  await API.post("/reset");
};

export const fetchHealth = async () => {
  const response = await API.get("/health");
  return response.data;
};

export default API;
