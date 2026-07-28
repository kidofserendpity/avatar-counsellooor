import { useEffect, useState } from "react";
import { theme } from "../theme";

const PHASES = [
  { label: "Breathe in", duration: 4000 },
  { label: "Hold", duration: 4000 },
  { label: "Breathe out", duration: 4000 },
  { label: "Hold", duration: 4000 }
];

function BreatheView() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      setPhaseIndex((i) => (i + 1) % PHASES.length);
    }, PHASES[phaseIndex].duration);
    return () => clearTimeout(timer);
  }, [running, phaseIndex]);

  const scale = phaseIndex === 0 || phaseIndex === 1 ? 1.3 : 1;

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Breathe</h1>
      <p style={styles.sub}>A slow box-breathing pattern — four seconds in, hold, four out, hold.</p>

      <div style={styles.stage}>
        <div style={{ ...styles.circle, transform: `scale(${scale})`, transition: "transform 4s ease-in-out" }} />
      </div>

      <p style={styles.phaseLabel}>{running ? PHASES[phaseIndex].label : "Ready when you are"}</p>

      <button style={styles.startButton} onClick={() => setRunning((r) => !r)}>
        {running ? "Stop" : "Start"}
      </button>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "600px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0, alignSelf: "flex-start" },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "40px", alignSelf: "flex-start" },
  stage: { width: "220px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" },
  circle: {
    width: "140px", height: "140px", borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, ${theme.teal}, ${theme.purple} 70%)`,
    boxShadow: "0 0 60px 20px rgba(94,234,212,0.25)"
  },
  phaseLabel: { color: theme.cream, fontSize: "16px", marginBottom: "24px", letterSpacing: "0.5px" },
  startButton: {
    padding: "12px 32px", borderRadius: "999px", border: "none",
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`,
    color: "#120e1c", fontWeight: 600, fontSize: "15px", cursor: "pointer"
  }
};

export default BreatheView;