import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Lightbulb, Heart, Flame, Target, Moon, Image, CloudRain, FileText, Archive, ArchiveRestore, Trash2, ChevronDown, Check, Sparkles } from "lucide-react";
import { theme } from "../theme";

const CATEGORY_META = {
  reflection: { label: "Reflection", Icon: Lightbulb, color: "#9b6bff" },
  gratitude: { label: "Gratitude", Icon: Heart, color: "#5eead4" },
  venting: { label: "Venting", Icon: Flame, color: "#d9776a" },
  goal: { label: "Goal", Icon: Target, color: "#f2b872" },
  dream: { label: "Dream", Icon: Moon, color: "#8b7aa8" },
  memory: { label: "Memory", Icon: Image, color: "#c9b6ff" },
  worry: { label: "Worry", Icon: CloudRain, color: "#8b95a8" },
  other: { label: "Other", Icon: FileText, color: "#6b6578" }
};

const WRITING_PROMPTS = [
  "What's something you didn't say out loud today?",
  "What's been taking up the most space in your head lately?",
  "Write about a moment today that you'd want to remember.",
  "What's something you're avoiding thinking about right now?",
  "If today had a title, what would it be?",
  "What's a conversation you wish you could have again?",
  "What's something you're proud of that nobody noticed?",
  "Write to someone you haven't said something to yet.",
  "What's weighing on you that you haven't put into words?",
  "Describe how you actually feel right now, not how you're supposed to feel.",
  "What's something small that went right today?",
  "What do you wish someone had asked you today?",
  "Write about something you're looking forward to, even a little.",
  "What's a thought you keep circling back to?",
  "If you could say one true thing right now, what would it be?",
  "What's something you needed to hear today?"
];

function CategoryDropdown({ value, onChange, includeAll }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = includeAll && value === "all"
    ? { label: "All categories", Icon: null, color: theme.muted }
    : CATEGORY_META[value] || CATEGORY_META.other;
  const CurrentIcon = current.Icon;

  return (
    <div style={styles.dropdownWrap} ref={ref}>
      <button style={styles.dropdownButton} onClick={() => setOpen((o) => !o)}>
        {CurrentIcon ? <CurrentIcon size={14} color={current.color} /> : null}
        <span>{current.label}</span>
        <ChevronDown size={14} color={theme.mutedDim} style={{ marginLeft: "4px", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
      </button>
      {open && (
        <>
          <div style={styles.dropdownBackdrop} onClick={() => setOpen(false)} />
          <div style={styles.dropdownPanel}>
            {includeAll && (
              <button
                style={{ ...styles.dropdownOption, ...(value === "all" ? styles.dropdownOptionActive : {}) }}
                onClick={() => { onChange("all"); setOpen(false); }}
              >
                <span style={styles.dropdownOptionLabel}>All categories</span>
                {value === "all" && <Check size={14} color={theme.purpleBright} />}
              </button>
            )}
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                style={{ ...styles.dropdownOption, ...(value === key ? styles.dropdownOptionActive : {}) }}
                onClick={() => { onChange(key); setOpen(false); }}
              >
                <meta.Icon size={14} color={meta.color} />
                <span style={styles.dropdownOptionLabel}>{meta.label}</span>
                {value === key && <Check size={14} color={theme.purpleBright} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function JournalView({ apiBase }) {
  const [entries, setEntries] = useState([]);
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [composeCategory, setComposeCategory] = useState("other");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [activePrompt, setActivePrompt] = useState(null);

  const loadEntries = useCallback(() => {
    axios.get(`${apiBase}/api/journal`)
      .then((res) => setEntries(res.data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoaded(true));
  }, [apiBase]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const showRandomPrompt = () => {
    const random = WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
    setActivePrompt(random);
  };

  const saveEntry = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${apiBase}/api/journal`, { text: draft.trim(), category: composeCategory, subject: subject.trim() });
      setDraft("");
      setSubject("");
      setComposeCategory("other");
      setActivePrompt(null);
      loadEntries();
    } catch (err) {
      console.error("Journal save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (id, currentlyArchived) => {
    try {
      await axios.patch(`${apiBase}/api/journal/${id}/archive`, { archived: !currentlyArchived });
      loadEntries();
    } catch (err) {
      console.error("Archive toggle failed:", err);
    }
  };

  const deleteEntry = async (id) => {
    const confirmed = window.confirm("Delete this entry permanently? This can't be undone.");
    if (!confirmed) return;
    try {
      await axios.delete(`${apiBase}/api/journal/${id}`);
      loadEntries();
    } catch (err) {
      console.error("Delete entry failed:", err);
    }
  };

  const visible = entries
    .filter((e) => !!e.archived === showArchived)
    .filter((e) => categoryFilter === "all" || e.category === categoryFilter)
    .reverse();

  return (
    <div style={styles.wrap}>
      <div style={styles.layout}>
        <div style={styles.composerColumn}>
          <h1 style={styles.title}>Journal</h1>
          <p style={styles.sub}>
            Private writing space. A.R.I.A can talk with you about anything here if you bring it up — she won't raise it on her own.
          </p>

          {activePrompt && (
            <div style={styles.promptBox}>
              <Sparkles size={14} color={theme.purpleBright} />
              <span style={styles.promptText}>{activePrompt}</span>
            </div>
          )}

          <div style={styles.composer}>
            <input
              style={styles.subjectInput}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
            />
            <textarea
              style={styles.textarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write whatever you need to get out…"
              rows={8}
            />
            <div style={styles.composerFooter}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <CategoryDropdown value={composeCategory} onChange={setComposeCategory} includeAll={false} />
                <button style={styles.promptButton} onClick={showRandomPrompt}>
                  <Sparkles size={13} /> Need a prompt?
                </button>
              </div>
              <button style={styles.saveButton} onClick={saveEntry} disabled={saving || !draft.trim()}>
                {saving ? "Saving…" : "Save entry"}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.entriesColumn}>
          <div style={styles.controlsRow}>
            <CategoryDropdown value={categoryFilter} onChange={setCategoryFilter} includeAll={true} />
            <button
              style={{ ...styles.archiveToggle, ...(showArchived ? styles.archiveToggleActive : {}) }}
              onClick={() => setShowArchived((s) => !s)}
            >
              {showArchived ? "Showing archived" : "Show archived"}
            </button>
          </div>

          {loaded && visible.length === 0 && (
            <p style={styles.emptyState}>
              {showArchived ? "No archived entries." : "Nothing here yet — your first one starts on the left."}
            </p>
          )}

          <div style={styles.entryGrid}>
            {visible.map((entry) => {
              const meta = CATEGORY_META[entry.category] || CATEGORY_META.other;
              const CategoryIcon = meta.Icon;
              return (
                <div key={entry.id} style={styles.entryCard}>
                  <div style={styles.entryHeader}>
                    <div style={{ ...styles.categoryChip, color: meta.color, borderColor: meta.color }}>
                      <CategoryIcon size={12} />
                      {meta.label}
                    </div>
                    <div style={styles.entryActions}>
                      <button style={styles.iconButton} onClick={() => toggleArchive(entry.id, entry.archived)} title={entry.archived ? "Unarchive" : "Archive"}>
                        {entry.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                      </button>
                      <button style={styles.iconButton} onClick={() => deleteEntry(entry.id)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div style={styles.entryDate}>
                    {new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  {entry.subject && <div style={styles.entrySubject}>{entry.subject}</div>}
                  <p style={styles.entryText}>{entry.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "1040px", width: "100%", boxSizing: "border-box" },
  layout: { display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" },
  composerColumn: { flex: "1 1 340px", minWidth: "300px", position: "sticky", top: "0" },
  entriesColumn: { flex: "2 1 480px", minWidth: "300px" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "16px", lineHeight: 1.5 },
  promptBox: {
    display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", marginBottom: "12px",
    borderRadius: "12px", backgroundColor: "rgba(155,107,255,0.1)", border: `1px solid ${theme.border}`
  },
  promptText: { color: theme.cream, fontSize: "13px", fontStyle: "italic" },
  composer: {
    backgroundColor: theme.panel, border: `1px solid ${theme.border}`, borderRadius: "16px",
    padding: "16px", display: "flex", flexDirection: "column", gap: "10px"
  },
  subjectInput: {
    background: "transparent", border: "none", outline: "none", borderBottom: `1px solid ${theme.border}`,
    color: theme.cream, fontFamily: theme.serif, fontSize: "16px", fontWeight: 600, padding: "4px 2px 10px"
  },
  textarea: {
    resize: "vertical", backgroundColor: "transparent", border: "none", outline: "none",
    color: theme.cream, fontSize: "15px", lineHeight: 1.6, fontFamily: theme.sans, minHeight: "160px"
  },
  composerFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  promptButton: {
    display: "flex", alignItems: "center", gap: "6px", padding: "9px 12px", borderRadius: "10px",
    border: `1px solid ${theme.border}`, backgroundColor: "transparent", color: theme.muted, fontSize: "12px", cursor: "pointer"
  },
  saveButton: {
    padding: "10px 20px",
    background: `linear-gradient(135deg, ${theme.rose}, ${theme.roseDeep})`,
    color: "#1c0f12", fontWeight: 600, border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px"
  },
  controlsRow: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "18px", alignItems: "center" },
  dropdownWrap: { position: "relative" },
  dropdownButton: {
    display: "flex", alignItems: "center", gap: "8px", padding: "9px 14px", borderRadius: "10px",
    border: `1px solid ${theme.border}`, backgroundColor: theme.bgElevated, color: theme.cream,
    fontSize: "13px", cursor: "pointer"
  },
  dropdownBackdrop: { position: "fixed", inset: 0, zIndex: 40 },
  dropdownPanel: {
    position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: "180px", zIndex: 50,
    backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: "12px",
    padding: "6px", boxShadow: "0 12px 28px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", gap: "2px",
    maxHeight: "260px", overflowY: "auto"
  },
  dropdownOption: {
    display: "flex", alignItems: "center", gap: "9px", padding: "8px 10px", borderRadius: "8px",
    border: "none", backgroundColor: "transparent", cursor: "pointer", textAlign: "left"
  },
  dropdownOptionActive: { backgroundColor: "rgba(155,107,255,0.12)" },
  dropdownOptionLabel: { color: theme.cream, fontSize: "13px", flex: 1 },
  archiveToggle: {
    padding: "8px 14px", borderRadius: "999px", border: `1px solid ${theme.border}`,
    backgroundColor: "transparent", color: theme.muted, fontSize: "13px", cursor: "pointer"
  },
  archiveToggleActive: { backgroundColor: theme.bgElevated, color: theme.purpleBright, borderColor: theme.purple },
  emptyState: { color: theme.mutedDim, fontSize: "13px" },
  entryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" },
  entryCard: {
    backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    borderRadius: "14px", padding: "16px 18px"
  },
  entryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  categoryChip: {
    fontSize: "11px", padding: "3px 10px", borderRadius: "999px", border: "1px solid",
    display: "inline-flex", alignItems: "center", gap: "5px", letterSpacing: "0.3px"
  },
  entryActions: { display: "flex", gap: "4px" },
  iconButton: {
    background: "transparent", border: "none", cursor: "pointer", display: "flex",
    padding: "5px", borderRadius: "6px", color: theme.mutedDim
  },
  entryDate: { color: theme.mutedDim, fontSize: "11px", letterSpacing: "0.5px", marginBottom: "8px", textTransform: "uppercase" },
  entrySubject: { fontFamily: theme.serif, fontWeight: 700, fontSize: "15px", color: theme.cream, marginBottom: "6px" },
  entryText: { color: theme.cream, fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }
};

export default JournalView;