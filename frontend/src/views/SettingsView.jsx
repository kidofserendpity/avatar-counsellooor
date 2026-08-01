import { useState } from "react";
import axios from "axios";
import { theme } from "../theme";
import { isLoggedIn, clearAccountId, clearGuestChoice } from "../utils/userId";

function AccountSection() {
  const loggedIn = isLoggedIn();

  const handleAccountAction = () => {
    if (loggedIn) {
      clearAccountId();
    } else {
      clearGuestChoice();
    }
    window.location.reload();
  };

  return (
    <div style={styles.dangerSection}>
      <div style={styles.rowLabel}>Account</div>
      <div style={styles.rowSub}>
        {loggedIn
          ? "You're signed in — your memory and journal are private to this account, on any device."
          : "You're using a guest space tied to this browser. Log in or create an account to reach your space from other devices too."}
      </div>
      <button style={{ ...styles.dangerButton, marginTop: "12px" }} onClick={handleAccountAction}>
        {loggedIn ? "Log out" : "Log in / Sign up"}
      </button>
    </div>
  );
}

function SettingsView({ apiBase, themeMode, onSetThemeMode, ambientBackground, onSetAmbientBackground }) {
  const [reduceMotion, setReduceMotion] = useState(
    typeof document !== "undefined" && document.body.classList.contains("reduce-motion")
  );
  const [busy, setBusy] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const toggleReduceMotion = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    document.body.classList.toggle("reduce-motion", next);
  };

  const toggleLightTheme = () => {
    onSetThemeMode(themeMode === "light" ? "dark" : "light");
  };

  const clearMemoryOnly = async () => {
    const confirmed = window.confirm(
      "This clears everything A.R.I.A remembers about you — facts, mood history, and style. Your journal entries are kept. This can't be undone. Continue?"
    );
    if (!confirmed) return;
    setBusy("memory");
    setStatusMessage("");
    try {
      await axios.delete(`${apiBase}/api/memory`);
      setStatusMessage("A.R.I.A's memory of you has been cleared.");
    } catch (err) {
      console.error("Clear memory failed:", err);
      setStatusMessage("Something went wrong — try again.");
    } finally {
      setBusy(null);
    }
  };

  const clearJournalOnly = async () => {
    const confirmed = window.confirm(
      "This permanently deletes every journal entry you've written. A.R.I.A's memory of you is kept. This can't be undone. Continue?"
    );
    if (!confirmed) return;
    setBusy("journal");
    setStatusMessage("");
    try {
      await axios.delete(`${apiBase}/api/journal`);
      setStatusMessage("Your journal has been cleared.");
    } catch (err) {
      console.error("Clear journal failed:", err);
      setStatusMessage("Something went wrong — try again.");
    } finally {
      setBusy(null);
    }
  };

  const clearEverything = async () => {
    const confirmed = window.confirm(
      "This permanently clears both A.R.I.A's memory of you AND every journal entry. This can't be undone. Continue?"
    );
    if (!confirmed) return;
    setBusy("both");
    setStatusMessage("");
    try {
      await axios.delete(`${apiBase}/api/reset-all`);
      setStatusMessage("Memory and journal have both been cleared.");
    } catch (err) {
      console.error("Reset all failed:", err);
      setStatusMessage("Something went wrong — try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={styles.wrap}>
      <h1 style={{ ...styles.title, ...theme.gradientText }}>Settings</h1>

      <div style={styles.row}>
        <div>
          <div style={styles.rowLabel}>Ambient background</div>
          <div style={styles.rowSub}>A soft, flowing glow behind the interface, in the orb's colors. On by default.</div>
        </div>
        <button
          style={{ ...styles.toggle, backgroundColor: ambientBackground ? theme.purple : theme.bgElevated }}
          onClick={() => onSetAmbientBackground(!ambientBackground)}
        >
          <span style={{ ...styles.toggleDot, transform: ambientBackground ? "translateX(18px)" : "translateX(0)" }} />
        </button>
      </div>

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

      <AccountSection />

      <div style={styles.dangerSection}>
        <div style={styles.rowLabel}>Clear your data</div>
        <div style={styles.rowSub}>Choose exactly what to reset. All three actions are permanent.</div>

        <div style={styles.dangerRow}>
          <div>
            <div style={styles.dangerLabel}>Clear A.R.I.A's memory only</div>
            <div style={styles.rowSub}>Facts, mood history, and style — journal entries are kept.</div>
          </div>
          <button style={styles.dangerButton} onClick={clearMemoryOnly} disabled={busy !== null}>
            {busy === "memory" ? "Clearing…" : "Clear"}
          </button>
        </div>

        <div style={styles.dangerRow}>
          <div>
            <div style={styles.dangerLabel}>Clear journal only</div>
            <div style={styles.rowSub}>Deletes every journal entry — A.R.I.A's memory of you is kept.</div>
          </div>
          <button style={styles.dangerButton} onClick={clearJournalOnly} disabled={busy !== null}>
            {busy === "journal" ? "Clearing…" : "Clear"}
          </button>
        </div>

        <div style={styles.dangerRow}>
          <div>
            <div style={styles.dangerLabel}>Clear both</div>
            <div style={styles.rowSub}>Wipes memory and journal entirely — a completely fresh start.</div>
          </div>
          <button style={styles.dangerButton} onClick={clearEverything} disabled={busy !== null}>
            {busy === "both" ? "Clearing…" : "Clear both"}
          </button>
        </div>

        {statusMessage && <p style={styles.confirmText}>{statusMessage}</p>}
      </div>

      <div style={styles.aboutSection}>
        <div style={{ ...styles.aboutAcronym, ...theme.gradientText }}>A.R.I.A</div>
        <div style={styles.aboutMeaning}>Adaptive Responsive Intelligent Ally</div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "600px" },
  title: { fontFamily: theme.serif, fontWeight: 600, fontSize: "30px", margin: "0 0 28px" },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 0", borderBottom: `1px solid ${theme.border}`
  },
  rowLabel: { color: theme.cream, fontSize: "15px", fontWeight: 600 },
  rowSub: { color: theme.mutedDim, fontSize: "12px", marginTop: "4px", maxWidth: "360px" },
  toggle: {
    width: "40px", height: "22px", borderRadius: "999px", border: "none",
    cursor: "pointer", position: "relative", padding: "2px", transition: "background-color 0.2s ease"
  },
  toggleDot: {
    display: "block", width: "18px", height: "18px", borderRadius: "50%",
    backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "transform 0.2s ease"
  },
  dangerSection: { marginTop: "24px", paddingTop: "8px", borderTop: `1px solid ${theme.border}` },
  dangerRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderBottom: `1px solid ${theme.border}`, gap: "12px"
  },
  dangerLabel: { color: theme.cream, fontSize: "14px", fontWeight: 600 },
  dangerButton: {
    padding: "8px 16px", borderRadius: "10px", border: `1px solid rgba(255,77,77,0.4)`,
    backgroundColor: "rgba(255,77,77,0.08)", color: "#ff8080", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap"
  },
  confirmText: { color: theme.muted, fontSize: "13px", marginTop: "14px" },
  aboutSection: { marginTop: "40px", textAlign: "center" },
  aboutAcronym: { fontFamily: theme.serif, fontWeight: 700, fontSize: "18px", letterSpacing: "2px" },
  aboutMeaning: { fontSize: "12px", color: theme.mutedDim, marginTop: "4px", letterSpacing: "0.5px" }
};

export default SettingsView;