const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const JOURNAL_PATH = path.join(__dirname, 'journal.json');

function loadJournal() {
  try {
    const raw = fs.readFileSync(JOURNAL_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function saveJournal(entries) {
  fs.writeFileSync(JOURNAL_PATH, JSON.stringify({ entries }, null, 2));
}

function addEntry(entries, text) {
  const entry = { id: `${Date.now()}`, text, timestamp: Date.now() };
  return { entries: [...entries, entry], entry };
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

module.exports = { loadJournal, saveJournal, addEntry, extractJournalFact };