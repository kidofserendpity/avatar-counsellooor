import { useEffect, useState } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { Mic, Wind, BookOpen, ArrowUpRight } from "lucide-react";
import { theme } from "../theme";
import { useIsMobile } from "../hooks/useIsMobile";
import { getUsername } from "../utils/userId";

const DAILY_THOUGHTS = [
  "Some days are just for getting through. That counts too.",
  "You don't owe anyone a good mood today.",
  "Small talk with yourself still counts as talking.",
  "Rest isn't something you have to earn first.",
  "Whatever's loud in your head right now, it's allowed to be said out loud.",
  "You're allowed to change your mind about how today's going.",
  "Not everything needs fixing tonight.",
  "The version of you doing okay right now still counts.",
  "You get to decide what \"productive\" means today.",
  "It's fine if today was just fine.",
  "Nobody's keeping score but you.",
  "A slow day isn't a wasted one.",
  "You're not behind. There's no schedule.",
  "Sometimes \"I don't know how I feel\" is the honest answer, and that's okay.",
  "You made it to today. That's not nothing.",
  "Whatever you're carrying, you don't have to carry all of it alone right now.",
  "Progress doesn't always look like progress while it's happening.",
  "You're allowed to be a work in progress, out loud."
];

const MOOD_LABELS = {
  calm: "you've been feeling pretty steady",
  hopeful: "there's been a hopeful thread running through it",
  anxious: "it's been a bit of an anxious stretch",
  sad: "this week's felt heavier than usual",
  angry: "there's been some real frustration this week"
};

function getDailyThought() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  return DAILY_THOUGHTS[dayOfYear % DAILY_THOUGHTS.length];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

// A small, dependency-free count-up, in the spirit of the animated stat
// counters on the reference site, without pulling in a number-tweening lib.
function useCountUp(target, duration = 900) {
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

// The three actions, in the numbered "01 //" list register the reference
// site uses for its services and process steps, instead of boxed cards.
const ACTIONS = [
  { id: "talk", index: "01", label: "Talk", sub: "Real conversation, out loud or typed, whenever you want it", Icon: Mic, color: theme.purple, bright: theme.purpleBright },
  { id: "breathe", index: "02", label: "Breathe", sub: "A slow pace, for a minute", Icon: Wind, color: theme.teal, bright: theme.teal },
  { id: "journal", index: "03", label: "Journal", sub: "Get it out of your head", Icon: BookOpen, color: theme.rose, bright: theme.rose }
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } }
};

function ActionRow({ id, index, label, sub, Icon, color, bright, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      variants={fadeUp}
      style={styles.actionRow}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate(id)}
    >
      <motion.div
        style={styles.actionAccent}
        animate={{ backgroundColor: hovered ? bright : "transparent" }}
        transition={{ duration: 0.25 }}
      />
      <span style={{ ...styles.actionIndex, color: hovered ? bright : theme.mutedDim }}>{index} //</span>
      <div style={styles.actionIconWrap}>
        <Icon size={18} color={hovered ? bright : theme.muted} />
      </div>
      <div style={styles.actionText}>
        <motion.div
          style={styles.actionLabel}
          animate={{ x: hovered ? 6 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          {label}
        </motion.div>
        <div style={styles.actionSub}>{sub}</div>
      </div>
      <motion.div
        animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0.4 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <ArrowUpRight size={20} color={color} />
      </motion.div>
    </motion.button>
  );
}

function HomeView({ apiBase, onNavigate }) {
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState([]);
  const [moodLog, setMoodLog] = useState([]);

  useEffect(() => {
    axios.get(`${apiBase}/api/journal`)
      .then((res) => setEntries(res.data.entries || []))
      .catch(() => setEntries([]));
    axios.get(`${apiBase}/api/mood-history`)
      .then((res) => setMoodLog(res.data.moodLog || []))
      .catch(() => setMoodLog([]));
  }, [apiBase]);

  const recent = entries.filter((e) => !e.archived).slice(-4).reverse();
  const nonArchivedCount = entries.filter((e) => !e.archived).length;
  const countDisplay = useCountUp(nonArchivedCount);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentMood = moodLog.filter((m) => m.timestamp >= sevenDaysAgo);
  let moodSnapshot = null;
  if (recentMood.length >= 3) {
    const counts = {};
    recentMood.forEach((m) => { counts[m.sentiment] = (counts[m.sentiment] || 0) + 1; });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    moodSnapshot = MOOD_LABELS[dominant] || null;
  }

  const username = getUsername();
  const greetingText = username ? `${getGreeting()}, ${capitalize(username)}.` : `${getGreeting()}.`;

  return (
    <motion.div
      style={styles.wrap}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
    >
      <motion.div variants={fadeUp} style={styles.eyebrow}>A SPACE THAT'S ACTUALLY YOURS</motion.div>
      <motion.h1 variants={fadeUp} style={{ ...styles.greeting, ...theme.gradientText }}>{greetingText}</motion.h1>
      <motion.p variants={fadeUp} style={styles.sub}>Whatever's on your mind, there's room for it here.</motion.p>

      <motion.div variants={fadeUp} style={styles.actionList}>
        {ACTIONS.map((action) => (
          <ActionRow key={action.id} {...action} onNavigate={onNavigate} />
        ))}
      </motion.div>

      <div style={{ ...styles.band, ...(isMobile ? styles.bandMobile : {}) }}>
        <motion.div variants={fadeUp} style={styles.quoteBlock}>
          <div style={styles.eyebrowSmall}>TODAY</div>
          <p style={styles.quoteText}>{getDailyThought()}</p>
        </motion.div>

        <motion.div variants={fadeUp} style={styles.statBlock}>
          <div style={{ ...styles.statNumber, ...theme.gradientText }}>{countDisplay}</div>
          <div style={styles.statLabel}>{nonArchivedCount === 1 ? "journal entry" : "journal entries"}</div>
          <div style={styles.statDivider} />
          <div style={styles.statMoodText}>
            {moodSnapshot
              ? `Based on recent conversations, ${moodSnapshot}.`
              : "Talk with A.R.I.A a bit more this week and a mood snapshot will start showing up here."}
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} style={styles.recentSection}>
        <div style={styles.eyebrowSmall}>RECENT JOURNAL ENTRIES</div>
        {recent.length === 0 ? (
          <p style={styles.emptyState}>Nothing written yet — the Journal is one tab away whenever you want it.</p>
        ) : (
          <div style={styles.recentGrid}>
            {recent.map((entry, i) => (
              <div key={entry.id} style={styles.recentCard}>
                <div style={styles.recentIndex}>{String(i + 1).padStart(2, "0")}</div>
                <div style={styles.recentText}>{entry.text.slice(0, 70)}{entry.text.length > 70 ? "…" : ""}</div>
                <div style={styles.recentDate}>{new Date(entry.timestamp).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const styles = {
  wrap: { maxWidth: "980px", width: "100%", margin: "0 auto", boxSizing: "border-box" },
  eyebrow: {
    color: theme.mutedDim, fontSize: "11px", letterSpacing: "3px", fontWeight: 600,
    marginBottom: "18px", textTransform: "uppercase"
  },
  greeting: {
    fontFamily: theme.serif, fontWeight: 600, fontSize: "clamp(38px, 5.4vw, 72px)",
    lineHeight: 1.05, margin: 0
  },
  sub: { color: theme.muted, fontSize: "15px", marginTop: "14px", marginBottom: "40px" },

  actionList: { display: "flex", flexDirection: "column", borderTop: `1px solid ${theme.border}`, marginBottom: "36px" },
  actionRow: {
    position: "relative", display: "flex", alignItems: "center", gap: "18px",
    padding: "22px 6px", border: "none", borderBottom: `1px solid ${theme.border}`,
    background: "transparent", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box"
  },
  actionAccent: { position: "absolute", left: 0, top: "14px", bottom: "14px", width: "2px", borderRadius: "2px" },
  actionIndex: { fontFamily: "ui-monospace, Consolas, monospace", fontSize: "12px", letterSpacing: "1px", width: "44px", flexShrink: 0, transition: "color 0.25s ease" },
  actionIconWrap: {
    width: "38px", height: "38px", borderRadius: "50%", border: `1px solid ${theme.border}`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
  },
  actionText: { flex: 1, minWidth: 0 },
  actionLabel: { color: theme.cream, fontSize: "20px", fontFamily: theme.serif, fontWeight: 600 },
  actionSub: { color: theme.muted, fontSize: "13px", marginTop: "4px" },

  band: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "40px" },
  bandMobile: { gridTemplateColumns: "1fr" },
  quoteBlock: {
    border: `1px solid ${theme.border}`, borderRadius: "20px", padding: "26px",
    backgroundColor: theme.panel, backdropFilter: "blur(6px)", display: "flex",
    flexDirection: "column", justifyContent: "center", boxSizing: "border-box"
  },
  eyebrowSmall: { color: theme.mutedDim, fontSize: "10.5px", letterSpacing: "2.5px", marginBottom: "12px", textTransform: "uppercase" },
  quoteText: { fontFamily: theme.serif, fontStyle: "italic", fontSize: "19px", color: theme.cream, lineHeight: 1.5, margin: 0 },
  statBlock: {
    border: `1px solid ${theme.border}`, borderRadius: "20px", padding: "26px",
    backgroundColor: theme.bgElevated, display: "flex", flexDirection: "column", boxSizing: "border-box"
  },
  statNumber: { fontFamily: theme.serif, fontWeight: 700, fontSize: "48px", lineHeight: 1 },
  statLabel: { color: theme.mutedDim, fontSize: "11px", marginTop: "6px", letterSpacing: "0.5px" },
  statDivider: { height: "1px", backgroundColor: theme.border, margin: "16px 0" },
  statMoodText: { color: theme.muted, fontSize: "13px", lineHeight: 1.55 },

  recentSection: {},
  emptyState: { color: theme.mutedDim, fontSize: "13px" },
  recentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" },
  recentCard: {
    padding: "16px", backgroundColor: theme.bgElevated, borderRadius: "12px", border: `1px solid ${theme.border}`,
    position: "relative"
  },
  recentIndex: { color: theme.mutedDim, fontSize: "10px", fontFamily: "ui-monospace, Consolas, monospace", marginBottom: "8px" },
  recentText: { color: theme.cream, fontSize: "13px", lineHeight: 1.5 },
  recentDate: { color: theme.mutedDim, fontSize: "11px", marginTop: "10px" }
};

export default HomeView;