const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, 'data', 'memory');
const MAX_FACTS = 40;
const MAX_VISUAL_FACTS = 30;
const MAX_MOOD_LOG = 200;
const NEW_SESSION_GAP_MS = 90 * 60 * 1000;

function sanitizeUserId(userId) {
  if (!userId || typeof userId !== 'string') return 'anonymous';
  const cleaned = userId.replace(/[^a-zA-Z0-9-]/g, '');
  return cleaned.slice(0, 64) || 'anonymous';
}

function getMemoryPath(userId) {
  return path.join(MEMORY_DIR, `${sanitizeUserId(userId)}.json`);
}

function defaultMemory() {
  return {
    facts: [],
    visualFacts: [],
    lastMessageTimestamp: null,
    crisisFlag: null,
    moodLog: [],
    styleProfile: {
      totalMessages: 0,
      length: { short: 0, medium: 0, long: 0 },
      humorCount: 0,
      formality: { casual: 0, neutral: 0, formal: 0 }
    }
  };
}

function loadMemory(userId) {
  try {
    const raw = fs.readFileSync(getMemoryPath(userId), 'utf-8');
    const parsed = JSON.parse(raw);
    const base = defaultMemory();
    return {
      ...base,
      ...parsed,
      styleProfile: { ...base.styleProfile, ...(parsed.styleProfile || {}) }
    };
  } catch {
    return defaultMemory();
  }
}

function saveMemory(userId, memory) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(getMemoryPath(userId), JSON.stringify(memory, null, 2));
}

function clearMemory(userId) {
  const fresh = defaultMemory();
  saveMemory(userId, fresh);
  return fresh;
}

function addFact(memory, fact) {
  const facts = [...memory.facts, fact].slice(-MAX_FACTS);
  return { ...memory, facts };
}

function addVisualFact(memory, fact) {
  const visualFacts = [...memory.visualFacts, fact].slice(-MAX_VISUAL_FACTS);
  return { ...memory, visualFacts };
}

function setCrisisFlag(memory, message) {
  const text = message.length > 150 ? `${message.slice(0, 150)}…` : message;
  return { ...memory, crisisFlag: { text, flaggedAt: Date.now() } };
}

function consumeCrisisCheckIn(memory) {
  if (!memory.crisisFlag) return { memory, checkInNote: '' };
  const gapPassed = !memory.lastMessageTimestamp || (Date.now() - memory.lastMessageTimestamp) >= NEW_SESSION_GAP_MS;
  if (!gapPassed) return { memory, checkInNote: '' };
  const note = `This is a new session after a real gap. Last time, something came up that mattered: "${memory.crisisFlag.text}". Before anything else, check in on this yourself, naturally, like someone who'd actually been thinking about it, not a scripted wellness check. Don't make the whole conversation about it, just don't skip it either.`;
  return { memory: { ...memory, crisisFlag: null }, checkInNote: note };
}

function addMoodEntry(memory, sentiment) {
  const moodLog = [...memory.moodLog, { sentiment, timestamp: Date.now() }].slice(-MAX_MOOD_LOG);
  return { ...memory, moodLog };
}

function getMoodTrendLine(memory) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = memory.moodLog.filter(m => m.timestamp >= sevenDaysAgo);
  if (recent.length < 6) return '';
  const counts = {};
  recent.forEach(m => { counts[m.sentiment] = (counts[m.sentiment] || 0) + 1; });
  const negative = (counts.anxious || 0) + (counts.sad || 0) + (counts.angry || 0);
  const ratio = negative / recent.length;
  if (ratio >= 0.6) {
    const dominant = ['anxious', 'sad', 'angry'].sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
    return `This person has seemed more ${dominant} than usual over the past several days, based on the pattern of the conversation. Notice it out loud if it feels natural, like something a person paying attention would say, not a clinical observation.`;
  }
  return '';
}

function updateStyle(memory, classification) {
  const profile = memory.styleProfile;
  const length = { ...profile.length };
  const formality = { ...profile.formality };
  if (classification.length && length[classification.length] !== undefined) length[classification.length] += 1;
  if (classification.formality && formality[classification.formality] !== undefined) formality[classification.formality] += 1;
  return {
    ...memory,
    styleProfile: {
      totalMessages: profile.totalMessages + 1,
      length,
      humorCount: profile.humorCount + (classification.humor ? 1 : 0),
      formality
    }
  };
}

function getStyleLine(memory) {
  const { totalMessages, length, humorCount, formality } = memory.styleProfile;
  if (totalMessages < 8) return '';
  const bits = [];
  if (length.short / totalMessages >= 0.5) {
    bits.push("this person tends to send short, blunt messages, don't over-explain or write long paragraphs back, match their pace");
  } else if (length.long / totalMessages >= 0.4) {
    bits.push('this person tends to write longer, more expressive messages, you can match that energy instead of staying clipped');
  }
  if (humorCount / totalMessages >= 0.15) {
    bits.push("they joke around a fair amount, feel free to be playful, it won't land wrong");
  }
  if (formality.formal / totalMessages >= 0.4) {
    bits.push("they tend to write fairly properly or formally, no need to force slang to match, just don't be stiff about it");
  }
  return bits.length ? `How this specific person tends to talk: ${bits.join('; ')}.` : '';
}

function getTimeGapLine(lastTimestamp, username) {
  if (!lastTimestamp) {
    const nameClause = username
      ? ` They created their account with the username "${username}", after you've introduced yourself, ask plainly and warmly whether it's okay to call them that, or whether they'd rather go by something else. Wait for their answer before deciding what to call them going forward, whatever they say becomes what you call them from now on, and you won't need to ask again after this.`
      : '';
    return `This is the very first message you've ever gotten from this person, you've never talked before. Blended naturally into how you react to whatever they just said, work in a short, genuine introduction: introduce yourself as A.R.I.A, written with the periods, since it's an acronym, not a plain name, and if it fits naturally, briefly what it stands for (Adaptive Responsive Intelligent Ally), plus a casual sense of what you're actually good for, real conversation with someone who remembers, not a scripted FAQ chatbot.${nameClause} Keep it brief and in your own voice, actually respond to what they said too, don't just recite facts about yourself. Vary this every time, never the same fixed intro twice. Do not mention who created you here, that only comes up if someone directly asks. If what they just said clearly needs urgent, careful attention instead, drop the introduction entirely and just focus on that, it can wait.`;
  }
  const minutes = (Date.now() - lastTimestamp) / 60000;
  if (minutes < 30) return '';
  if (minutes < 90) return "It's been about an hour or so since you last talked.";
  if (minutes < 60 * 20) return `It's been about ${Math.round(minutes / 60)} hours since you last talked.`;
  const days = Math.round(minutes / (60 * 24));
  return `It's been about ${days} day${days === 1 ? '' : 's'} since you last talked.`;
}

function buildMemoryBlock(memory, checkInNote = '', username = null, journalSummaryLine = '') {
  const gapLine = getTimeGapLine(memory.lastMessageTimestamp, username);
  const factsLine = memory.facts.length
    ? `Things you already know about this person from earlier conversations: ${memory.facts.slice(-30).join('; ')}.`
    : '';
  const visualLine = memory.visualFacts.length
    ? `Things you've seen in photos this person has shared with you: ${memory.visualFacts.join('; ')}.`
    : '';
  const styleLine = getStyleLine(memory);
  const moodLine = getMoodTrendLine(memory);

  return `\n\n${gapLine}\n${checkInNote}\n${factsLine}\n${journalSummaryLine}\n${visualLine}\n${styleLine}\n${moodLine}\nThis is background for understanding them, not a script or a set of guesses to offer. Don't treat any of the facts above as hypotheses to float when they seem vague or off, don't guess twice in a row, and don't bring up anything that sounded heavy or painful unless they bring it up first. What you know about their journal is held to an even stricter version of that rule, you genuinely know it exists and roughly what's in it, but never raise it unprompted, only engage with it if they bring it up themselves. Don't recite this list or announce that you "remember" things like a feature, just talk like someone who actually knows them, quietly, in the background.`;
}

module.exports = {
  loadMemory,
  saveMemory,
  clearMemory,
  addFact,
  addVisualFact,
  addMoodEntry,
  updateStyle,
  setCrisisFlag,
  consumeCrisisCheckIn,
  buildMemoryBlock
};