import { useEffect, useState } from "react";
import axios from "axios";
import { Mic, Wind, BookOpen } from "lucide-react";
import { theme } from "../theme";
import { useIsMobile } from "../hooks/useIsMobile";

const CARDS = [
  { id: "talk", label: "Talk", Icon: Mic, tint: "rgba(155,107,255,0.14)", color: "#c9b6ff" },
  { id: "breathe", label: "Breathe", Icon: Wind, tint: "rgba(94,234,212,0.12)", color: "#8be9d8" },
  { id: "journal", label: "Journal", Icon: BookOpen, tint: "rgba(201,107,122,0.14)", color: "#e2a3ac" }
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function HomeView({ apiBase, onNavigate }) {
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    axios.get(`${apiBase}/api/journal`)
      .then((res) => setEntries(res.data.entries || []))
      .catch(() => setEntries([]));
  }, [apiBase]);

  const recent = entries.filter((e) => !e.archived).slice(-3).reverse();

  return (
    <div style={styles.wrap}>
      <h1 style={{ ...styles.greeting, ...theme.gradientText }}>{getGreeting()}.</h1>
      <p style={styles.sub}>Whatever's on your mind, there's room for it here.</p>

      <div style={styles.sectionLabel}>YOUR SPACE</div>
      <div style={{ ...styles.cardGrid, flexDirection: isMobile ? "column" : "row" }}>
        {CARDS.map(({ id, label, Icon, tint, color }) => (
          <button key={id} style={{ ...styles.card, backgroundColor: tint }} onClick={() => onNavigate(id)}>
            <Icon size={22} color={color} />
            <span style={styles.cardLabel}>{label}</span>
          </button>
        ))}
      </div>

      <div style={styles.sectionLabel}>RECENT JOURNAL ENTRIES</div>
      {recent.length === 0 ? (
        <p style={styles.emptyState}>Nothing written yet — the Journal is one tab away whenever you want it.</p>
      ) : (
        <div style={styles.activityList}>
          {recent.map((entry) => (
            <div key={entry.id} style={styles.activityRow}>
              <BookOpen size={16} color={theme.mutedDim} />
              <div>
                <div style={styles.activityText}>{entry.text.slice(0, 80)}{entry.text.length > 80 ? "…" : ""}</div>
                <div style={styles.activityDate}>{new Date(entry.timestamp).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "760px", width: "100%", boxSizing: "border-box" },
  greeting: { fontFamily: theme.serif, fontWeight: 600, fontSize: "34px", margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "32px" },
  sectionLabel: { color: theme.mutedDim, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "12px", marginTop: "28px" },
  cardGrid: { display: "flex", gap: "14px" },
  card: {
    flex: 1, border: "none", borderRadius: "16px", padding: "22px 18px", display: "flex",
    flexDirection: "column", alignItems: "flex-start", gap: "26px", cursor: "pointer", textAlign: "left"
  },
  cardLabel: { color: theme.cream, fontSize: "15px", fontWeight: 600 },
  emptyState: { color: theme.mutedDim, fontSize: "13px" },
  activityList: { display: "flex", flexDirection: "column", gap: "10px" },
  activityRow: {
    display: "flex", gap: "12px", alignItems: "center", padding: "14px 16px",
    backgroundColor: theme.bgElevated, borderRadius: "12px", border: `1px solid ${theme.border}`
  },
  activityText: { color: theme.cream, fontSize: "14px" },
  activityDate: { color: theme.mutedDim, fontSize: "12px", marginTop: "2px" }
};

export default HomeView;