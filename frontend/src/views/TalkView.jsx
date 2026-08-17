import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, Square, Camera, Send } from "lucide-react";
import { theme } from "../theme";
import { useIsMobile } from "../hooks/useIsMobile";

const SENTIMENT_FILTER = {
  calm: "saturate(1) brightness(1) hue-rotate(0deg)",
  hopeful: "saturate(1.2) brightness(1.08) hue-rotate(15deg)",
  anxious: "saturate(0.65) brightness(0.9) hue-rotate(-20deg)",
  sad: "saturate(0.7) brightness(0.85) hue-rotate(-35deg)",
  angry: "saturate(1.15) brightness(0.92) hue-rotate(-55deg)"
};

const GLOW_BY_STATE = {
  speaking: `0 0 70px 26px rgba(155,107,255,0.5), 0 0 120px 46px rgba(94,234,212,0.28)`,
  listening: `0 0 55px 20px rgba(155,107,255,0.42)`,
  thinking: `0 0 40px 14px rgba(155,107,255,0.28)`,
  seeing: `0 0 60px 20px rgba(94,234,212,0.4), 0 0 26px 8px rgba(155,107,255,0.3)`,
  idle: `0 0 30px 8px rgba(155,107,255,0.18)`
};

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function TalkView({
  message, setMessage, conversation, loading, recording, sentiment, speaking,
  sendMessage, startRecording, stopRecording, liveMode, onToggleLive,
  imageLoading, sendImage, onStopAria
}) {
  const isMobile = useIsMobile();
  const [showTranscript, setShowTranscript] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [absorbPreview, setAbsorbPreview] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const videoRef = useRef(null);
  const video2Ref = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const orbSize = isMobile ? 240 : 400;

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const v1 = videoRef.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    v2.currentTime = 0;
    v2.style.opacity = 0;

    const handleTimeUpdate = () => {
      const timeLeft = v1.duration - v1.currentTime;
      if (timeLeft <= 1.5 && v2.paused) {
        v2.currentTime = 0;
        v2.play();
        let opacity = 0;
        const fade = setInterval(() => {
          opacity += 0.05;
          v2.style.opacity = Math.min(opacity, 1);
          v1.style.opacity = Math.max(1 - opacity, 0);
          if (opacity >= 1) {
            clearInterval(fade);
            v1.style.opacity = 0;
            v2.style.opacity = 1;
            v1.currentTime = 0;
            v1.play();
          }
        }, 50);
      }
    };

    v1.addEventListener("timeupdate", handleTimeUpdate);
    v1.play();

    return () => v1.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  useEffect(() => {
    const v1 = videoRef.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;
    v1.playbackRate = speaking ? 1.8 : 1.0;
    v2.playbackRate = speaking ? 1.8 : 1.0;
  }, [speaking]);

  useEffect(() => {
    if (showTranscript && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, loading, showTranscript]);

  const handleFiles = (files) => {
    const file = files && files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const previewUrl = URL.createObjectURL(file);
    const caption = message.trim();
    setAbsorbPreview({ url: previewUrl, key: Date.now(), file, caption });
    setMessage("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleOrbTap = () => {
    if (recording) {
      stopRecording();
    } else if (!loading && !imageLoading) {
      startRecording(false);
    }
  };

  const orbState = imageLoading ? "seeing" : speaking ? "speaking" : recording ? "listening" : loading ? "thinking" : "idle";
  const orbAnimation =
    orbState === "idle" ? "orbBreathe 4.5s ease-in-out infinite" :
    orbState === "thinking" ? "orbThink 1.4s ease-in-out infinite" :
    orbState === "seeing" ? "orbSee 1s ease-in-out infinite" : "none";

  const liveStatusLabel = !liveMode
    ? null
    : recording ? "Live — listening"
    : loading ? "Live — musing"
    : speaking ? "Live — A.R.I.A's speaking"
    : "Live — waiting";

  const canInterrupt = speaking || loading;

  return (
    <div style={styles.stage} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          {!liveMode && <span style={styles.elapsed}>{formatElapsed(elapsed)}</span>}
        </div>
        <div style={styles.topBarRight}>
          <div style={styles.liveToggleWrap}>
            <span style={styles.liveToggleLabel}>Live</span>
            <button
              style={{ ...styles.toggle, backgroundColor: liveMode ? theme.purple : "rgba(255,255,255,0.08)" }}
              onClick={() => onToggleLive(!liveMode)}
            >
              <span style={{ ...styles.toggleDot, transform: liveMode ? "translateX(18px)" : "translateX(0)" }} />
            </button>
          </div>
          <button style={styles.transcriptToggle} onClick={() => setShowTranscript((s) => !s)}>
            {showTranscript ? "Hide chat" : "Show chat"}
          </button>
        </div>
      </div>

      <div style={styles.orbArea}>
        <div
          style={{ ...styles.orbStage, width: `${orbSize}px`, height: `${orbSize}px`, cursor: "pointer" }}
          onClick={handleOrbTap}
        >
          <div
            style={{
              ...styles.orbRing,
              filter: speaking ? "none" : SENTIMENT_FILTER[sentiment] || "none",
              boxShadow: GLOW_BY_STATE[orbState],
              transform: speaking ? "scale(1.05)" : "scale(1)",
              animation: orbAnimation,
              transition: "box-shadow 0.8s ease-in-out, transform 0.8s ease-in-out"
            }}
          >
            <video ref={videoRef} muted playsInline loop={false}
              style={{ ...styles.orbVideo, filter: speaking ? "brightness(1.25) saturate(1.3)" : "brightness(1) saturate(1)", transition: "filter 0.4s ease" }}>
              <source src="/orb.webm" type="video/webm" />
              <source src="/orb.mp4" type="video/mp4" />
            </video>
            <video ref={video2Ref} muted playsInline loop={false}
              style={{ ...styles.orbVideo, position: "absolute", top: 0, left: 0, opacity: 0 }}>
              <source src="/orb.webm" type="video/webm" />
              <source src="/orb.mp4" type="video/mp4" />
            </video>
          </div>
          {orbState === "listening" && <div style={styles.listenRing} />}
          {speaking && <div style={styles.pulseRing} />}
          {dragActive && <div style={styles.dragRing} />}
          {dragActive && <p style={styles.dragLabel}>Drop to show A.R.I.A</p>}
          {absorbPreview && (
            <motion.img
              key={absorbPreview.key}
              src={absorbPreview.url}
              alt="Sending to A.R.I.A"
              style={styles.absorbImage}
              initial={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
              animate={{ scale: 0.05, y: 60, rotate: 12, opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeIn" }}
              onAnimationComplete={() => {
                sendImage(absorbPreview.file, absorbPreview.caption);
                setAbsorbPreview(null);
              }}
            />
          )}
        </div>

        <p style={styles.stateLabel}>
          {liveStatusLabel || (imageLoading ? "Looking at that…" : recording ? "Listening…" : loading ? "Musing…" : speaking ? "Speaking…" : "Tap the orb to speak")}
        </p>

        {canInterrupt && (
          <button style={styles.stopButton} onClick={onStopAria}>
            <Square size={11} fill="currentColor" /> Stop
          </button>
        )}
      </div>

      {!liveMode && (
        <motion.div
          style={styles.inputBar}
          animate={{
            boxShadow: inputFocused
              ? "0 0 0 1px rgba(155,107,255,0.55), 0 0 26px 4px rgba(155,107,255,0.28)"
              : "0 0 0 0px rgba(155,107,255,0), 0 0 0px 0px rgba(155,107,255,0)"
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <button style={styles.pillIconButton} onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} color={theme.muted} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            style={styles.pillInput}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Say anything…"
          />
          <button
            style={{ ...styles.pillIconButton, backgroundColor: recording ? theme.crisis : "transparent" }}
            onClick={recording ? stopRecording : () => startRecording(false)}
          >
            {recording ? <Square size={15} color="#fff" fill="#fff" /> : <Mic size={16} color={theme.muted} />}
          </button>
          <button style={styles.pillSendButton} onClick={() => sendMessage()}>
            <Send size={15} color="#120e1c" />
          </button>
        </motion.div>
      )}

      {showTranscript && (
        <div style={{ ...styles.transcriptPanel, ...(isMobile ? styles.transcriptPanelMobile : styles.transcriptPanelDesktop) }}>
          {conversation.length === 0 && !loading && (
            <p style={styles.emptyState}>Nothing here yet, say whatever's on your mind, or drop a photo on the orb.</p>
          )}
          {conversation.map((msg, index) => (
            <div key={index} style={{
              ...styles.message,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.isCrisis ? theme.crisis
                : msg.role === "user" ? `linear-gradient(135deg, ${theme.purple}, ${theme.purpleDeep})`
                : theme.bgElevated
            }}>
              {msg.imageUrl && <img src={msg.imageUrl} alt="Shared" style={styles.messageImage} />}
              {msg.content && <p style={styles.messageText}>{msg.content}</p>}
            </div>
          ))}
          {(loading || imageLoading) && (
            <div style={{ ...styles.message, alignSelf: "flex-start", background: theme.bgElevated }}>
              <div style={styles.typingDots}>
                <span style={{ ...styles.typingDot, animationDelay: "0s" }} />
                <span style={{ ...styles.typingDot, animationDelay: "0.15s" }} />
                <span style={{ ...styles.typingDot, animationDelay: "0.3s" }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  );
}

const styles = {
  stage: {
    display: "flex", flexDirection: "column", width: "100%", height: "calc(100vh - 100px)",
    maxWidth: "900px", margin: "0 auto", boxSizing: "border-box", position: "relative"
  },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 4px" },
  topBarLeft: { minWidth: "40px" },
  elapsed: { fontSize: "11px", color: theme.mutedDim, fontFamily: "ui-monospace, Consolas, monospace" },
  topBarRight: { display: "flex", alignItems: "center", gap: "10px" },
  liveToggleWrap: { display: "flex", alignItems: "center", gap: "6px" },
  liveToggleLabel: { fontSize: "12px", color: theme.muted },
  toggle: {
    width: "36px", height: "20px", borderRadius: "999px", border: "none",
    cursor: "pointer", position: "relative", padding: "2px", transition: "background-color 0.2s ease"
  },
  toggleDot: {
    display: "block", width: "16px", height: "16px", borderRadius: "50%",
    backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "transform 0.2s ease"
  },
  transcriptToggle: {
    padding: "6px 13px", borderRadius: "999px", border: `1px solid ${theme.border}`,
    backgroundColor: "rgba(255,255,255,0.03)", color: theme.muted, fontSize: "11px", cursor: "pointer"
  },
  orbArea: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px"
  },
  orbStage: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  orbRing: { width: "88%", height: "88%", borderRadius: "50%", overflow: "hidden", position: "relative" },
  orbVideo: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" },
  listenRing: {
    position: "absolute", width: "88%", height: "88%", borderRadius: "50%",
    border: `2px solid ${theme.purple}`, animation: "orbListen 1.1s ease-out infinite"
  },
  pulseRing: {
    position: "absolute", width: "100%", height: "100%", borderRadius: "50%",
    border: `2px solid rgba(155,107,255,0.6)`, animation: "orbPulse 1.2s ease-out infinite"
  },
  dragRing: {
    position: "absolute", width: "104%", height: "104%", borderRadius: "50%",
    border: `2px dashed ${theme.purple}`, animation: "dragRingPulse 1.4s ease-in-out infinite",
    pointerEvents: "none"
  },
  dragLabel: {
    position: "absolute", bottom: "-6px", color: theme.purpleBright,
    fontSize: "12px", letterSpacing: "0.5px", pointerEvents: "none"
  },
  absorbImage: {
    position: "absolute", width: "110px", height: "110px", objectFit: "cover",
    borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    zIndex: 5, pointerEvents: "none"
  },
  stateLabel: { color: theme.mutedDim, fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" },
  stopButton: {
    display: "flex", alignItems: "center", gap: "6px", padding: "6px 16px",
    borderRadius: "999px", border: `1px solid ${theme.crisis}`,
    backgroundColor: "rgba(255,77,77,0.1)", color: "#ff8080", fontSize: "12px", cursor: "pointer"
  },
  inputBar: {
    display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px",
    borderRadius: "999px", backgroundColor: "rgba(21,19,32,0.55)", backdropFilter: "blur(10px)",
    border: `1px solid ${theme.border}`, margin: "0 auto", width: "100%", maxWidth: "560px", boxSizing: "border-box"
  },
  pillIconButton: {
    width: "34px", height: "34px", borderRadius: "50%", border: "none", backgroundColor: "transparent",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
  },
  pillInput: {
    flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
    color: theme.cream, fontSize: "14px", padding: "0 4px"
  },
  pillSendButton: {
    width: "34px", height: "34px", borderRadius: "50%", border: "none", flexShrink: 0,
    background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
  },
  transcriptPanel: {
    position: "fixed", zIndex: 60, display: "flex", flexDirection: "column", gap: "10px",
    overflowY: "auto", backgroundColor: theme.panel, backdropFilter: "blur(10px)",
    border: `1px solid ${theme.border}`, boxSizing: "border-box", animation: "panelSlideUp 0.25s ease"
  },
  transcriptPanelDesktop: { top: "90px", bottom: "110px", right: "20px", width: "320px", borderRadius: "16px", padding: "16px" },
  transcriptPanelMobile: { left: "12px", right: "12px", bottom: "84px", maxHeight: "45vh", borderRadius: "16px", padding: "14px" },
  emptyState: { color: theme.mutedDim, fontSize: "12px", textAlign: "center", margin: "auto" },
  message: { maxWidth: "88%", padding: "9px 12px", borderRadius: "12px", wordBreak: "break-word" },
  messageText: { color: theme.cream, margin: 0, lineHeight: "1.5", fontSize: "13px" },
  messageImage: { maxWidth: "180px", borderRadius: "10px", display: "block", marginBottom: "6px" },
  typingDots: { display: "flex", gap: "4px", padding: "2px 0" },
  typingDot: { width: "6px", height: "6px", borderRadius: "50%", backgroundColor: theme.purple, animation: "typingBounce 1s ease-in-out infinite" }
};

export default TalkView;