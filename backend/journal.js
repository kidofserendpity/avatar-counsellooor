const fs = require('fs');
const path = require('path');

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

// Built fresh from the real entries every time, not from a lucky-or-not
// background extraction step. This is what actually lets Aria know a
// journal exists and roughly what's in it, without needing to hope an
// earlier step succeeded.
function summarizeForMemory(entries) {
  const active = entries.filter((e) => !e.archived);
  if (active.length === 0) return '';
  const recent = active.slice(-5).reverse();
  const lines = recent.map((e) => {
    const dateStr = new Date(e.timestamp).toLocaleDateString();
    const snippet = e.text.length > 100 ? `${e.text.slice(0, 100)}...` : e.text;
    const label = e.subject ? `"${e.subject}"` : `a ${e.category} entry`;
    return `${dateStr}, ${label}: ${snippet}`;
  });
  return `They keep a private journal here. It currently has ${active.length} ${active.length === 1 ? 'entry' : 'entries'}, most recent first: ${lines.join(' | ')}.`;
}

module.exports = {
  loadJournal,
  saveJournal,
  clearJournal,
  addEntry,
  deleteEntry,
  setArchived,
  summarizeForMemory,
  VALID_CATEGORIES
};