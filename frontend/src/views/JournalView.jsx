import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Lightbulb, Heart, Flame, Target, Moon, Image, CloudRain, FileText, Archive, ArchiveRestore, Trash2 } from "lucide-react";
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

function JournalView({ apiBase }) {
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const loadEntries = useCallback(() => {
    axios.get(`${apiBase}/api/journal`)
      .then((res) => setEntries(res.data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoaded(true));
  }, [apiBase]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const saveEntry = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${apiBase}/api/journal`, { text: draft.trim() });
      setDraft("");
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
      <h1 style={styles.title}>Journal</h1>
      <p style={styles.sub}>
        Private writing space. A.R.I.A can talk with you about anything here if you bring it up — she won't raise it on her own.
      </p>

      <div style={styles.composer}>
        <textarea
          style={styles.textarea}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write whatever you need to get out…"
          rows={6}
        />
        <button style={styles.saveButton} onClick={saveEntry} disabled={saving || !draft.trim()}>
          {saving ? "Saving…" : "Save entry"}
        </button>
      </div>

      <div style={styles.controlsRow}>
        <select style={styles.filterSelect} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <button
          style={{ ...styles.archiveToggle, ...(showArchived ? styles.archiveToggleActive : {}) }}
          onClick={() => setShowArchived((s) => !s)}
        >
          {showArchived ? "Showing archived" : "Show archived"}
        </button>
      </div>

      {loaded && visible.length === 0 && (
        <p style={styles.emptyState}>
          {showArchived ? "No archived entries." : "Nothing here yet — your first one starts the page above."}
        </p>
      )}

      <div style={styles.entryList}>
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
              <p style={styles.entryText}>{entry.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "700px" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "24px", lineHeight: 1.5 },
  composer: {
    backgroundColor: theme.panel, border: `1px solid ${theme.border}`, borderRadius: "16px",
    padding: "16px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px"
  },
  textarea: {
    resize: "vertical", backgroundColor: "transparent", border: "none", outline: "none",
    color: theme.cream, fontSize: "15px", lineHeight: 1.6, fontFamily: theme.sans, minHeight: "120px"
  },
  saveButton: {
    alignSelf: "flex-end", padding: "10px 20px",
    background: `linear-gradient(135deg, ${theme.rose}, ${theme.roseDeep})`,
    color: "#1c0f12", fontWeight: 600, border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px"
  },
  controlsRow: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px", alignItems: "center" },
  filterSelect: {
    padding: "8px 12px", borderRadius: "10px", border: `1px solid ${theme.border}`,
    backgroundColor: theme.bgElevated, color: theme.cream, fontSize: "13px"
  },
  archiveToggle: {
    padding: "8px 14px", borderRadius: "999px", border: `1px solid ${theme.border}`,
    backgroundColor: "transparent", color: theme.muted, fontSize: "13px", cursor: "pointer"
  },
  archiveToggleActive: { backgroundColor: theme.bgElevated, color: theme.purpleBright, borderColor: theme.purple },
  emptyState: { color: theme.mutedDim, fontSize: "13px" },
  entryList: { display: "flex", flexDirection: "column", gap: "12px" },
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
  entryText: { color: theme.cream, fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }
};

export default JournalView;