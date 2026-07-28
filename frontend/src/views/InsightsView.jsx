import { useEffect, useState } from "react";
import axios from "axios";
import MoodChart from "../components/MoodChart";
import { theme } from "../theme";

function InsightsView({ apiBase }) {
  const [journalCount, setJournalCount] = useState(0);

  useEffect(() => {
    axios.get(`${apiBase}/api/journal`)
      .then((res) => setJournalCount((res.data.entries || []).length))
      .catch(() => setJournalCount(0));
  }, [apiBase]);

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Insights</h1>
      <p style={styles.sub}>A quiet look at the pattern, not a scoreboard.</p>

      <div style={styles.statRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{journalCount}</div>
          <div style={styles.statLabel}>Journal entries</div>
        </div>
      </div>

      <div style={styles.sectionLabel}>MOOD OVER TIME</div>
      <MoodChart apiBase={apiBase} />
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "760px" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "28px" },
  statRow: { display: "flex", gap: "14px", marginBottom: "28px" },
  statCard: {
    backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    borderRadius: "14px", padding: "18px 22px", minWidth: "140px"
  },
  statNumber: { fontFamily: theme.serif, fontSize: "28px", color: theme.purpleBright },
  statLabel: { color: theme.muted, fontSize: "12px", marginTop: "4px" },
  sectionLabel: { color: theme.mutedDim, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "12px" }
};

export default InsightsView;