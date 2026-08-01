import { Home, Mic, BookOpen, BarChart3, Settings } from "lucide-react";
import { theme } from "../theme";

const NAV_ITEMS = [
  { id: "home", label: "Home", Icon: Home },
  { id: "talk", label: "Talk", Icon: Mic },
  { id: "journal", label: "Journal", Icon: BookOpen },
  { id: "insights", label: "Insights", Icon: BarChart3 },
  { id: "settings", label: "Settings", Icon: Settings }
];

function BottomNav({ activeView, onNavigate }) {
  return (
    <nav style={styles.bar}>
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          style={{ ...styles.item, color: activeView === id ? theme.purpleBright : theme.muted }}
        >
          <Icon size={18} strokeWidth={2} />
          <span style={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}

const styles = {
  bar: {
    position: "fixed", bottom: 0, left: 0, right: 0, display: "flex",
    justifyContent: "space-around", backgroundColor: theme.bgElevated,
    borderTop: `1px solid ${theme.border}`, padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
    zIndex: 10
  },
  item: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px" },
  label: { fontSize: "10px" }
};

export default BottomNav;