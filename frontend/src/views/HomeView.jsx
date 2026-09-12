import { useEffect, useState } from "react";
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

const SENTIMENT_META = {
  calm: { label: "Calm", color: theme.purple },
  hopeful: { label: "Hopeful", color: theme.teal },
  anxious: { label: "Anxious", color: "#c98a5a" },
  sad: { label: "Sad", color: "#8a6a6a" },
  angry: { label: "Angry", color: theme.rose }
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

function isToday(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

const CARDS = [
  { id: "breathe", index: "02", label: "Breathe", sub: "A slow pace, for a minute", Icon: Wind, color: theme.teal, tint: "rgba(94,234,212,0.12)" },
  { id: "journal", index: "03", label: "Journal", sub: "Get it out of your head", Icon: BookOpen, color: theme.rose, tint: "rgba(201,107,122,0.14)" }
];

function CheckInCard({ apiBase }) {
  const [selfReportLog, setSelfReportLog] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const refresh = () => {
    axios.get(`${apiBase}/api/mood-history`)
      .then((res) => setSelfReportLog(res.data.selfReportLog || []))
      .catch(() => setSelfReportLog([]))
      .finally(() => setLoaded(true));
  };

  useEffect(() => { refresh(); }, [apiBase]);

  const todayEntry = selfReportLog.length > 0 && isToday(selfReportLog[selfReportLog.length - 1].timestamp)
    ? selfReportLog[selfReportLog.length - 1]
    : null;

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await axios.post(`${apiBase}/api/self-report`, { sentiment: selected, note: note.trim() });
      setNote("");
      setJustSaved(true);
      refresh();
    } catch (err) {
      console.error("Check-in save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <div style={styles.checkInCard}>
      <div style={styles.checkInHeader}>How are you, really?</div>
      {todayEntry && !justSaved ? (
        <p style={styles.checkInPast}>
          You checked in as <strong style={{ color: SENTIMENT_META[todayEntry.sentiment]?.color }}>{SENTIMENT_META[todayEntry.sentiment]?.label}</strong> today{todayEntry.note ? `, and said: "${todayEntry.note}"` : ""}. Things shift, update it below if that's changed.
        </p>
      ) : (
        <p style={styles.checkInSub}>In your own words, not a guess from anything you said elsewhere.</p>
      )}
      <div style={styles.tagRow}>
        {Object.entries(SENTIMENT_META).map(([key, meta]) => (
          <button
            key={key}
            style={{
              ...styles.tagButton,
              borderColor: selected === key ? meta.color : theme.border,
              color: selected === key ? meta.color : theme.muted,
              backgroundColor: selected === key ? `${meta.color}22` : "transparent"
            }}
            onClick={() => { setSelected(key); setJustSaved(false); }}
          >
            {meta.label}
          </button>
        ))}
      </div>
      <input
        style={styles.checkInInput}
        value={note}
        onChange={(e) => { setNote(e.target.value); setJustSaved(false); }}
        placeholder="Want to add anything? (optional)"
      />
      <button style={styles.checkInSubmit} onClick={submit} disabled={!selected || saving}>
        {saving ? "Saving…" : todayEntry ? "Update check-in" : "Check in"}
      </button>
    </div>
  );
}

function HomeView({ apiBase, onNavigate }) {
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState([]);
  const [moodLog, setMoodLog] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [now] = useState(() => Date.now());

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

  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
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

  const cardStyle = (id, color) => ({
    ...styles.smallCard,
    borderColor: hovered === id ? color : theme.border,
    boxShadow: hovered === id ? `0 0 0 1px ${color}, 0 0 26px 2px ${color}55` : "none",
    transform: hovered === id ? "translateY(-2px)" : "translateY(0)"
  });

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.headerRow, animation: "fadeUp 0.5s ease backwards" }}>
        <div>
          <h1 style={{ ...styles.greeting, ...theme.gradientText }}>{greetingText}</h1>
          <p style={styles.sub}>Whatever's on your mind, there's room for it here.</p>
        </div>
      </div>

      <div style={{ ...styles.grid, ...(isMobile ? styles.gridMobile : {}) }}>
        <button
          style={{ ...styles.talkCard, ...cardStyle("talk", theme.purple), gridArea: isMobile ? "auto" : "talk", animation: "fadeUp 0.5s ease 0.05s backwards" }}
          onMouseEnter={() => setHovered("talk")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onNavigate("talk")}
        >
          <div style={styles.talkTop}>
            <div style={styles.talkIconWrap}><Mic size={26} color={theme.purpleBright} /></div>
            <ArrowUpRight size={20} color={theme.mutedDim} />
          </div>
          <div>
            <div style={styles.indexLabel}>01 //</div>
            <div style={styles.talkLabel}>Talk</div>
            <div style={styles.talkSub}>Real conversation, out loud or typed, whenever you want it</div>
          </div>
        </button>

        <div style={{ gridArea: isMobile ? "auto" : "pair", display: "flex", gap: "14px", animation: "fadeUp 0.5s ease 0.1s backwards" }}>
          {CARDS.map(({ id, index, label, sub, Icon, color, tint }) => (
            <button
              key={id}
              style={{ ...cardStyle(id, color), backgroundColor: tint, flex: 1 }}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNavigate(id)}
            >
              <div style={styles.smallCardTop}>
                <Icon size={20} color={color} />
                <span style={styles.indexLabelSmall}>{index} //</span>
              </div>
              <div>
                <div style={styles.smallCardLabel}>{label}</div>
                <div style={styles.smallCardSub}>{sub}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ ...styles.quoteCard, gridArea: isMobile ? "auto" : "quote", animation: "fadeUp 0.5s ease 0.15s backwards" }}>
          <div style={styles.quoteEyebrow}>TODAY</div>
          <p style={styles.quoteText}>{getDailyThought()}</p>
        </div>

        <div style={{ gridArea: isMobile ? "auto" : "checkin", animation: "fadeUp 0.5s ease 0.18s backwards" }}>
          <CheckInCard apiBase={apiBase} />
        </div>

        <div style={{ ...styles.snapshotCard, gridArea: isMobile ? "auto" : "snapshot", animation: "fadeUp 0.5s ease 0.2s backwards" }}>
          <div style={styles.snapshotStat}>
            <div style={{ ...styles.snapshotNumber, ...theme.gradientText }}>{nonArchivedCount}</div>
            <div style={styles.snapshotLabel}>{nonArchivedCount === 1 ? "journal entry" : "journal entries"}</div>
          </div>
          <div style={styles.snapshotDivider} />
          <div style={styles.snapshotMoodText}>
            {moodSnapshot
              ? `Based on recent conversations, ${moodSnapshot}.`
              : "Talk with A.R.I.A a bit more this week and a mood snapshot will start showing up here."}
          </div>
        </div>

        <div style={{ ...styles.recentSection, gridArea: isMobile ? "auto" : "recent", animation: "fadeUp 0.5s ease 0.25s backwards" }}>
          <div style={styles.sectionLabel}>RECENT JOURNAL ENTRIES</div>
          {recent.length === 0 ? (
            <p style={styles.emptyState}>Nothing written yet, the Journal is one tab away whenever you want it.</p>
          ) : (
            <div style={styles.recentGrid}>
              {recent.map((entry) => (
                <div key={entry.id} style={styles.recentCard}>
                  <div style={styles.recentText}>{entry.text.slice(0, 70)}{entry.text.length > 70 ? "…" : ""}</div>
                  <div style={styles.recentDate}>{new Date(entry.timestamp).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "980px", width: "100%", boxSizing: "border-box" },
  headerRow: { marginBottom: "28px" },
  greeting: { fontFamily: theme.serif, fontWeight: 600, fontSize: "34px", margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gridTemplateAreas: `"talk quote" "pair quote" "checkin checkin" "snapshot snapshot" "recent recent"`,
    gap: "14px"
  },
  gridMobile: { display: "flex", flexDirection: "column", gridTemplateColumns: "none" },
  talkCard: {
    border: "1px solid", borderRadius: "20px", padding: "22px", cursor: "pointer",
    backgroundColor: "rgba(155,107,255,0.1)", display: "flex", flexDirection: "column",
    justifyContent: "space-between", textAlign: "left", minHeight: "150px", transition: "all 0.25s ease"
  },
  talkTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  talkIconWrap: { width: "46px", height: "46px", borderRadius: "14px", backgroundColor: "rgba(155,107,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" },
  indexLabel: { color: theme.mutedDim, fontSize: "11px", letterSpacing: "1.5px", fontFamily: "ui-monospace, Consolas, monospace", marginTop: "18px" },
  talkLabel: { color: theme.cream, fontSize: "19px", fontWeight: 700, marginTop: "4px" },
  talkSub: { color: theme.muted, fontSize: "13px", marginTop: "4px", maxWidth: "320px" },
  smallCard: {
    border: "1px solid", borderRadius: "18px", padding: "16px", cursor: "pointer",
    display: "flex", flexDirection: "column", gap: "20px", textAlign: "left", transition: "all 0.25s ease"
  },
  smallCardTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  indexLabelSmall: { color: theme.mutedDim, fontSize: "10px", letterSpacing: "1px", fontFamily: "ui-monospace, Consolas, monospace" },
  smallCardLabel: { color: theme.cream, fontSize: "14px", fontWeight: 600 },
  smallCardSub: { color: theme.mutedDim, fontSize: "11px", marginTop: "2px" },
  quoteCard: {
    border: `1px solid ${theme.border}`, borderRadius: "20px", padding: "24px",
    backgroundColor: theme.panel, backdropFilter: "blur(6px)", display: "flex",
    flexDirection: "column", justifyContent: "center", minHeight: "100%", boxSizing: "border-box"
  },
  quoteEyebrow: { color: theme.mutedDim, fontSize: "10px", letterSpacing: "2px", marginBottom: "12px" },
  quoteText: { fontFamily: theme.serif, fontStyle: "italic", fontSize: "18px", color: theme.cream, lineHeight: 1.5, margin: 0 },
  checkInCard: {
    border: `1px solid ${theme.border}`, borderRadius: "18px", padding: "18px 20px",
    backgroundColor: theme.bgElevated, display: "flex", flexDirection: "column", gap: "10px"
  },
  checkInHeader: { fontFamily: theme.serif, fontSize: "16px", color: theme.cream },
  checkInSub: { color: theme.mutedDim, fontSize: "12px" },
  checkInPast: { color: theme.muted, fontSize: "12px", lineHeight: 1.5 },
  tagRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  tagButton: {
    padding: "7px 14px", borderRadius: "999px", border: "1px solid", fontSize: "12px",
    cursor: "pointer", transition: "all 0.15s ease"
  },
  checkInInput: {
    padding: "9px 12px", borderRadius: "10px", border: `1px solid ${theme.border}`,
    backgroundColor: theme.bg, color: theme.cream, fontSize: "13px", outline: "none"
  },
  checkInSubmit: {
    alignSelf: "flex-start", padding: "8px 18px", borderRadius: "10px", border: "none",
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`,
    color: "#120e1c", fontWeight: 600, fontSize: "13px", cursor: "pointer"
  },
  snapshotCard: {
    border: `1px solid ${theme.border}`, borderRadius: "18px", padding: "20px 24px",
    backgroundColor: theme.bgElevated, display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap"
  },
  snapshotStat: { display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: "90px" },
  snapshotNumber: { fontFamily: theme.serif, fontWeight: 700, fontSize: "30px", lineHeight: 1 },
  snapshotLabel: { color: theme.mutedDim, fontSize: "11px", marginTop: "4px" },
  snapshotDivider: { width: "1px", alignSelf: "stretch", backgroundColor: theme.border },
  snapshotMoodText: { color: theme.muted, fontSize: "13px", lineHeight: 1.5, flex: 1, minWidth: "180px" },
  recentSection: {},
  sectionLabel: { color: theme.mutedDim, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "12px" },
  emptyState: { color: theme.mutedDim, fontSize: "13px" },
  recentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" },
  recentCard: {
    padding: "14px 16px", backgroundColor: theme.bgElevated, borderRadius: "12px", border: `1px solid ${theme.border}`
  },
  recentText: { color: theme.cream, fontSize: "13px", lineHeight: 1.5 },
  recentDate: { color: theme.mutedDim, fontSize: "11px", marginTop: "8px" }
};

export default HomeView;