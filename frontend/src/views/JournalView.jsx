import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { theme } from "../theme";

function JournalView({ apiBase }) {
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

  const sorted = [...entries].reverse();

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Journal</h1>
      <p style={styles.sub}>
        Private writing space. Aria can talk with you about anything here if you bring it up — she won't raise it on her own.
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

      <div style={styles.sectionLabel}>PAST ENTRIES</div>
      {loaded && sorted.length === 0 && (
        <p style={styles.emptyState}>No entries yet — your first one starts the page above.</p>
      )}
      <div style={styles.entryList}>
        {sorted.map((entry) => (
          <div key={entry.id} style={styles.entryCard}>
            <div style={styles.entryDate}>
              {new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </div>
            <p style={styles.entryText}>{entry.text}</p>
          </div>
        ))}
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
    padding: "16px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px"
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
  sectionLabel: { color: theme.mutedDim, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "12px" },
  emptyState: { color: theme.mutedDim, fontSize: "13px" },
  entryList: { display: "flex", flexDirection: "column", gap: "12px" },
  entryCard: {
    backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    borderRadius: "14px", padding: "16px 18px"
  },
  entryDate: { color: theme.mutedDim, fontSize: "11px", letterSpacing: "0.5px", marginBottom: "8px", textTransform: "uppercase" },
  entryText: { color: theme.cream, fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }
};

export default JournalView;