import { Home, Mic, BookOpen, BarChart3, Settings } from "lucide-react";
import { theme } from "../theme";

const NAV_ITEMS = [
  { id: "home", label: "Home", Icon: Home },
  { id: "talk", label: "Talk", Icon: Mic },
  { id: "journal", label: "Journal", Icon: BookOpen },
  { id: "insights", label: "Insights", Icon: BarChart3 },
  { id: "settings", label: "Settings", Icon: Settings }
];

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside style={styles.sidebar}>
      <div style={{ ...styles.brand, ...theme.gradientText }}>A.R.I.A</div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            style={{ ...styles.navItem, ...(activeView === id ? styles.navItemActive : {}) }}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>
      <div style={styles.footer}>a space that's actually yours</div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "220px", minWidth: "220px", height: "100vh", backgroundColor: theme.bgElevated,
    borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column",
    padding: "28px 16px", boxSizing: "border-box", position: "sticky", top: 0, zIndex: 1
  },
  brand: { fontFamily: theme.serif, fontWeight: 700, fontSize: "24px", letterSpacing: "1px", marginBottom: "32px", paddingLeft: "10px" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "10px",
    border: "none", background: "transparent", color: theme.muted, fontSize: "14px",
    cursor: "pointer", textAlign: "left", transition: "all 0.2s ease"
  },
  navItemActive: { backgroundColor: "rgba(155,107,255,0.14)", color: theme.purpleBright },
  footer: { fontSize: "12px", color: theme.mutedDim, paddingLeft: "10px" }
};

export default Sidebar;