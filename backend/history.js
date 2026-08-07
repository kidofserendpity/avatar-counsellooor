const fs = require('fs');
const path = require('path');

const HISTORY_DIR = path.join(__dirname, 'data', 'history');
const MAX_HISTORY = 800;

function sanitizeUserId(userId) {
  if (!userId || typeof userId !== 'string') return 'anonymous';
  const cleaned = userId.replace(/[^a-zA-Z0-9-]/g, '');
  return cleaned.slice(0, 64) || 'anonymous';
}

function getHistoryPath(userId) {
  return path.join(HISTORY_DIR, `${sanitizeUserId(userId)}.json`);
}

function loadHistory(userId) {
  try {
    const raw = fs.readFileSync(getHistoryPath(userId), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.messages) ? parsed.messages : [];
  } catch {
    return [];
  }
}

function saveHistory(userId, messages) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
  fs.writeFileSync(getHistoryPath(userId), JSON.stringify({ messages: messages.slice(-MAX_HISTORY) }, null, 2));
}

function appendMessages(userId, newMessages) {
  const existing = loadHistory(userId);
  saveHistory(userId, [...existing, ...newMessages]);
}

function searchHistory(userId, query) {
  const messages = loadHistory(userId);
  if (!query || !query.trim()) return messages.slice(-100).reverse();
  const lowerQuery = query.trim().toLowerCase();
  return messages.filter((m) => m.content && m.content.toLowerCase().includes(lowerQuery)).reverse();
}

// Chronological (oldest to newest), used to rebuild the live Talk screen
// on load, unlike searchHistory above which returns newest-first for browsing.
function getRecentForContext(userId, limit = 40) {
  const messages = loadHistory(userId);
  return messages.slice(-limit);
}

module.exports = { loadHistory, saveHistory, appendMessages, searchHistory, getRecentForContext };