import { theme } from "../theme";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "talk", label: "Talk", icon: "🎙️" },
  { id: "journal", label: "Journal", icon: "📓" },
  { id: "insights", label: "Insights", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" }
];

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>A.R.I.A</div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              ...styles.navItem,
              ...(activeView === item.id ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={styles.footer}>a space that's actually yours</div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "220px",
    minWidth: "220px",
    height: "100vh",
    backgroundColor: theme.bgElevated,
    borderRight: `1px solid ${theme.border}`,
    display: "flex",
    flexDirection: "column",
    padding: "28px 16px",
    boxSizing: "border-box",
    position: "sticky",
    top: 0
  },
  brand: {
    fontFamily: theme.serif,
    fontSize: "24px",
    color: theme.cream,
    marginBottom: "32px",
    paddingLeft: "10px"
  },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    color: theme.muted,
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease"
  },
  navItemActive: {
    backgroundColor: "rgba(155,107,255,0.14)",
    color: theme.purpleBright
  },
  navIcon: { fontSize: "16px" },
  footer: { fontSize: "12px", color: theme.mutedDim, paddingLeft: "10px" }
};

export default Sidebar;