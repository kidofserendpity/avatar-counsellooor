import { useState } from "react";
import axios from "axios";
import { Search, MessageCircle } from "lucide-react";
import { theme } from "../theme";

function HistoryView({ apiBase }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const runSearch = async (q) => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/history`, { params: { q } });
      setResults(res.data.messages || []);
    } catch (err) {
      console.error("History search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>History</h1>
      <p style={styles.sub}>Look back on past conversations, or search for something specific you remember saying.</p>

      <form style={styles.searchRow} onSubmit={handleSearch}>
        <div style={styles.searchBox}>
          <Search size={16} color={theme.mutedDim} />
          <input
            style={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past conversations…"
          />
        </div>
        <button style={styles.searchButton} type="submit">Search</button>
        {query && (
          <button type="button" style={styles.clearButton} onClick={() => { setQuery(""); runSearch(""); }}>
            Clear
          </button>
        )}
      </form>

      {!loaded && (
        <p style={styles.emptyState}>Search above, or hit Search with nothing typed to see your most recent messages.</p>
      )}
      {loaded && !loading && results.length === 0 && (
        <p style={styles.emptyState}>Nothing matched that.</p>
      )}

      <div style={styles.resultList}>
        {results.map((msg, i) => (
          <div key={i} style={{ ...styles.resultCard, borderColor: msg.role === "user" ? theme.purple : theme.border }}>
            <div style={styles.resultHeader}>
              <MessageCircle size={13} color={msg.role === "user" ? theme.purpleBright : theme.teal} />
              <span style={styles.resultRole}>{msg.role === "user" ? "You" : "A.R.I.A"}</span>
              <span style={styles.resultDate}>{new Date(msg.timestamp).toLocaleString()}</span>
            </div>
            <p style={styles.resultText}>{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "760px", width: "100%", boxSizing: "border-box" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0 },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "22px" },
  searchRow: { display: "flex", gap: "10px", marginBottom: "22px", flexWrap: "wrap" },
  searchBox: {
    flex: 1, minWidth: "200px", display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 14px", borderRadius: "12px", border: `1px solid ${theme.border}`, backgroundColor: theme.bgElevated
  },
  searchInput: { flex: 1, background: "transparent", border: "none", outline: "none", color: theme.cream, fontSize: "14px" },
  searchButton: {
    padding: "10px 20px", borderRadius: "12px", border: "none",
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`, color: "#120e1c",
    fontWeight: 600, cursor: "pointer", fontSize: "14px"
  },
  clearButton: {
    padding: "10px 16px", borderRadius: "12px", border: `1px solid ${theme.border}`,
    backgroundColor: "transparent", color: theme.muted, cursor: "pointer", fontSize: "13px"
  },
  emptyState: { color: theme.mutedDim, fontSize: "13px" },
  resultList: { display: "flex", flexDirection: "column", gap: "10px" },
  resultCard: { backgroundColor: theme.bgElevated, border: "1px solid", borderRadius: "12px", padding: "14px 16px" },
  resultHeader: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" },
  resultRole: { color: theme.cream, fontSize: "12px", fontWeight: 700 },
  resultDate: { color: theme.mutedDim, fontSize: "11px", marginLeft: "auto" },
  resultText: { color: theme.cream, fontSize: "14px", lineHeight: 1.5, margin: 0 }
};

export default HistoryView;