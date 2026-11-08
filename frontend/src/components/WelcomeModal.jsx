import { useEffect, useMemo, useState } from "react";

const INTRO_LINES = [
  {
    japanese: "ここは、忍の術を目覚めさせる場所。",
    english: "Welcome, shinobi. This is where your jutsu awakens.",
  },
  {
    japanese: "カメラの前で印を結び、チャクラの流れを示せ。",
    english: "Perform hand signs before the camera and reveal your chakra flow.",
  },
  {
    japanese: "AIが印を読み取り、正しい結印を見極める。",
    english: "The AI reads each sign and validates your sequence.",
  },
  {
    japanese: "さあ、最初の術を放て！",
    english: "Now, release your first jutsu!",
  },
];

export default function WelcomeModal({ open, onClose }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [narrating, setNarrating] = useState(false);
  const line = useMemo(() => INTRO_LINES[lineIndex], [lineIndex]);

  useEffect(() => {
    if (!open || !narrating) return undefined;
    const timer = window.setInterval(() => {
      setLineIndex((index) => (index + 1) % INTRO_LINES.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [open, narrating]);

  useEffect(() => {
    if (!open || !narrating || !("speechSynthesis" in window)) return undefined;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(line.japanese);
    utterance.lang = "ja-JP";
    utterance.rate = 0.88;
    utterance.pitch = 0.8;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [line, open, narrating]);

  if (!open) return null;

  const toggleNarration = () => {
    if (!("speechSynthesis" in window)) return;
    setNarrating((value) => !value);
  };
  if (!open) return null;

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <p className="welcome-kicker">Konohagakure · Ninja Academy</p>
        <h2 id="welcome-title">Weave the twelve seals. Release jutsu.</h2>
        <p className="welcome-copy">
          Hidden Seal Nexus reads one hand in your camera, commits a seal only after a
          stable hold, then matches the sequence against the village scrolls.
        </p>
        <div className="intro-narration" aria-live="polite">
          <p className="intro-japanese">{line.japanese}</p>
          <p className="intro-subtitle">{line.english}</p>
          <div className="intro-controls">
            <span>{lineIndex + 1}/{INTRO_LINES.length}</span>
            <button type="button" className="ghost-btn" onClick={toggleNarration}>
              {narrating ? "Stop narration" : "Japanese narration"}
            </button>
          </div>
        </div>
        <ol className="welcome-steps">
          <li>Allow the camera, or stay in practice mode and tap the Hand Sign Guide.</li>
          <li>Hold each zodiac seal still until it appears in Seal Sequence.</li>
          <li>Try Shadow Clone first — Ox → Hare → Monkey — then work up to Fireball.</li>
        </ol>
        <button className="camera-btn" type="button" onClick={onClose}>
          Enter the Nexus
        </button>
      </div>
    </div>
  );
}
