import { useState, useRef, useEffect } from "react";
import { LifeBuoy, X } from "lucide-react";
import { theme } from "../theme";

const POSITION_KEY = "aria-crisis-button-pos";
const BUTTON_SIZE = 40;
const DRAG_THRESHOLD = 6;

function getStoredPosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function clampPosition(x, y) {
  const maxX = window.innerWidth - BUTTON_SIZE - 8;
  const maxY = window.innerHeight - BUTTON_SIZE - 8;
  return {
    x: Math.min(Math.max(x, 8), Math.max(maxX, 8)),
    y: Math.min(Math.max(y, 8), Math.max(maxY, 8))
  };
}

function CrisisResourcesButton() {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    const stored = getStoredPosition();
    if (stored) return clampPosition(stored.x, stored.y);
    return clampPosition(window.innerWidth - BUTTON_SIZE - 16, 16);
  });
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      movedRef.current = true;
    }
    setPosition(clampPosition(startRef.current.posX + dx, startRef.current.posY + dy));
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    setPosition((prev) => {
      try {
        localStorage.setItem(POSITION_KEY, JSON.stringify(prev));
      } catch {
        // ignore
      }
      return prev;
    });
    if (!movedRef.current) {
      setOpen(true);
    }
  };

  const handlePointerDown = (e) => {
    draggingRef.current = true;
    movedRef.current = false;
    setIsDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <>
      <button
        style={{
          ...styles.trigger,
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
          animation: isDragging ? "none" : "crisisButtonPulse 3s ease-in-out infinite"
        }}
        onPointerDown={handlePointerDown}
        title="Need support right now? Drag to move."
      >
        <LifeBuoy size={18} color={theme.purpleBright} />
      </button>

      {open && (
        <div style={styles.overlay} onClick={() => setOpen(false)}>
          <div style={styles.card} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setOpen(false)}><X size={16} /></button>
            <div style={styles.headerRow}>
              <LifeBuoy size={20} color={theme.purpleBright} />
              <div style={styles.title}>Support, any time</div>
            </div>
            <p style={styles.body}>
              If things ever feel like too much, whether that is right now or just sometime, for you or someone you know, MANI (Mentally Aware Nigeria Initiative) offers free, confidential support.
            </p>
            <div style={styles.contactRow}>
              <span style={styles.contactLabel}>Call</span>
              <span style={styles.contactValue}>08091116264 / 08111680686</span>
            </div>
            <div style={styles.contactRow}>
              <span style={styles.contactLabel}>WhatsApp</span>
              <a style={styles.contactLink} href="https://wa.me/2349168417413" target="_blank" rel="noreferrer">wa.me/2349168417413</a>
            </div>
            <p style={styles.footer}>This is always here, whether or not you are in the middle of a hard moment.</p>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  trigger: {
    position: "fixed", zIndex: 150,
    width: `${BUTTON_SIZE}px`, height: `${BUTTON_SIZE}px`, borderRadius: "50%",
    border: `1px solid ${theme.border}`, backgroundColor: theme.bgElevated,
    display: "flex", alignItems: "center", justifyContent: "center",
    touchAction: "none", userSelect: "none"
  },
  overlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(11,10,16,0.7)", backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250, padding: "20px"
  },
  card: {
    position: "relative", backgroundColor: theme.bgElevated, border: `1px solid ${theme.border}`,
    borderRadius: "20px", padding: "28px", maxWidth: "380px", width: "100%", boxSizing: "border-box"
  },
  closeButton: {
    position: "absolute", top: "14px", right: "14px", background: "transparent", border: "none",
    color: theme.mutedDim, cursor: "pointer", display: "flex"
  },
  headerRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" },
  title: { fontFamily: theme.serif, fontSize: "19px", color: theme.cream },
  body: { color: theme.muted, fontSize: "14px", lineHeight: 1.6, marginBottom: "18px" },
  contactRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${theme.border}` },
  contactLabel: { color: theme.mutedDim, fontSize: "12px" },
  contactValue: { color: theme.cream, fontSize: "13px", fontWeight: 600 },
  contactLink: { color: theme.purpleBright, fontSize: "13px", fontWeight: 600, textDecoration: "none" },
  footer: { color: theme.mutedDim, fontSize: "12px", marginTop: "16px", textAlign: "center" }
};

export default CrisisResourcesButton;