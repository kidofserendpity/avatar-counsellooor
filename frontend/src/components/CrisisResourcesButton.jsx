import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { LifeBuoy, X } from "lucide-react";
import { theme } from "../theme";

const POSITION_KEY = "aria-crisis-button-pos";
const BUTTON_SIZE = 40;
const DRAG_MOVE_THRESHOLD = 6;

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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function CrisisResourcesButton() {
  const [open, setOpen] = useState(false);
  const movedRef = useRef(false);

  const initial = getStoredPosition() || { x: window.innerWidth - BUTTON_SIZE - 16, y: 16 };
  const x = useMotionValue(clamp(initial.x, 8, window.innerWidth - BUTTON_SIZE - 8));
  const y = useMotionValue(clamp(initial.y, 8, window.innerHeight - BUTTON_SIZE - 8));

  useEffect(() => {
    const handleResize = () => {
      x.set(clamp(x.get(), 8, window.innerWidth - BUTTON_SIZE - 8));
      y.set(clamp(y.get(), 8, window.innerHeight - BUTTON_SIZE - 8));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistPosition = () => {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0.15}
        style={{ ...styles.trigger, x, y }}
        onDragStart={() => { movedRef.current = false; }}
        onDrag={(_, info) => {
          if (Math.abs(info.offset.x) > DRAG_MOVE_THRESHOLD || Math.abs(info.offset.y) > DRAG_MOVE_THRESHOLD) {
            movedRef.current = true;
          }
        }}
        onDragEnd={() => {
          const clampedX = clamp(x.get(), 8, window.innerWidth - BUTTON_SIZE - 8);
          const clampedY = clamp(y.get(), 8, window.innerHeight - BUTTON_SIZE - 8);
          animate(x, clampedX, { type: "spring", stiffness: 400, damping: 30 });
          animate(y, clampedY, { type: "spring", stiffness: 400, damping: 30 });
          persistPosition();
          if (!movedRef.current) setOpen(true);
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        title="Need support right now? Drag to move."
      >
        <motion.div
          style={styles.pulseRing}
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        <LifeBuoy size={18} color={theme.purpleBright} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            style={styles.overlay}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={styles.card}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const styles = {
  trigger: {
    position: "fixed", top: 0, left: 0, zIndex: 150,
    width: `${BUTTON_SIZE}px`, height: `${BUTTON_SIZE}px`, borderRadius: "50%",
    border: `1px solid ${theme.border}`, backgroundColor: theme.bgElevated,
    display: "flex", alignItems: "center", justifyContent: "center",
    touchAction: "none", userSelect: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.3)"
  },
  pulseRing: {
    position: "absolute", inset: 0, borderRadius: "50%",
    border: `1.5px solid ${theme.purple}`, pointerEvents: "none"
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