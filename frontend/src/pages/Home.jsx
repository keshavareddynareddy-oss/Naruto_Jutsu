import { useCallback, useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import CameraFeed from "../components/CameraFeed";
import SealSequence from "../components/SealSequence";
import SealDisplay from "../components/SealDisplay";
import SignGuide from "../components/SignGuide";
import JutsuList from "../components/JutsuList";
import RecentJutsu from "../components/RecentJutsu";
import JutsuEffect from "../components/JutsuEffect";
import ChakraBar from "../components/ChakraBar";
import Academy from "../components/Academy";
import RankPanel from "../components/RankPanel";
import WelcomeModal from "../components/WelcomeModal";
import AppFooter from "../components/AppFooter";
import { JUTSU_CATALOG } from "../data/jutsuData";
import { applyPracticeSeal } from "../utils/jutsuEngine";
import { playJutsuSound, playSealClick } from "../utils/audio";
import { fetchHealth, resetPredictionState } from "../services/api";
import usePersistentState from "../hooks/usePersistentState";

export default function Home() {
  const [sequence, setSequence] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeJutsu, setActiveJutsu] = useState(null);
  const [latestSeal, setLatestSeal] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [progress, setProgress] = useState(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [backendOk, setBackendOk] = useState(null);
  const [selectedJutsu, setSelectedJutsu] = useState(JUTSU_CATALOG[1]);
  const [muted, setMuted] = usePersistentState("hsn-muted", false);
  const [welcomeSeen, setWelcomeSeen] = usePersistentState("hsn-welcome-seen", false);

  const rememberJutsu = useCallback((jutsu) => {
    setActiveJutsu(jutsu);
    if (!muted) playJutsuSound(jutsu.type);
    setHistory((prev) => {
      const next = [jutsu.name, ...prev.filter((name) => name !== jutsu.name)];
      return next.slice(0, 6);
    });
  }, [muted]);

  const handlePrediction = useCallback((data) => {
    if (!data) return;

    setLatestSeal(data.seal || null);
    setConfidence(typeof data.confidence === "number" ? data.confidence : 0);

    if (Array.isArray(data.sequence)) {
      setSequence(data.sequence);
    }

    setProgress(data.progress || null);

    if (data.jutsu?.name) {
      rememberJutsu(data.jutsu);
    }
  }, [rememberJutsu]);

  const handlePracticeSeal = useCallback((seal) => {
    if (isCameraRunning) return;
    if (!muted) playSealClick();
    setLatestSeal(seal);
    setConfidence(1);
    setSequence((current) => {
      const result = applyPracticeSeal(current, seal);
      setProgress(result.progress);
      if (result.jutsu) {
        rememberJutsu(result.jutsu);
      }
      return result.sequence;
    });
  }, [isCameraRunning, muted, rememberJutsu]);

  const handleReset = useCallback(async () => {
    setSequence([]);
    setProgress(null);
    setLatestSeal(null);
    setConfidence(0);
    setActiveJutsu(null);
    try {
      await resetPredictionState();
    } catch {
      // Practice mode still works offline.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((data) => {
        if (!cancelled) setBackendOk(Boolean(data?.ok));
      })
      .catch(() => {
        if (!cancelled) setBackendOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const uniqueCount = useMemo(() => new Set(history).size, [history]);

  const chakraPercent = useMemo(() => {
    if (!progress) {
      return confidence * 45;
    }
    const ratio = progress.total_required > 0 ? progress.matched_count / progress.total_required : 0;
    return Math.max(confidence * 35, ratio * 100);
  }, [progress, confidence]);

  return (
    <div className="app-container">
      <Header
        activeJutsuName={activeJutsu?.name}
        backendOk={backendOk}
        muted={muted}
        onToggleMute={() => setMuted((value) => !value)}
        onShowHelp={() => setWelcomeSeen(false)}
      />

      {backendOk === false && (
        <div className="banner-note" role="status">
          Camera classification is offline. Tap seals in the Hand Sign Guide to train in practice mode.
        </div>
      )}

      <div className="main-layout">
        <div className="left-panel">
          <CameraFeed onPrediction={handlePrediction} onRunningChange={setIsCameraRunning} />

          <div className="panel status-panel">
            <div className="row-between">
              <h3 className="panel-title">Live Detection</h3>
              <span className={`status-pill ${isCameraRunning ? "live" : "idle"}`}>
                {isCameraRunning ? "Tracking" : "Camera Off"}
              </span>
            </div>
            <SealDisplay seal={latestSeal} confidence={confidence} />
            <div className="detect-grid">
              <div className="detect-card">
                <div className="detect-label">Recognized Seal</div>
                <div className={`detect-value ${latestSeal ? "highlight" : ""}`}>
                  {latestSeal || "None"}
                </div>
              </div>
              <div className="detect-card">
                <div className="detect-label">Model Confidence</div>
                <div className="detect-value">{Math.round(confidence * 100)}%</div>
              </div>
            </div>
            <ChakraBar chakra={chakraPercent} />
            <div className="camera-action-row">
              <button className="camera-btn stop" type="button" onClick={handleReset}>
                Clear Sequence
              </button>
            </div>
          </div>

          <SealSequence sequence={sequence} progress={progress} />
        </div>

        <div className="right-panel">
          <RankPanel uniqueCount={uniqueCount} total={JUTSU_CATALOG.length} />
          <Academy selectedJutsu={selectedJutsu} />
          <JutsuList
            jutsus={JUTSU_CATALOG}
            activeJutsuName={activeJutsu?.name}
            progressTarget={progress?.target_jutsu}
            onSelectJutsu={setSelectedJutsu}
          />
          <SignGuide
            highlightedSeal={latestSeal}
            nextSeal={progress?.next_required_seal}
            onSelectSeal={handlePracticeSeal}
            practiceEnabled={!isCameraRunning}
          />
          <RecentJutsu history={history} />
        </div>
      </div>

      <AppFooter />

      <JutsuEffect jutsu={activeJutsu} onDismiss={() => setActiveJutsu(null)} />
      <WelcomeModal open={!welcomeSeen} onClose={() => setWelcomeSeen(true)} />
    </div>
  );
}
