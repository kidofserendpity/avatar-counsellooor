import { useState } from "react";
import axios from "axios";
import { theme } from "../theme";
import { isLoggedIn, setAccountId, clearAccountId, refreshUserIdHeader } from "../utils/userId";

function AccountSection({ apiBase }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const loggedIn = isLoggedIn();

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const endpoint = mode === "signup" ? "/api/account/signup" : "/api/account/login";
      const res = await axios.post(`${apiBase}${endpoint}`, { username, password });
      setAccountId(res.data.accountId);
      refreshUserIdHeader();
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearAccountId();
    refreshUserIdHeader();
    window.location.reload();
  };

  if (loggedIn) {
    return (
      <div style={styles.dangerSection}>
        <div style={styles.rowLabel}>Account</div>
        <div style={styles.rowSub}>You're signed in — your memory and journal are private to this account, on any device.</div>
        <button style={{ ...styles.dangerButton, marginTop: "12px" }} onClick={logout}>Log out</button>
      </div>
    );
  }

  return (
    <div style={styles.dangerSection}>
      <div style={styles.rowLabel}>Account</div>
      <div style={styles.rowSub}>
        Optional — creates a private space separate from anyone else using this device, and lets you access it from other devices too. Without one, you're a guest tied to this browser.
      </div>
      <div style={styles.accountTabs}>
        <button style={{ ...styles.accountTab, ...(mode === "login" ? styles.accountTabActive : {}) }} onClick={() => setMode("login")}>Log in</button>
        <button style={{ ...styles.accountTab, ...(mode === "signup" ? styles.accountTabActive : {}) }} onClick={() => setMode("signup")}>Sign up</button>
      </div>
      <input style={styles.accountInput} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input style={styles.accountInput} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p style={styles.accountError}>{error}</p>}
      <button style={styles.accountSubmit} onClick={submit} disabled={busy || !username || !password}>
        {busy ? "…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
      <p style={styles.rowSub}>No password recovery yet — pick something you'll remember.</p>
    </div>
  );
}

function SettingsView({ apiBase, themeMode, onSetThemeMode }) {
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

      <AccountSection apiBase={apiBase} />

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
  accountTabs: { display: "flex", gap: "8px", marginTop: "14px", marginBottom: "10px" },
  accountTab: {
    padding: "7px 14px", borderRadius: "999px", border: `1px solid ${theme.border}`,
    backgroundColor: "transparent", color: theme.muted, fontSize: "13px", cursor: "pointer"
  },
  accountTabActive: { backgroundColor: theme.bgElevated, color: theme.purpleBright, borderColor: theme.purple },
  accountInput: {
    width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: "10px",
    border: `1px solid ${theme.border}`, backgroundColor: theme.bgElevated, color: theme.cream,
    fontSize: "14px", marginBottom: "8px"
  },
  accountError: { color: "#ff8080", fontSize: "12px", marginBottom: "8px" },
  accountSubmit: {
    padding: "10px 20px", borderRadius: "10px", border: "none",
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`,
    color: "#120e1c", fontWeight: 600, cursor: "pointer", fontSize: "14px", marginBottom: "8px"
  },
  aboutSection: { marginTop: "40px", textAlign: "center" },
  aboutAcronym: { fontFamily: theme.serif, fontWeight: 700, fontSize: "18px", letterSpacing: "2px" },
  aboutMeaning: { fontSize: "12px", color: theme.mutedDim, marginTop: "4px", letterSpacing: "0.5px" }
};

export default SettingsView;