import { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, Archive, Tag } from "lucide-react";
import MoodChart from "../components/MoodChart";
import { theme } from "../theme";

const CATEGORY_LABELS = {
  reflection: "Reflection", gratitude: "Gratitude", venting: "Venting", goal: "Goal",
  dream: "Dream", memory: "Memory", worry: "Worry", other: "Other"
};

function InsightsView({ apiBase }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    axios.get(`${apiBase}/api/journal`)
      .then((res) => setEntries(res.data.entries || []))
      .catch(() => setEntries([]));
  }, [apiBase]);

  const active = entries.filter((e) => !e.archived);
  const archivedCount = entries.filter((e) => e.archived).length;

  let topCategory = "—";
  if (active.length > 0) {
    const counts = {};
    active.forEach((e) => { counts[e.category] = (counts[e.category] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    topCategory = CATEGORY_LABELS[top[0]] || "Other";
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Insights</h1>
      <p style={styles.sub}>A quiet look at the pattern, not a scoreboard.</p>

      <div style={styles.statRow}>
        <div style={styles.statCard}>
          <BookOpen size={18} color={theme.purpleBright} />
          <div style={{ ...styles.statNumber, ...theme.gradientText }}>{active.length}</div>
          <div style={styles.statLabel}>Journal entries</div>
        </div>
        <div style={styles.statCard}>
          <Tag size={18} color={theme.teal} />
          <div style={styles.statText}>{topCategory}</div>
          <div style={styles.statLabel}>Most common theme</div>
        </div>
        <div style={styles.statCard}>
          <Archive size={18} color={theme.rose} />
          <div style={{ ...styles.statNumber, ...theme.gradientText }}>{archivedCount}</div>
          <div style={styles.statLabel}>Archived entries</div>
        </div>
      </div>

      <div style={styles.sectionLabel}>MOOD OVER TIME</div>
      <MoodChart apiBase={apiBase} />
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "980px", width: "100%", boxSizing: "border-box" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "28px" },
  statRow: { display: "flex", gap: "14px", marginBottom: "28px", flexWrap: "wrap" },
  statCard: {
    flex: "1 1 180px", backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    borderRadius: "16px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px"
  },
  statNumber: { fontFamily: theme.serif, fontWeight: 700, fontSize: "28px" },
  statText: { fontFamily: theme.serif, fontWeight: 600, fontSize: "20px", color: theme.cream },
  statLabel: { color: theme.muted, fontSize: "12px" },
  sectionLabel: { color: theme.mutedDim, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "12px" }
};

export default InsightsView;