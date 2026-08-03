import { useState } from "react";
import { LifeBuoy, X } from "lucide-react";
import { theme } from "../theme";

function CrisisResourcesButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button style={styles.trigger} onClick={() => setOpen(true)} title="Need support right now?">
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
              If things ever feel like too much — whether that's right now or just sometime, for you or someone you know — MANI (Mentally Aware Nigeria Initiative) offers free, confidential support.
            </p>
            <div style={styles.contactRow}>
              <span style={styles.contactLabel}>Call</span>
              <span style={styles.contactValue}>08091116264 / 08111680686</span>
            </div>
            <div style={styles.contactRow}>
              <span style={styles.contactLabel}>WhatsApp</span>
              <a style={styles.contactLink} href="https://wa.me/2349168417413" target="_blank" rel="noreferrer">wa.me/2349168417413</a>
            </div>
            <p style={styles.footer}>This is always here, whether or not you're in the middle of a hard moment.</p>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  trigger: {
    position: "fixed", top: "16px", right: "16px", zIndex: 150,
    width: "38px", height: "38px", borderRadius: "50%", border: `1px solid ${theme.border}`,
    backgroundColor: theme.bgElevated, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.3)"
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