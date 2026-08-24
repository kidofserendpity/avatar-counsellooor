import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { Search, MessageCircle } from "lucide-react";
import { theme } from "../theme";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

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
    <motion.div
      style={styles.wrap}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      <motion.h1 variants={fadeUp} style={styles.title}>History</motion.h1>
      <motion.p variants={fadeUp} style={styles.sub}>Look back on past conversations, or search for something specific you remember saying.</motion.p>

      <motion.form variants={fadeUp} style={styles.searchRow} onSubmit={handleSearch}>
        <div style={styles.searchBox}>
          <Search size={16} color={theme.mutedDim} />
          <input
            style={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past conversations…"
          />
        </div>
        <motion.button style={styles.searchButton} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit">
          Search
        </motion.button>
        {query && (
          <motion.button
            type="button"
            style={styles.clearButton}
            whileHover={{ borderColor: theme.purple, color: theme.purpleBright }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setQuery(""); runSearch(""); }}
          >
            Clear
          </motion.button>
        )}
      </motion.form>

      {!loaded && (
        <motion.p variants={fadeUp} style={styles.emptyState}>Search above, or hit Search with nothing typed to see your most recent messages.</motion.p>
      )}
      {loaded && !loading && results.length === 0 && (
        <motion.p variants={fadeUp} style={styles.emptyState}>Nothing matched that.</motion.p>
      )}

      <motion.div
        style={styles.resultList}
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        <AnimatePresence>
          {results.map((msg, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              style={{ ...styles.resultCard, borderColor: msg.role === "user" ? theme.purple : theme.border }}
            >
              <div style={styles.resultHeader}>
                <MessageCircle size={13} color={msg.role === "user" ? theme.purpleBright : theme.teal} />
                <span style={styles.resultRole}>{msg.role === "user" ? "You" : "A.R.I.A"}</span>
                <span style={styles.resultDate}>{new Date(msg.timestamp).toLocaleString()}</span>
              </div>
              <p style={styles.resultText}>{msg.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
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