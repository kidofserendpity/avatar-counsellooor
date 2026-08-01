import { useState } from "react";
import axios from "axios";
import { theme } from "../theme";
import { setAccountId, setUsername as storeUsername, markGuestChosen } from "../utils/userId";

function AuthGate({ apiBase, onContinueGuest }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const endpoint = mode === "signup" ? "/api/account/signup" : "/api/account/login";
      const res = await axios.post(`${apiBase}${endpoint}`, { username, password });
      setAccountId(res.data.accountId);
      if (res.data.username) storeUsername(res.data.username);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const continueAsGuest = () => {
    markGuestChosen();
    onContinueGuest();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.auroraA} />
      <div style={styles.auroraB} />
      <div style={styles.card}>
        <div style={{ ...styles.brand, ...theme.gradientText }}>A.R.I.A</div>
        <p style={styles.tagline}>Adaptive Responsive Intelligent Ally — a space that's actually yours.</p>

        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }} onClick={() => setMode("login")}>Log in</button>
          <button style={{ ...styles.tab, ...(mode === "signup" ? styles.tabActive : {}) }} onClick={() => setMode("signup")}>Sign up</button>
        </div>

        <input style={styles.input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input style={styles.input} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.primaryButton} onClick={submit} disabled={busy || !username || !password}>
          {busy ? "…" : mode === "signup" ? "Create account" : "Log in"}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <button style={styles.guestButton} onClick={continueAsGuest}>Continue as guest</button>
        <p style={styles.guestNote}>Guest data stays on this device only, tied to this browser.</p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, backgroundColor: theme.bg, display: "flex",
    alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 200, overflow: "hidden"
  },
  auroraA: {
    position: "absolute", top: "-20%", left: "-10%", width: "60vw", height: "60vw", borderRadius: "50%",
    background: `radial-gradient(circle, var(--accent-purple), transparent 70%)`, opacity: 0.2,
    filter: "blur(60px)", animation: "auroraDriftA 22s ease-in-out infinite", pointerEvents: "none"
  },
  auroraB: {
    position: "absolute", bottom: "-20%", right: "-10%", width: "55vw", height: "55vw", borderRadius: "50%",
    background: `radial-gradient(circle, var(--accent-teal), transparent 70%)`, opacity: 0.15,
    filter: "blur(70px)", animation: "auroraDriftB 26s ease-in-out infinite", pointerEvents: "none"
  },
  card: {
    position: "relative", backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    borderRadius: "22px", padding: "36px 30px", maxWidth: "380px", width: "100%",
    textAlign: "center", boxSizing: "border-box"
  },
  brand: { fontFamily: theme.serif, fontWeight: 700, fontSize: "28px", letterSpacing: "2px" },
  tagline: { color: theme.muted, fontSize: "13px", marginTop: "8px", marginBottom: "26px", lineHeight: 1.5 },
  tabs: { display: "flex", gap: "8px", marginBottom: "16px" },
  tab: {
    flex: 1, padding: "9px", borderRadius: "10px", border: `1px solid ${theme.border}`,
    backgroundColor: "transparent", color: theme.muted, fontSize: "13px", cursor: "pointer"
  },
  tabActive: { backgroundColor: theme.panel, color: theme.purpleBright, borderColor: theme.purple },
  input: {
    width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: "10px",
    border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.cream,
    fontSize: "14px", marginBottom: "10px"
  },
  error: { color: "#ff8080", fontSize: "12px", marginBottom: "10px" },
  primaryButton: {
    width: "100%", padding: "11px", borderRadius: "10px", border: "none",
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`,
    color: "#120e1c", fontWeight: 600, cursor: "pointer", fontSize: "14px", marginBottom: "20px"
  },
  divider: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" },
  dividerLine: { flex: 1, height: "1px", backgroundColor: theme.border },
  dividerText: { color: theme.mutedDim, fontSize: "12px" },
  guestButton: {
    width: "100%", padding: "11px", borderRadius: "10px", border: `1px solid ${theme.border}`,
    backgroundColor: "transparent", color: theme.muted, cursor: "pointer", fontSize: "14px", marginBottom: "8px"
  },
  guestNote: { color: theme.mutedDim, fontSize: "11px" }
};

export default AuthGate;