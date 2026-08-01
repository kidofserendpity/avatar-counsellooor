import { useState, useRef, useEffect } from "react";
import { Mic, Square, Camera } from "lucide-react";
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
  speaking: `0 0 55px 20px rgba(155,107,255,0.5), 0 0 95px 36px rgba(94,234,212,0.28)`,
  listening: `0 0 42px 15px rgba(155,107,255,0.42)`,
  thinking: `0 0 30px 10px rgba(155,107,255,0.28)`,
  seeing: `0 0 48px 16px rgba(94,234,212,0.4), 0 0 20px 6px rgba(155,107,255,0.3)`,
  idle: `0 0 22px 6px rgba(155,107,255,0.16)`
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
  const videoRef = useRef(null);
  const video2Ref = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const orbSize = isMobile ? 190 : 280;

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
    setAbsorbPreview({ url: previewUrl, key: Date.now() });
    setMessage("");
    setTimeout(() => {
      setAbsorbPreview(null);
      sendImage(file, caption);
    }, 650);
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
    <div style={styles.wrap} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
      <div style={styles.header}>
        <div>
          <div style={styles.sessionLabel}>Session</div>
          <div style={styles.elapsed}>{formatElapsed(elapsed)} elapsed</div>
        </div>
        <div style={styles.headerControls}>
          <div style={styles.liveToggleWrap}>
            <span style={styles.liveToggleLabel}>Live</span>
            <button
              style={{ ...styles.toggle, backgroundColor: liveMode ? theme.purple : theme.bgElevated }}
              onClick={() => onToggleLive(!liveMode)}
            >
              <span style={{ ...styles.toggleDot, transform: liveMode ? "translateX(18px)" : "translateX(0)" }} />
            </button>
          </div>
          <button style={styles.transcriptToggle} onClick={() => setShowTranscript((s) => !s)}>
            {showTranscript ? "Hide transcript" : "Show transcript"}
          </button>
        </div>
      </div>

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
          <img key={absorbPreview.key} src={absorbPreview.url} alt="Sending to A.R.I.A" style={styles.absorbImage} />
        )}
      </div>

      <p style={styles.stateLabel}>
        {liveStatusLabel || (imageLoading ? "Looking at that…" : recording ? "Listening…" : loading ? "Musing…" : speaking ? "Speaking…" : "Tap the orb to speak")}
      </p>

      {canInterrupt && (
        <button style={styles.stopButton} onClick={onStopAria}>
          <Square size={12} fill="currentColor" /> Stop
        </button>
      )}

      {showTranscript && (
        <div style={{ ...styles.chatBox, height: isMobile ? "260px" : "300px" }}>
          {conversation.length === 0 && !loading && (
            <p style={styles.emptyState}>Nothing here yet — say whatever's on your mind, or drop a photo on the orb.</p>
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

      <div style={styles.inputDock}>
        <button
          style={{ ...styles.micButton, backgroundColor: recording ? theme.crisis : theme.bgElevated, borderColor: recording ? theme.crisis : theme.border }}
          onClick={recording ? stopRecording : () => startRecording(false)}
        >
          {recording ? <Square size={16} fill="currentColor" /> : <Mic size={16} />}
        </button>
        <button style={styles.cameraButton} onClick={() => fileInputRef.current?.click()}>
          <Camera size={16} />
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
          style={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Say anything…"
        />
        <button style={styles.sendButton} onClick={() => sendMessage()}>Send</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "760px", margin: "0 auto", boxSizing: "border-box" },
  header: { display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "8px" },
  sessionLabel: { fontFamily: theme.serif, fontSize: "20px", color: theme.cream },
  elapsed: { fontSize: "12px", color: theme.mutedDim, fontFamily: "ui-monospace, Consolas, monospace" },
  headerControls: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" },
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
    padding: "7px 14px", borderRadius: "999px", border: `1px solid ${theme.border}`,
    backgroundColor: "transparent", color: theme.muted, fontSize: "12px", cursor: "pointer"
  },
  orbStage: {
    position: "relative", display: "flex", alignItems: "center", justifyContent: "center", margin: "20px 0 10px"
  },
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
    animation: "imageAbsorb 0.65s ease-in forwards", zIndex: 5, pointerEvents: "none"
  },
  stateLabel: { color: theme.mutedDim, fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" },
  stopButton: {
    display: "flex", alignItems: "center", gap: "6px", padding: "6px 16px", marginBottom: "16px",
    borderRadius: "999px", border: `1px solid ${theme.crisis}`,
    backgroundColor: "rgba(255,77,77,0.1)", color: "#ff8080", fontSize: "12px", cursor: "pointer"
  },
  chatBox: {
    display: "flex", flexDirection: "column", width: "100%", overflowY: "auto",
    backgroundColor: theme.panel, backdropFilter: "blur(6px)", borderRadius: "16px", padding: "16px",
    gap: "10px", border: `1px solid ${theme.border}`, marginBottom: "16px", boxSizing: "border-box"
  },
  emptyState: { color: theme.mutedDim, fontSize: "13px", textAlign: "center", margin: "auto" },
  message: { maxWidth: "80%", padding: "10px 14px", borderRadius: "14px", wordBreak: "break-word" },
  messageText: { color: theme.cream, margin: 0, lineHeight: "1.5", fontSize: "15px" },
  messageImage: { maxWidth: "220px", borderRadius: "12px", display: "block", marginBottom: "6px" },
  typingDots: { display: "flex", gap: "4px", padding: "2px 0" },
  typingDot: { width: "6px", height: "6px", borderRadius: "50%", backgroundColor: theme.purple, animation: "typingBounce 1s ease-in-out infinite" },
  inputDock: { display: "flex", width: "100%", gap: "8px" },
  micButton: { display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 14px", color: theme.cream, border: `1px solid ${theme.border}`, borderRadius: "12px", cursor: "pointer", backgroundColor: theme.bgElevated },
  cameraButton: { display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 14px", color: theme.cream, border: `1px solid ${theme.border}`, borderRadius: "12px", cursor: "pointer", backgroundColor: theme.bgElevated },
  input: { flex: 1, minWidth: 0, padding: "10px 14px", borderRadius: "12px", border: `1px solid ${theme.border}`, backgroundColor: theme.bgElevated, color: theme.cream, fontSize: "15px", outline: "none" },
  sendButton: { padding: "10px 18px", background: `linear-gradient(135deg, ${theme.purple}, ${theme.teal})`, color: "#120e1c", fontWeight: 600, border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "15px" }
};

export default TalkView;