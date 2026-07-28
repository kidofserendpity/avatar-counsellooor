import { useState } from "react";
import axios from "axios";
import { theme } from "../theme";

function SettingsView({ apiBase, themeMode, onSetThemeMode }) {
  const [reduceMotion, setReduceMotion] = useState(
    typeof document !== "undefined" && document.body.classList.contains("reduce-motion")
  );
  const [clearing, setClearing] = useState(false);
  const [clearedMessage, setClearedMessage] = useState("");

  const toggleReduceMotion = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    document.body.classList.toggle("reduce-motion", next);
  };

  const toggleLightTheme = () => {
    onSetThemeMode(themeMode === "light" ? "dark" : "light");
  };

  const clearMemory = async () => {
    const confirmed = window.confirm(
      "This clears everything Aria remembers about you — facts, mood history, and style. It won't delete journal entries. This can't be undone. Continue?"
    );
    if (!confirmed) return;

    setClearing(true);
    setClearedMessage("");
    try {
      await axios.delete(`${apiBase}/api/memory`);
      setClearedMessage("Memory cleared.");
    } catch (err) {
      console.error("Clear memory failed:", err);
      setClearedMessage("Something went wrong — try again.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.row}>
        <div>
          <div style={styles.rowLabel}>Light theme</div>
          <div style={styles.rowSub}>Switches the whole interface to a light version of the same palette.</div>
        </div>
        <button
          style={{ ...styles.toggle, backgroundColor: themeMode === "light" ? theme.purple : theme.bgElevated }}
          onClick={toggleLightTheme}
        >
          <span style={{ ...styles.toggleDot, transform: themeMode === "light" ? "translateX(18px)" : "translateX(0)" }} />
        </button>
      </div>

      <div style={styles.row}>
        <div>
          <div style={styles.rowLabel}>Reduce motion</div>
          <div style={styles.rowSub}>Turns off the orb's breathing, pulse, and panel animations.</div>
        </div>
        <button
          style={{ ...styles.toggle, backgroundColor: reduceMotion ? theme.purple : theme.bgElevated }}
          onClick={toggleReduceMotion}
        >
          <span style={{ ...styles.toggleDot, transform: reduceMotion ? "translateX(18px)" : "translateX(0)" }} />
        </button>
      </div>

      <div style={styles.row}>
        <div>
          <div style={styles.rowLabel}>Clear memory</div>
          <div style={styles.rowSub}>Removes everything Aria remembers about you. Journal entries are kept.</div>
        </div>
        <button style={styles.dangerButton} onClick={clearMemory} disabled={clearing}>
          {clearing ? "Clearing…" : "Clear"}
        </button>
      </div>
      {clearedMessage && <p style={styles.confirmText}>{clearedMessage}</p>}

      <div style={styles.aboutSection}>
        <div style={styles.aboutAcronym}>A.R.I.A</div>
        <div style={styles.aboutMeaning}>Adaptive Responsive Intelligent Ally</div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "600px" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: "0 0 28px" },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 0", borderBottom: `1px solid ${theme.border}`
  },
  rowLabel: { color: theme.cream, fontSize: "15px", fontWeight: 600 },
  rowSub: { color: theme.mutedDim, fontSize: "12px", marginTop: "4px", maxWidth: "320px" },
  toggle: {
    width: "40px", height: "22px", borderRadius: "999px", border: "none",
    cursor: "pointer", position: "relative", padding: "2px", transition: "background-color 0.2s ease"
  },
  toggleDot: {
    display: "block", width: "18px", height: "18px", borderRadius: "50%",
    backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "transform 0.2s ease"
  },
  dangerButton: {
    padding: "9px 18px", borderRadius: "10px", border: `1px solid rgba(255,77,77,0.4)`,
    backgroundColor: "rgba(255,77,77,0.08)", color: "#ff8080", fontSize: "13px", cursor: "pointer"
  },
  confirmText: { color: theme.muted, fontSize: "13px", marginTop: "14px" },
  aboutSection: { marginTop: "40px", textAlign: "center" },
  aboutAcronym: { fontFamily: theme.serif, fontSize: "18px", color: theme.purpleBright, letterSpacing: "2px" },
  aboutMeaning: { fontSize: "12px", color: theme.mutedDim, marginTop: "4px", letterSpacing: "0.5px" }
};

export default SettingsView;