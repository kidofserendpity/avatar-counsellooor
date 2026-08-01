import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import LiveSessionPrompt from "./components/LiveSessionPrompt";
import AuthGate from "./components/AuthGate";
import GetToKnowYou from "./components/GetToKnowYou";
import HomeView from "./views/HomeView";
import TalkView from "./views/TalkView";
import JournalView from "./views/JournalView";
import InsightsView from "./views/InsightsView";
import SettingsView from "./views/SettingsView";
import BreatheView from "./views/BreatheView";
import { theme } from "./theme";
import { useIsMobile } from "./hooks/useIsMobile";
import { refreshUserIdHeader, hasResolvedIdentity } from "./utils/userId";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const THEME_STORAGE_KEY = "aria-theme-mode";
const LIVE_PROMPT_KEY = "aria-live-prompt-dismissed";
const ONBOARDING_KEY = "aria-onboarding-done";
const AMBIENT_KEY = "aria-ambient-background";

refreshUserIdHeader();

function getLivePromptDismissed() {
  try {
    return localStorage.getItem(LIVE_PROMPT_KEY) === "true";
  } catch {
    return false;
  }
}

function attachSilenceDetector(stream, onSilence, options = {}) {
  const { silenceThreshold = 0.02, silenceDuration = 1200, minSpeakingDuration = 700 } = options;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioCtx();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);

  let silenceStart = null;
  const startTime = Date.now();
  let rafId;
  let stopped = false;

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    audioContext.close().catch(() => {});
  };

  const check = () => {
    if (stopped) return;
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    const elapsed = Date.now() - startTime;

    if (rms < silenceThreshold && elapsed > minSpeakingDuration) {
      if (silenceStart === null) silenceStart = Date.now();
      if (Date.now() - silenceStart >= silenceDuration) {
        cleanup();
        onSilence();
        return;
      }
    } else {
      silenceStart = null;
    }
    rafId = requestAnimationFrame(check);
  };

  rafId = requestAnimationFrame(check);
  return cleanup;
}

function App() {
  const isMobile = useIsMobile();
  const [identityResolved, setIdentityResolved] = useState(() => hasResolvedIdentity());
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === "true";
    } catch {
      return true;
    }
  });
  const [activeView, setActiveView] = useState("home");

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sentiment, setSentiment] = useState("calm");
  const [speaking, setSpeaking] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [showLivePrompt, setShowLivePrompt] = useState(false);

  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  const [ambientBackground, setAmbientBackground] = useState(() => {
    try {
      return localStorage.getItem(AMBIENT_KEY) !== "false";
    } catch {
      return true;
    }
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const conversationRef = useRef(conversation);
  const silenceCleanupRef = useRef(null);
  const liveModeRef = useRef(liveMode);
  const recordingRef = useRef(recording);
  const loadingRef = useRef(loading);
  const speakingRef = useRef(speaking);
  const imageLoadingRef = useRef(imageLoading);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const pendingInterruptRef = useRef(false);
  const hasShownLivePromptRef = useRef(false);

  useEffect(() => { conversationRef.current = conversation; }, [conversation]);
  useEffect(() => { liveModeRef.current = liveMode; }, [liveMode]);
  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { speakingRef.current = speaking; }, [speaking]);
  useEffect(() => { imageLoadingRef.current = imageLoading; }, [imageLoading]);

  useEffect(() => {
    document.body.classList.toggle("light-theme", themeMode === "light");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // localStorage unavailable — theme just won't persist across reloads
    }
  }, [themeMode]);

  const handleSetAmbientBackground = (value) => {
    setAmbientBackground(value);
    try {
      localStorage.setItem(AMBIENT_KEY, value ? "true" : "false");
    } catch {
      // ignore
    }
  };

  const finishOnboarding = () => {
    try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch { /* ignore */ }
    setOnboardingDone(true);
  };

  const navigateTo = (view) => {
    setActiveView(view);
    if (view === "talk" && !hasShownLivePromptRef.current) {
      hasShownLivePromptRef.current = true;
      if (!getLivePromptDismissed()) {
        setShowLivePrompt(true);
      }
    }
  };

  const handleLiveChoice = (startLive, dontAskAgain) => {
    if (dontAskAgain) {
      try { localStorage.setItem(LIVE_PROMPT_KEY, "true"); } catch { /* ignore */ }
    }
    setShowLivePrompt(false);
    if (startLive) {
      setLiveMode(true);
    }
  };

  const speak = (audioUrl) => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.src = `${API_BASE}${audioUrl}`;
    audio.onplay = () => setSpeaking(true);
    audio.onended = () => setSpeaking(false);
    audio.play().catch((err) => {
      console.error("Playback blocked or failed:", err);
      setSpeaking(false);
    });
  };

  const stopAria = () => {
    if (audioRef.current) audioRef.current.pause();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    requestIdRef.current += 1;
    setSpeaking(false);
    setLoading(false);
    pendingInterruptRef.current = true;
  };

  const sendMessage = async (overrideText) => {
    const textToSend = (overrideText ?? message).trim();
    if (!textToSend) return;

    const interrupted = speakingRef.current || loadingRef.current || pendingInterruptRef.current;
    pendingInterruptRef.current = false;

    if (audioRef.current) audioRef.current.pause();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setSpeaking(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const myRequestId = ++requestIdRef.current;

    setMessage("");
    setLoading(true);

    const updatedConversation = [...conversationRef.current, { role: "user", content: textToSend }];
    setConversation(updatedConversation);

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        message: textToSend,
        conversationHistory: conversationRef.current,
        interrupted
      }, { signal: controller.signal });

      if (myRequestId !== requestIdRef.current) return;

      const aiResponse = res.data.response;
      const isCrisis = res.data.isCrisis;
      const audioUrl = res.data.audioUrl;

      setConversation([...updatedConversation, { role: "assistant", content: aiResponse, isCrisis }]);
      setSentiment(res.data.sentiment || "calm");
      speak(audioUrl);
    } catch (error) {
      if (axios.isCancel(error) || error.code === "ERR_CANCELED") return;
      console.error("Error:", error);
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false);
    }
  };

  const sendImage = async (file, caption = "") => {
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    const updatedConversation = [
      ...conversationRef.current,
      { role: "user", content: caption, imageUrl: localUrl }
    ];
    setConversation(updatedConversation);
    setImageLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("caption", caption);
      formData.append("conversationHistory", JSON.stringify(conversationRef.current));

      const res = await axios.post(`${API_BASE}/api/chat-image`, formData);

      const aiResponse = res.data.response;
      const audioUrl = res.data.audioUrl;

      setConversation([...updatedConversation, { role: "assistant", content: aiResponse }]);
      setSentiment(res.data.sentiment || "calm");
      speak(audioUrl);
    } catch (error) {
      console.error("Image send error:", error);
    } finally {
      setImageLoading(false);
    }
  };

  const startRecording = async (live = false) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      if (silenceCleanupRef.current) {
        silenceCleanupRef.current();
        silenceCleanupRef.current = null;
      }
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      try {
        setLoading(true);
        const res = await axios.post(`${API_BASE}/api/transcribe`, formData);
        const transcript = res.data.transcript;
        if (transcript && transcript.trim()) {
          await sendMessage(transcript);
        }
      } catch (error) {
        console.error("Transcription error:", error);
      } finally {
        setLoading(false);
      }
    };

    mediaRecorderRef.current.start();
    setRecording(true);

    if (live) {
      silenceCleanupRef.current = attachSilenceDetector(stream, () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          stopRecording();
        }
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  useEffect(() => {
    if (liveMode && !recordingRef.current && !loadingRef.current && !speakingRef.current && !imageLoadingRef.current) {
      startRecording(true);
    }
    if (!liveMode && recordingRef.current) {
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode]);

  useEffect(() => {
    if (!liveModeRef.current) return;
    if (recording || loading || speaking || imageLoading) return;

    const timer = setTimeout(() => {
      if (liveModeRef.current && !recordingRef.current && !loadingRef.current && !speakingRef.current && !imageLoadingRef.current) {
        startRecording(true);
      }
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, speaking, recording, imageLoading]);

  if (!identityResolved) {
    return <AuthGate apiBase={API_BASE} onContinueGuest={() => setIdentityResolved(true)} />;
  }

  if (!onboardingDone) {
    return <GetToKnowYou apiBase={API_BASE} onDone={finishOnboarding} />;
  }

  const talkProps = {
    message, setMessage, conversation, loading, recording, sentiment, speaking,
    sendMessage, startRecording, stopRecording, liveMode, onToggleLive: setLiveMode,
    imageLoading, sendImage, onStopAria: stopAria
  };

  const renderView = () => {
    switch (activeView) {
      case "talk": return <TalkView {...talkProps} />;
      case "journal": return <JournalView apiBase={API_BASE} />;
      case "insights": return <InsightsView apiBase={API_BASE} />;
      case "settings":
        return (
          <SettingsView
            apiBase={API_BASE}
            themeMode={themeMode}
            onSetThemeMode={setThemeMode}
            ambientBackground={ambientBackground}
            onSetAmbientBackground={handleSetAmbientBackground}
          />
        );
      case "breathe": return <BreatheView />;
      default: return <HomeView apiBase={API_BASE} onNavigate={navigateTo} />;
    }
  };

  return (
    <div style={styles.shell}>
      {ambientBackground && (
        <>
          <div style={styles.auroraA} />
          <div style={styles.auroraB} />
          <div style={styles.auroraC} />
        </>
      )}
      {!isMobile && <Sidebar activeView={activeView} onNavigate={navigateTo} />}
      <main style={{ ...styles.main, padding: isMobile ? "20px 16px 90px" : "36px 48px" }}>
        {renderView()}
      </main>
      {isMobile && <BottomNav activeView={activeView} onNavigate={navigateTo} />}
      {showLivePrompt && <LiveSessionPrompt onChoose={handleLiveChoice} />}
    </div>
  );
}

const styles = {
  shell: { position: "relative", display: "flex", minHeight: "100vh", backgroundColor: theme.bg, fontFamily: theme.sans, overflow: "hidden" },
  auroraA: {
    position: "fixed", top: "-20%", left: "-10%", width: "60vw", height: "60vw", borderRadius: "50%",
    background: `radial-gradient(circle, var(--accent-purple), transparent 70%)`, opacity: 0.24,
    filter: "blur(60px)", animation: "auroraDriftA 22s ease-in-out infinite", pointerEvents: "none", zIndex: -1
  },
  auroraB: {
    position: "fixed", bottom: "-20%", right: "-10%", width: "55vw", height: "55vw", borderRadius: "50%",
    background: `radial-gradient(circle, var(--accent-teal), transparent 70%)`, opacity: 0.2,
    filter: "blur(70px)", animation: "auroraDriftB 26s ease-in-out infinite", pointerEvents: "none", zIndex: -1
  },
  auroraC: {
    position: "fixed", top: "30%", left: "35%", width: "42vw", height: "42vw", borderRadius: "50%",
    background: `radial-gradient(circle, var(--accent-rose), transparent 70%)`, opacity: 0.14,
    filter: "blur(80px)", animation: "auroraDriftC 30s ease-in-out infinite", pointerEvents: "none", zIndex: -1
  },
  main: { flex: 1, boxSizing: "border-box", minHeight: "100vh", overflowY: "auto" }
};

export default App;