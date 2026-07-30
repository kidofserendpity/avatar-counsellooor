import { useState } from "react";
import { theme } from "../theme";

function LiveSessionPrompt({ onChoose }) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.title}>Want to talk live?</div>
        <p style={styles.body}>
          You can have a full spoken back-and-forth with A.R.I.A — she listens, replies, and you just keep talking, no typing needed. Or start with text instead, your call.
        </p>
        <div style={styles.buttonRow}>
          <button style={styles.secondaryButton} onClick={() => onChoose(false, dontAskAgain)}>Type instead</button>
          <button style={styles.primaryButton} onClick={() => onChoose(true, dontAskAgain)}>Start live session</button>
        </div>
        <label style={styles.checkboxRow}>
          <input type="checkbox" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} />
          Don't ask me this again
        </label>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(11,10,16,0.75)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px"
  },
  card: {
    backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: "20px",
    padding: "28px", maxWidth: "380px", width: "100%", textAlign: "center", boxSizing: "border-box"
  },
  title: { fontFamily: theme.serif, fontSize: "22px", color: theme.cream, marginBottom: "10px" },
  body: { color: theme.muted, fontSize: "14px", lineHeight: 1.6, marginBottom: "22px" },
  buttonRow: { display: "flex", gap: "10px", marginBottom: "16px" },
  secondaryButton: {
    flex: 1, padding: "11px", borderRadius: "12px", border: `1px solid ${theme.border}`,
    backgroundColor: "transparent", color: theme.muted, cursor: "pointer", fontSize: "14px"
  },
  primaryButton: {
    flex: 1, padding: "11px", borderRadius: "12px", border: "none",
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`,
    color: "#120e1c", fontWeight: 600, cursor: "pointer", fontSize: "14px"
  },
  checkboxRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: theme.mutedDim, fontSize: "12px", cursor: "pointer" }
};

export default LiveSessionPrompt;