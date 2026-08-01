import { useState } from "react";
import axios from "axios";
import { theme } from "../theme";

const QUESTIONS = [
  {
    prompt: "Night owl or early bird?",
    options: [
      { label: "Night owl", fact: "Considers themselves more of a night owl." },
      { label: "Early bird", fact: "Considers themselves more of an early bird." },
      { label: "Depends on the day", fact: "Says their sleep schedule really depends on the day." }
    ]
  },
  {
    prompt: "When something's stressing you out, you usually...",
    options: [
      { label: "Talk it out", fact: "Tends to talk things out when stressed." },
      { label: "Go quiet", fact: "Tends to go quiet when stressed rather than talk it out." },
      { label: "Distract yourself", fact: "Tends to distract themselves when stressed." },
      { label: "Push through it", fact: "Tends to just push through when stressed rather than pause." }
    ]
  },
  {
    prompt: "Your texting energy is...",
    options: [
      { label: "Long paragraphs", fact: "Texts in long paragraphs, not short messages." },
      { label: "Short and quick", fact: "Texts short and quick, not long paragraphs." },
      { label: "Voice notes over typing", fact: "Prefers voice notes over typing when possible." },
      { label: "Depends who's asking", fact: "Says their texting style depends entirely on who they're talking to." }
    ]
  },
  {
    prompt: "Pick your comfort genre",
    options: [
      { label: "Comedy", fact: "Comedy is their comfort genre." },
      { label: "Horror", fact: "Horror is their comfort genre." },
      { label: "Romance", fact: "Romance is their comfort genre." },
      { label: "True crime", fact: "True crime is their comfort genre." },
      { label: "Sci-fi", fact: "Sci-fi is their comfort genre." }
    ]
  },
  {
    prompt: "Coffee, tea, or neither?",
    options: [
      { label: "Coffee", fact: "Drinks coffee." },
      { label: "Tea", fact: "Drinks tea, not coffee." },
      { label: "Energy drinks", fact: "Runs on energy drinks." },
      { label: "Not really into caffeine", fact: "Isn't really into caffeine." }
    ]
  },
  {
    prompt: "Introvert, extrovert, or a bit of both?",
    options: [
      { label: "Introvert", fact: "Identifies as an introvert." },
      { label: "Extrovert", fact: "Identifies as an extrovert." },
      { label: "A bit of both", fact: "Says they're a mix of introvert and extrovert." }
    ]
  }
];

function GetToKnowYou({ apiBase, onDone }) {
  const [index, setIndex] = useState(0);
  const [collected, setCollected] = useState([]);
  const [animKey, setAnimKey] = useState(0);

  const question = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;

  const finish = (facts) => {
    if (facts.length > 0) {
      axios.post(`${apiBase}/api/onboarding`, { facts }).catch((err) => console.error("Onboarding save failed:", err));
    }
    onDone();
  };

  const advance = (fact) => {
    const updated = fact ? [...collected, fact] : collected;
    setCollected(updated);
    if (isLast) {
      finish(updated);
    } else {
      setIndex((i) => i + 1);
      setAnimKey((k) => k + 1);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.auroraA} />
      <div style={styles.auroraB} />
      <div key={animKey} style={styles.card}>
        <div style={styles.progressRow}>
          {QUESTIONS.map((_, i) => (
            <div key={i} style={{ ...styles.dot, backgroundColor: i <= index ? theme.purple : theme.border }} />
          ))}
        </div>
        <div style={styles.eyebrow}>Quick vibe check</div>
        <div style={styles.prompt}>{question.prompt}</div>
        <div style={styles.options}>
          {question.options.map((opt) => (
            <button key={opt.label} style={styles.optionButton} onClick={() => advance(opt.fact)}>
              {opt.label}
            </button>
          ))}
        </div>
        <button style={styles.skipButton} onClick={() => advance(null)}>Skip this one</button>
      </div>
      <button style={styles.skipAllButton} onClick={() => finish(collected)}>Skip the rest, take me in</button>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, backgroundColor: theme.bg, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "20px", padding: "20px", zIndex: 200, overflow: "hidden"
  },
  auroraA: {
    position: "absolute", top: "-20%", left: "-10%", width: "60vw", height: "60vw", borderRadius: "50%",
    background: `radial-gradient(circle, var(--accent-purple), transparent 70%)`, opacity: 0.24,
    filter: "blur(60px)", animation: "auroraDriftA 22s ease-in-out infinite", pointerEvents: "none"
  },
  auroraB: {
    position: "absolute", bottom: "-20%", right: "-10%", width: "55vw", height: "55vw", borderRadius: "50%",
    background: `radial-gradient(circle, var(--accent-teal), transparent 70%)`, opacity: 0.2,
    filter: "blur(70px)", animation: "auroraDriftB 26s ease-in-out infinite", pointerEvents: "none"
  },
  card: {
    position: "relative", backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    borderRadius: "22px", padding: "32px 28px", maxWidth: "380px", width: "100%",
    textAlign: "center", boxSizing: "border-box", animation: "panelSlideUp 0.3s ease"
  },
  progressRow: { display: "flex", justifyContent: "center", gap: "6px", marginBottom: "18px" },
  dot: { width: "6px", height: "6px", borderRadius: "50%", transition: "background-color 0.2s ease" },
  eyebrow: { color: theme.mutedDim, fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" },
  prompt: { fontFamily: theme.serif, fontSize: "20px", color: theme.cream, marginBottom: "22px", lineHeight: 1.4 },
  options: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" },
  optionButton: {
    padding: "11px 16px", borderRadius: "12px", border: `1px solid ${theme.border}`,
    backgroundColor: theme.panel, color: theme.cream, fontSize: "14px", cursor: "pointer", textAlign: "left"
  },
  skipButton: { background: "transparent", border: "none", color: theme.mutedDim, fontSize: "12px", cursor: "pointer" },
  skipAllButton: { background: "transparent", border: "none", color: theme.mutedDim, fontSize: "12px", cursor: "pointer", position: "relative" }
};

export default GetToKnowYou;