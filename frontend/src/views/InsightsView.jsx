import { useEffect, useState } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { BookOpen, Archive, Tag } from "lucide-react";
import MoodChart from "../components/MoodChart";
import { theme } from "../theme";

const CATEGORY_LABELS = {
  reflection: "Reflection", gratitude: "Gratitude", venting: "Venting", goal: "Goal",
  dream: "Dream", memory: "Memory", worry: "Worry", other: "Other"
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

// Small dependency-free count-up for the two numeric stats.
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const step = (ts) => {
      if (start === undefined) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatCard({ children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      style={styles.statCard}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ y: hovered ? -3 : 0, borderColor: hovered ? theme.purple : theme.border }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
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
  const activeCountDisplay = useCountUp(active.length);
  const archivedCountDisplay = useCountUp(archivedCount);

  let topCategory = "—";
  if (active.length > 0) {
    const counts = {};
    active.forEach((e) => { counts[e.category] = (counts[e.category] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    topCategory = CATEGORY_LABELS[top[0]] || "Other";
  }

  return (
    <motion.div
      style={styles.wrap}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      <motion.h1 variants={fadeUp} style={styles.title}>Insights</motion.h1>
      <motion.p variants={fadeUp} style={styles.sub}>A quiet look at the pattern, not a scoreboard.</motion.p>

      <div style={styles.statRow}>
        <StatCard>
          <BookOpen size={18} color={theme.purpleBright} />
          <div style={{ ...styles.statNumber, ...theme.gradientText }}>{activeCountDisplay}</div>
          <div style={styles.statLabel}>Journal entries</div>
        </StatCard>
        <StatCard>
          <Tag size={18} color={theme.teal} />
          <div style={styles.statText}>{topCategory}</div>
          <div style={styles.statLabel}>Most common theme</div>
        </StatCard>
        <StatCard>
          <Archive size={18} color={theme.rose} />
          <div style={{ ...styles.statNumber, ...theme.gradientText }}>{archivedCountDisplay}</div>
          <div style={styles.statLabel}>Archived entries</div>
        </StatCard>
      </div>

      <motion.div variants={fadeUp} style={styles.sectionLabel}>MOOD OVER TIME</motion.div>
      <motion.div variants={fadeUp}>
        <MoodChart apiBase={apiBase} />
      </motion.div>
    </motion.div>
  );
}

const styles = {
  wrap: { maxWidth: "980px", width: "100%", boxSizing: "border-box" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "28px" },
  statRow: { display: "flex", gap: "14px", marginBottom: "28px", flexWrap: "wrap" },
  statCard: {
    flex: "1 1 180px", backgroundColor: theme.bgElevated, border: "1px solid",
    borderRadius: "16px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px"
  },
  statNumber: { fontFamily: theme.serif, fontWeight: 700, fontSize: "28px" },
  statText: { fontFamily: theme.serif, fontWeight: 600, fontSize: "20px", color: theme.cream },
  statLabel: { color: theme.muted, fontSize: "12px" },
  sectionLabel: { color: theme.mutedDim, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "12px" }
};

export default InsightsView;