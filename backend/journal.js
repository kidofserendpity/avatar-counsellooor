const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const JOURNAL_DIR = path.join(__dirname, 'data', 'journal');

function sanitizeUserId(userId) {
  if (!userId || typeof userId !== 'string') return 'anonymous';
  const cleaned = userId.replace(/[^a-zA-Z0-9-]/g, '');
  return cleaned.slice(0, 64) || 'anonymous';
}

function getJournalPath(userId) {
  return path.join(JOURNAL_DIR, `${sanitizeUserId(userId)}.json`);
}

function loadJournal(userId) {
  try {
    const raw = fs.readFileSync(getJournalPath(userId), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function saveJournal(userId, entries) {
  fs.mkdirSync(JOURNAL_DIR, { recursive: true });
  fs.writeFileSync(getJournalPath(userId), JSON.stringify({ entries }, null, 2));
}

function clearJournal(userId) {
  saveJournal(userId, []);
  return [];
}

const VALID_CATEGORIES = ['reflection', 'gratitude', 'venting', 'goal', 'dream', 'memory', 'worry', 'other'];

function addEntry(entries, text, category = 'other') {
  const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'other';
  const entry = {
    id: `${Date.now()}`,
    text,
    timestamp: Date.now(),
    category: safeCategory,
    archived: false
  };
  return { entries: [...entries, entry], entry };
}

function deleteEntry(entries, id) {
  return entries.filter((e) => e.id !== id);
}

function setArchived(entries, id, archived) {
  return entries.map((e) => (e.id === id ? { ...e, archived } : e));
}

const JOURNAL_FACT_PROMPT = `You're reviewing something a person just wrote in their private journal, for two separate purposes.

1. FACT: Decide if it reveals a specific, durable fact worth Aria quietly knowing for future conversations — a situation, relationship, plan, recurring feeling, or strong opinion. Not a passing mood. If yes, state it plainly, third person, under 15 words. If not, or if it's too personal/raw to summarize respectfully in one line, write NONE.

2. CATEGORY: Classify the overall theme of the entry as exactly one of: reflection, gratitude, venting, goal, dream, memory, worry, other.

Respond in exactly this format, two lines, nothing else:
FACT: <fact or NONE>
CATEGORY: <one of the categories above>`;

const extractJournalFact = async (text) => {
  const defaults = { fact: null, category: 'other' };
  try {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: JOURNAL_FACT_PROMPT },
        { role: 'user', content: text }
      ],
      max_tokens: 60,
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content.trim();
    const factMatch = raw.match(/FACT:\s*(.+)/i);
    const categoryMatch = raw.match(/CATEGORY:\s*(reflection|gratitude|venting|goal|dream|memory|worry|other)/i);
    const factText = factMatch ? factMatch[1].trim() : 'NONE';

    return {
      fact: (factText === 'NONE' || factText.length < 3) ? null : factText,
      category: categoryMatch ? categoryMatch[1].toLowerCase() : defaults.category
    };
  } catch (err) {
    console.error('Journal fact extraction failed:', err.message);
    return defaults;
  }
};

module.exports = {
  loadJournal,
  saveJournal,
  clearJournal,
  addEntry,
  deleteEntry,
  setArchived,
  extractJournalFact,
  VALID_CATEGORIES
};