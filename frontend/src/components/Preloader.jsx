import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { theme } from "../theme";

function Preloader({ onDone }) {
  const [reduceMotion] = useState(() =>
    typeof window !== "undefined" && (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.body.classList.contains("reduce-motion")
    )
  );
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduceMotion) {
      onDone();
      return;
    }

    let raf;
    const start = Date.now();
    const duration = 1300;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setPercent(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setVisible(false), 250);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && !reduceMotion && (
        <motion.div
          style={styles.overlay}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            style={styles.orbDot}
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div style={{ ...styles.percent, ...theme.gradientText }}>{percent}%</div>
          <div style={styles.label}>WAKING A.R.I.A</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, backgroundColor: theme.bg, zIndex: 500,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px"
  },
  orbDot: {
    width: "54px", height: "54px", borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, var(--accent-teal), var(--accent-purple) 60%, var(--accent-rose) 100%)`,
    boxShadow: "0 0 40px 10px rgba(155,107,255,0.35)"
  },
  percent: { fontFamily: theme.serif, fontWeight: 700, fontSize: "26px" },
  label: { fontSize: "11px", letterSpacing: "3px", color: theme.mutedDim }
};

export default Preloader;