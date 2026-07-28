import { theme } from "../theme";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "talk", label: "Talk", icon: "🎙️" },
  { id: "journal", label: "Journal", icon: "📓" },
  { id: "insights", label: "Insights", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" }
];

function BottomNav({ activeView, onNavigate }) {
  return (
    <nav style={styles.bar}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{ ...styles.item, color: activeView === item.id ? theme.purpleBright : theme.muted }}
        >
          <span style={styles.icon}>{item.icon}</span>
          <span style={styles.label}>{item.label}</span>
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
  icon: { fontSize: "18px" },
  label: { fontSize: "10px" }
};

export default BottomNav;