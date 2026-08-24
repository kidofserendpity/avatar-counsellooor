import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { theme } from "../theme";

const PHASES = [
  { label: "Breathe in", duration: 4000 },
  { label: "Hold", duration: 4000 },
  { label: "Breathe out", duration: 4000 },
  { label: "Hold", duration: 4000 }
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

function BreatheView() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      setPhaseIndex((i) => (i + 1) % PHASES.length);
    }, PHASES[phaseIndex].duration);
    return () => clearTimeout(timer);
  }, [running, phaseIndex]);

  const scale = phaseIndex === 0 || phaseIndex === 1 ? 1.3 : 1;
  const glow = phaseIndex === 0 || phaseIndex === 1 ? 34 : 20;

  return (
    <motion.div
      style={styles.wrap}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      <motion.h1 variants={fadeUp} style={styles.title}>Breathe</motion.h1>
      <motion.p variants={fadeUp} style={styles.sub}>A slow box-breathing pattern — four seconds in, hold, four out, hold.</motion.p>

      <motion.div variants={fadeUp} style={styles.stage}>
        <motion.div
          style={styles.circle}
          animate={{ scale, boxShadow: `0 0 ${glow * 3}px ${glow}px rgba(94,234,212,0.25)` }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.p
        key={running ? PHASES[phaseIndex].label : "idle"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={styles.phaseLabel}
      >
        {running ? PHASES[phaseIndex].label : "Ready when you are"}
      </motion.p>

      <motion.button
        variants={fadeUp}
        style={styles.startButton}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setRunning((r) => !r)}
      >
        {running ? "Stop" : "Start"}
      </motion.button>
    </motion.div>
  );
}

const styles = {
  wrap: { maxWidth: "600px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  title: { fontFamily: theme.serif, fontSize: "30px", color: theme.cream, margin: 0, alignSelf: "flex-start" },
  sub: { color: theme.muted, fontSize: "14px", marginTop: "6px", marginBottom: "40px", alignSelf: "flex-start" },
  stage: { width: "220px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" },
  circle: {
    width: "140px", height: "140px", borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, ${theme.teal}, ${theme.purple} 70%)`
  },
  phaseLabel: { color: theme.cream, fontSize: "16px", marginBottom: "24px", letterSpacing: "0.5px" },
  startButton: {
    padding: "12px 32px", borderRadius: "999px", border: "none",
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`,
    color: "#120e1c", fontWeight: 600, fontSize: "15px", cursor: "pointer"
  }
};

export default BreatheView;