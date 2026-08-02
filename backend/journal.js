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

function addEntry(entries, text, category = 'other', subject = '') {
  const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'other';
  const entry = {
    id: `${Date.now()}`,
    subject: subject ? subject.trim() : '',
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

const JOURNAL_FACT_PROMPT = `You're reviewing something a person just wrote in their private journal. Decide if it reveals a specific, durable fact worth Aria quietly knowing for future conversations — a situation, relationship, plan, recurring feeling, or strong opinion. Not a passing mood.

If yes, state it plainly, third person, under 15 words. If not, or if it's too personal/raw to summarize respectfully in one line, write NONE — it's fine for Aria to simply know a journal entry exists without extracting details from it.

Respond with only the fact sentence or NONE, nothing else.`;

const extractJournalFact = async (text) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: JOURNAL_FACT_PROMPT },
        { role: 'user', content: text }
      ],
      max_tokens: 40,
      temperature: 0.3,
    });
    const fact = completion.choices[0].message.content.trim();
    return (fact === 'NONE' || fact.length < 3) ? null : fact;
  } catch (err) {
    console.error('Journal fact extraction failed:', err.message);
    return null;
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