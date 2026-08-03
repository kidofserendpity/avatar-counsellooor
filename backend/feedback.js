const fs = require('fs');
const path = require('path');

const FEEDBACK_PATH = path.join(__dirname, 'data', 'feedback.json');
const MAX_FEEDBACK = 500;

function loadFeedback() {
  try {
    const raw = fs.readFileSync(FEEDBACK_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function saveFeedback(entries) {
  fs.mkdirSync(path.dirname(FEEDBACK_PATH), { recursive: true });
  fs.writeFileSync(FEEDBACK_PATH, JSON.stringify({ entries }, null, 2));
}

function addFeedback(entries, { message, rating, userId }) {
  const entry = {
    id: `${Date.now()}`,
    message: (message || '').trim(),
    rating: typeof rating === 'number' ? rating : null,
    userId: userId || 'anonymous',
    timestamp: Date.now()
  };
  const updated = [...entries, entry].slice(-MAX_FEEDBACK);
  return { entries: updated, entry };
}

module.exports = { loadFeedback, saveFeedback, addFeedback };