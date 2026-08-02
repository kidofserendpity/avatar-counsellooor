import { useState } from "react";
import axios from "axios";
import { Palette, Sparkles, SunMoon, Wind, UserCircle, ShieldAlert } from "lucide-react";
import { theme } from "../theme";
import { isLoggedIn, clearAccountId, clearGuestChoice, clearUsername } from "../utils/userId";
import { useIsMobile } from "../hooks/useIsMobile";

function AccountSection() {
  const loggedIn = isLoggedIn();

  const handleAccountAction = () => {
    clearAccountId();
    clearGuestChoice();
    clearUsername();
    window.location.reload();
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}><UserCircle size={17} color={theme.purpleBright} /><span>Account</span></div>
      <div style={styles.rowSub}>
        {loggedIn
          ? "You're signed in, your memory and journal are private to this account, on any device."
          : "You're using a guest space tied to this browser. Log in or create an account to reach your space from other devices too."}
      </div>
      <button style={{ ...styles.dangerButton, marginTop: "16px" }} onClick={handleAccountAction}>
        {loggedIn ? "Log out" : "Log in / Sign up"}
      </button>
    </div>
  );
}

function SettingsView({ apiBase, themeMode, onSetThemeMode, ambientBackground, onSetAmbientBackground }) {
  const isMobile = useIsMobile();
  const [reduceMotion, setReduceMotion] = useState(
    typeof document !== "undefined" && document.body.classList.contains("reduce-motion")
  );
  const [busy, setBusy] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);

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

  const cardStyle = (id) => ({
    ...styles.card,
    boxShadow: hoveredCard === id ? `0 0 0 1px ${theme.purple}, 0 0 24px 2px rgba(155,107,255,0.3)` : "none",
    transform: hoveredCard === id ? "translateY(-2px)" : "translateY(0)"
  });

  return (
    <div style={styles.wrap}>
      <h1 style={{ ...styles.title, ...theme.gradientText, animation: "fadeUp 0.4s ease backwards" }}>Settings</h1>

      <div style={{ ...styles.grid, ...(isMobile ? { gridTemplateColumns: "1fr" } : {}) }}>
        <div
          style={{ ...cardStyle("appearance"), animation: "fadeUp 0.4s ease 0.05s backwards" }}
          onMouseEnter={() => setHoveredCard("appearance")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={styles.cardHeader}><Palette size={17} color={theme.purpleBright} /><span>Appearance</span></div>

          <div style={styles.row}>
            <div style={styles.rowText}>
              <Sparkles size={15} color={theme.teal} />
              <div>
                <div style={styles.rowLabel}>Ambient background</div>
                <div style={styles.rowSub}>A soft, slow-pulsing glow in the orb's colors. On by default.</div>
              </div>
            </div>
            <button
              style={{ ...styles.toggle, backgroundColor: ambientBackground ? theme.purple : theme.bgElevated }}
              onClick={() => onSetAmbientBackground(!ambientBackground)}
            >
              <span style={{ ...styles.toggleDot, transform: ambientBackground ? "translateX(18px)" : "translateX(0)" }} />
            </button>
          </div>

          <div style={styles.row}>
            <div style={styles.rowText}>
              <SunMoon size={15} color={theme.rose} />
              <div>
                <div style={styles.rowLabel}>Light theme</div>
                <div style={styles.rowSub}>A light version of the same palette.</div>
              </div>
            </div>
            <button
              style={{ ...styles.toggle, backgroundColor: themeMode === "light" ? theme.purple : theme.bgElevated }}
              onClick={toggleLightTheme}
            >
              <span style={{ ...styles.toggleDot, transform: themeMode === "light" ? "translateX(18px)" : "translateX(0)" }} />
            </button>
          </div>

          <div style={{ ...styles.row, borderBottom: "none" }}>
            <div style={styles.rowText}>
              <Wind size={15} color={theme.mutedDim} />
              <div>
                <div style={styles.rowLabel}>Reduce motion</div>
                <div style={styles.rowSub}>Turns off breathing, pulse, and panel animations.</div>
              </div>
            </div>
            <button
              style={{ ...styles.toggle, backgroundColor: reduceMotion ? theme.purple : theme.bgElevated }}
              onClick={toggleReduceMotion}
            >
              <span style={{ ...styles.toggleDot, transform: reduceMotion ? "translateX(18px)" : "translateX(0)" }} />
            </button>
          </div>
        </div>

        <div
          style={{ animation: "fadeUp 0.4s ease 0.1s backwards" }}
          onMouseEnter={() => setHoveredCard("account")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={cardStyle("account")}>
            <AccountSection />
          </div>
        </div>

        <div
          style={{ ...cardStyle("data"), gridColumn: isMobile ? "auto" : "1 / -1", animation: "fadeUp 0.4s ease 0.15s backwards" }}
          onMouseEnter={() => setHoveredCard("data")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={styles.cardHeader}><ShieldAlert size={17} color={theme.crisis} /><span>Clear your data</span></div>
          <div style={styles.rowSub}>Choose exactly what to reset. All three actions are permanent.</div>

          <div style={styles.dangerRow}>
            <div>
              <div style={styles.dangerLabel}>Clear A.R.I.A's memory only</div>
              <div style={styles.rowSub}>Facts, mood history, and style, journal entries are kept.</div>
            </div>
            <button style={styles.dangerButton} onClick={clearMemoryOnly} disabled={busy !== null}>
              {busy === "memory" ? "Clearing…" : "Clear"}
            </button>
          </div>

          <div style={styles.dangerRow}>
            <div>
              <div style={styles.dangerLabel}>Clear journal only</div>
              <div style={styles.rowSub}>Deletes every journal entry, A.R.I.A's memory of you is kept.</div>
            </div>
            <button style={styles.dangerButton} onClick={clearJournalOnly} disabled={busy !== null}>
              {busy === "journal" ? "Clearing…" : "Clear"}
            </button>
          </div>

          <div style={{ ...styles.dangerRow, borderBottom: "none" }}>
            <div>
              <div style={styles.dangerLabel}>Clear both</div>
              <div style={styles.rowSub}>Wipes memory and journal entirely, a completely fresh start.</div>
            </div>
            <button style={styles.dangerButton} onClick={clearEverything} disabled={busy !== null}>
              {busy === "both" ? "Clearing…" : "Clear both"}
            </button>
          </div>

          {statusMessage && <p style={styles.confirmText}>{statusMessage}</p>}
        </div>

        <div style={{ ...styles.aboutCard, gridColumn: isMobile ? "auto" : "1 / -1", animation: "fadeUp 0.4s ease 0.2s backwards" }}>
          <div style={{ ...styles.aboutAcronym, ...theme.gradientText }}>A.R.I.A</div>
          <div style={styles.aboutMeaning}>Adaptive Responsive Intelligent Ally</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "900px", width: "100%", boxSizing: "border-box" },
  title: { fontFamily: theme.serif, fontWeight: 600, fontSize: "30px", margin: "0 0 24px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  card: {
    backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: "18px",
    padding: "20px 22px", transition: "all 0.25s ease", height: "100%", boxSizing: "border-box"
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "9px", color: theme.cream, fontSize: "15px", fontWeight: 700, marginBottom: "14px" },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderBottom: `1px solid ${theme.border}`, gap: "12px"
  },
  rowText: { display: "flex", alignItems: "flex-start", gap: "10px" },
  rowLabel: { color: theme.cream, fontSize: "13px", fontWeight: 600 },
  rowSub: { color: theme.mutedDim, fontSize: "12px", marginTop: "3px", maxWidth: "280px" },
  toggle: {
    width: "38px", height: "21px", borderRadius: "999px", border: "none", flexShrink: 0,
    cursor: "pointer", position: "relative", padding: "2px", transition: "background-color 0.2s ease"
  },
  toggleDot: {
    display: "block", width: "17px", height: "17px", borderRadius: "50%",
    backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "transform 0.2s ease"
  },
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
  aboutCard: { textAlign: "center", padding: "24px" },
  aboutAcronym: { fontFamily: theme.serif, fontWeight: 700, fontSize: "18px", letterSpacing: "2px" },
  aboutMeaning: { fontSize: "12px", color: theme.mutedDim, marginTop: "4px", letterSpacing: "0.5px" }
};

export default SettingsView;