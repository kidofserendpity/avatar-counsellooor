import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Mic, BookOpen, History, BarChart3, Settings } from "lucide-react";
import { theme } from "../theme";

const NAV_ITEMS = [
  { id: "home", label: "Home", Icon: Home },
  { id: "talk", label: "Talk", Icon: Mic },
  { id: "journal", label: "Journal", Icon: BookOpen },
  { id: "history", label: "History", Icon: History },
  { id: "insights", label: "Insights", Icon: BarChart3 },
  { id: "settings", label: "Settings", Icon: Settings }
];

function DockItem({ id, label, Icon, active, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: relX * 0.25, y: relY * 0.25 });
  };

  return (
    <div
      style={styles.itemWrap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setOffset({ x: 0, y: 0 }); }}
      onMouseMove={handleMove}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            style={styles.tooltip}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
        onClick={() => onNavigate(id)}
        animate={{ x: offset.x, y: offset.y, scale: hovered ? 1.12 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <Icon size={18} strokeWidth={2} />
      </motion.button>
    </div>
  );
}

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside style={styles.dock}>
      <div style={styles.brandDot} />
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <DockItem key={id} id={id} label={label} Icon={Icon} active={activeView === id} onNavigate={onNavigate} />
        ))}
      </nav>
    </aside>
  );
}

const styles = {
  dock: {
    position: "fixed", left: "22px", top: "50%", transform: "translateY(-50%)", zIndex: 50,
    display: "flex", flexDirection: "column", alignItems: "center", gap: "18px",
    padding: "20px 12px", borderRadius: "28px",
    backgroundColor: theme.panel, backdropFilter: "blur(14px)",
    border: `1px solid ${theme.border}`, boxShadow: "0 12px 40px rgba(0,0,0,0.35)"
  },
  brandDot: {
    width: "14px", height: "14px", borderRadius: "50%",
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`,
    boxShadow: `0 0 14px 3px rgba(155,107,255,0.5)`, marginBottom: "6px"
  },
  nav: { display: "flex", flexDirection: "column", gap: "6px" },
  itemWrap: { position: "relative", display: "flex", alignItems: "center" },
  tooltip: {
    position: "absolute", left: "calc(100% + 12px)", whiteSpace: "nowrap",
    backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    padding: "5px 10px", borderRadius: "8px", fontSize: "12px", color: theme.cream,
    pointerEvents: "none"
  },
  navItem: {
    width: "42px", height: "42px", borderRadius: "14px", border: "none",
    background: "transparent", color: theme.muted,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
  },
  navItemActive: {
    backgroundColor: "rgba(155,107,255,0.18)", color: theme.purpleBright,
    boxShadow: `0 0 0 1px rgba(155,107,255,0.3)`
  }
};

export default Sidebar;