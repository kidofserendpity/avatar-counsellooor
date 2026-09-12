import { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, Archive, Tag, Sparkles } from "lucide-react";
import MoodChart from "../components/MoodChart";
import { theme } from "../theme";

const CATEGORY_LABELS = {
  reflection: "Reflection", gratitude: "Gratitude", venting: "Venting", goal: "Goal",
  dream: "Dream", memory: "Memory", worry: "Worry", other: "Other"
};

function CountUpNumber({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf;
    const start = Date.now();
    const duration = 700;
    const from = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

function AdaptationCard({ apiBase }) {
  const [styleProfile, setStyleProfile] = useState(null);

  useEffect(() => {
    axios.get(`${apiBase}/api/adaptation`)
      .then((res) => setStyleProfile(res.data.styleProfile))
      .catch(() => setStyleProfile(null));
  }, [apiBase]);

  if (!styleProfile || styleProfile.totalMessages < 8) {
    return (
      <div style={styles.adaptCard}>
        <div style={styles.adaptHeader}><Sparkles size={16} color={theme.purpleBright} /> How A.R.I.A reads you</div>
        <p style={styles.adaptEmpty}>Still learning how you talk. Keep chatting and this fills in.</p>
      </div>
    );
  }

  const { totalMessages, length, humorCount, formality } = styleProfile;
  const pct = (n) => Math.round((n / totalMessages) * 100);

  return (
    <div style={styles.adaptCard}>
      <div style={styles.adaptHeader}><Sparkles size={16} color={theme.purpleBright} /> How A.R.I.A reads you</div>

      <div style={styles.adaptRow}>
        <span style={styles.adaptLabel}>Message length</span>
        <div style={styles.adaptBar}>
          <div style={{ ...styles.adaptSeg, width: `${pct(length.short)}%`, background: theme.teal }} />
          <div style={{ ...styles.adaptSeg, width: `${pct(length.medium)}%`, background: theme.purple }} />
          <div style={{ ...styles.adaptSeg, width: `${pct(length.long)}%`, background: theme.rose }} />
        </div>
        <div style={styles.adaptLegend}>
          <span>Short {pct(length.short)}%</span><span>Medium {pct(length.medium)}%</span><span>Long {pct(length.long)}%</span>
        </div>
      </div>

      <div style={styles.adaptRow}>
        <span style={styles.adaptLabel}>Formality</span>
        <div style={styles.adaptBar}>
          <div style={{ ...styles.adaptSeg, width: `${pct(formality.casual)}%`, background: theme.teal }} />
          <div style={{ ...styles.adaptSeg, width: `${pct(formality.neutral)}%`, background: theme.purple }} />
          <div style={{ ...styles.adaptSeg, width: `${pct(formality.formal)}%`, background: theme.rose }} />
        </div>
        <div style={styles.adaptLegend}>
          <span>Casual {pct(formality.casual)}%</span><span>Neutral {pct(formality.neutral)}%</span><span>Formal {pct(formality.formal)}%</span>
        </div>
      </div>

      <div style={styles.adaptHumor}>Jokes around in about <strong style={{ color: theme.purpleBright }}>{pct(humorCount)}%</strong> of messages.</div>
    </div>
  );
}

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
          <div style={{ ...styles.statNumber, ...theme.gradientText }}><CountUpNumber value={active.length} /></div>
          <div style={styles.statLabel}>Journal entries</div>
        </div>
        <div style={styles.statCard}>
          <Tag size={18} color={theme.teal} />
          <div style={styles.statText}>{topCategory}</div>
          <div style={styles.statLabel}>Most common theme</div>
        </div>
        <div style={styles.statCard}>
          <Archive size={18} color={theme.rose} />
          <div style={{ ...styles.statNumber, ...theme.gradientText }}><CountUpNumber value={archivedCount} /></div>
          <div style={styles.statLabel}>Archived entries</div>
        </div>
      </div>

      <AdaptationCard apiBase={apiBase} />

      <div style={{ ...styles.sectionLabel, marginTop: "24px" }}>MOOD OVER TIME</div>
      <MoodChart apiBase={apiBase} />
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "980px", width: "100%", boxSizing: "border-box" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "28px" },
  statRow: { display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap" },
  statCard: {
    flex: "1 1 180px", backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    borderRadius: "16px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px"
  },
  statNumber: { fontFamily: theme.serif, fontWeight: 700, fontSize: "28px" },
  statText: { fontFamily: theme.serif, fontWeight: 600, fontSize: "20px", color: theme.cream },
  statLabel: { color: theme.muted, fontSize: "12px" },
  sectionLabel: { color: theme.mutedDim, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "12px" },
  adaptCard: {
    backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: "16px",
    padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px"
  },
  adaptHeader: { display: "flex", alignItems: "center", gap: "8px", fontFamily: theme.serif, fontSize: "16px", color: theme.cream },
  adaptEmpty: { color: theme.mutedDim, fontSize: "13px", margin: 0 },
  adaptRow: { display: "flex", flexDirection: "column", gap: "6px" },
  adaptLabel: { color: theme.muted, fontSize: "12px" },
  adaptBar: { display: "flex", height: "8px", borderRadius: "999px", overflow: "hidden", backgroundColor: theme.bg },
  adaptSeg: { height: "100%" },
  adaptLegend: { display: "flex", gap: "12px", fontSize: "11px", color: theme.mutedDim, flexWrap: "wrap" },
  adaptHumor: { color: theme.muted, fontSize: "13px" }
};

export default InsightsView;