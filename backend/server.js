const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { execFile } = require('child_process');
const path = require('path');
require('dotenv').config();

const { getTherapeuticResponse, getCrisisResponse, extractMemoryAndStyle, getLiveCheckInLine } = require('./dialogue');
const { detectExplicitCrisis } = require('./crisis');
const { transcribeAudio } = require('./transcribe');
const { getImageReaction, extractVisualFact } = require('./vision');
const { createAccount, verifyLogin, getUsernameByAccountId } = require('./accounts');
const {
  loadMemory,
  saveMemory,
  addFact,
  addJournalFact,
  addVisualFact,
  addMoodEntry,
  updateStyle,
  setCrisisFlag,
  consumeCrisisCheckIn,
  buildMemoryBlock,
  clearMemory
} = require('./memory');
const { loadJournal, saveJournal, clearJournal, addEntry, deleteEntry, setArchived, extractJournalFact } = require('./journal');

const app = express();
const PORT = process.env.PORT || 5000;

fs.mkdirSync(path.join(__dirname, 'public', 'audio'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

function getUserId(req) {
  return req.headers['x-user-id'] || req.body.userId || req.query.userId || 'anonymous';
}

app.get('/', (req, res) => {
  res.json({ message: 'Avatar Counsellor Backend is running!' });
});

app.post('/api/account/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await createAccount(username, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/account/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await verifyLogin(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/onboarding', (req, res) => {
  try {
    const userId = getUserId(req);
    const { facts } = req.body;
    if (!Array.isArray(facts) || facts.length === 0) {
      return res.json({ saved: 0 });
    }
    let memory = loadMemory(userId);
    facts.forEach((fact) => {
      if (typeof fact === 'string' && fact.trim()) {
        memory = addFact(memory, fact.trim());
      }
    });
    saveMemory(userId, memory);
    res.json({ saved: facts.length });
  } catch (error) {
    console.error('Onboarding save error:', error.message);
    res.status(500).json({ error: 'Could not save onboarding facts' });
  }
});

app.get('/api/mood-history', (req, res) => {
  const userId = getUserId(req);
  const memory = loadMemory(userId);
  res.json({ moodLog: memory.moodLog });
});

app.get('/api/journal', (req, res) => {
  const userId = getUserId(req);
  const entries = loadJournal(userId);
  res.json({ entries });
});

app.post('/api/journal', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { text, category, subject } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Entry text is required' });
    }

    const entries = loadJournal(userId);
    const { entries: updatedEntries, entry } = addEntry(entries, text.trim(), category, subject);
    saveJournal(userId, updatedEntries);

    extractJournalFact(text.trim())
      .then((fact) => {
        if (!fact) return;
        const memory = loadMemory(userId);
        saveMemory(userId, addJournalFact(memory, fact));
      })
      .catch((err) => console.error('Journal fact update failed:', err.message));

    res.json({ entry });
  } catch (error) {
    console.error('Journal save error:', error.message);
    res.status(500).json({ error: 'Could not save entry' });
  }
});

app.patch('/api/journal/:id/archive', (req, res) => {
  try {
    const userId = getUserId(req);
    const { archived } = req.body;
    const entries = loadJournal(userId);
    const updated = setArchived(entries, req.params.id, !!archived);
    saveJournal(userId, updated);
    res.json({ success: true });
  } catch (error) {
    console.error('Archive toggle error:', error.message);
    res.status(500).json({ error: 'Could not update entry' });
  }
});

app.delete('/api/journal/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const entries = loadJournal(userId);
    const updated = deleteEntry(entries, req.params.id);
    saveJournal(userId, updated);
    res.json({ success: true });
  } catch (error) {
    console.error('Journal entry delete error:', error.message);
    res.status(500).json({ error: 'Could not delete entry' });
  }
});

app.delete('/api/journal', (req, res) => {
  try {
    const userId = getUserId(req);
    clearJournal(userId);
    res.json({ cleared: true });
  } catch (error) {
    console.error('Clear journal error:', error.message);
    res.status(500).json({ error: 'Could not clear journal' });
  }
});

app.delete('/api/memory', (req, res) => {
  try {
    const userId = getUserId(req);
    const fresh = clearMemory(userId);
    res.json({ cleared: true, memory: fresh });
  } catch (error) {
    console.error('Clear memory error:', error.message);
    res.status(500).json({ error: 'Could not clear memory' });
  }
});

app.delete('/api/reset-all', (req, res) => {
  try {
    const userId = getUserId(req);
    clearMemory(userId);
    clearJournal(userId);
    res.json({ cleared: true });
  } catch (error) {
    console.error('Reset all error:', error.message);
    res.status(500).json({ error: 'Could not reset' });
  }
});

app.post('/api/live-checkin', async (req, res) => {
  try {
    const { conversationHistory } = req.body;
    const reply = await getLiveCheckInLine(conversationHistory || []);
    const audioFileName = `speech_${Date.now()}.mp3`;
    const audioFilePath = path.join(__dirname, 'public', 'audio', audioFileName);
    execFile('python', ['generate_speech.py', reply, audioFilePath], (error) => {
      if (error) {
        console.error('TTS generation error:', error);
        return res.json({ response: reply, audioUrl: null });
      }
      res.json({ response: reply, audioUrl: `/audio/${audioFileName}` });
    });
  } catch (error) {
    console.error('Live check-in error:', error.message);
    res.status(500).json({ error: 'Could not generate check-in' });
  }
});

function generateCrisisAudioAndRespond(res, replyText, sentiment) {
  const crisisAudioFileName = `speech_${Date.now()}.mp3`;
  const crisisAudioPath = path.join(__dirname, 'public', 'audio', crisisAudioFileName);
  execFile('python', ['generate_speech.py', replyText, crisisAudioPath], (err) => {
    if (err || !fs.existsSync(crisisAudioPath) || fs.statSync(crisisAudioPath).size === 0) {
      console.error('CRISIS AUDIO FAILED — err:', err, '| file exists:', fs.existsSync(crisisAudioPath));
      return res.json({ response: replyText, isCrisis: true, sentiment, audioUrl: null });
    }
    res.json({ response: replyText, isCrisis: true, sentiment, audioUrl: `/audio/${crisisAudioFileName}` });
  });
}

function recordMemoryAsync(userId, userMessage, ariaReply, memory, sentiment) {
  extractMemoryAndStyle(userMessage, ariaReply)
    .then(({ fact, length, humor, formality }) => {
      let updated = memory;
      if (fact) updated = addFact(updated, fact);
      if (sentiment) updated = addMoodEntry(updated, sentiment);
      updated = updateStyle(updated, { length, humor, formality });
      updated.lastMessageTimestamp = Date.now();
      saveMemory(userId, updated);
    })
    .catch((err) => console.error('Memory update failed:', err.message));
}

app.post('/api/chat', async (req, res) => {
  try {
    const userId = getUserId(req);
    const username = getUsernameByAccountId(userId);
    const { message, conversationHistory, interrupted } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let memory = loadMemory(userId);
    const checkin = consumeCrisisCheckIn(memory);
    memory = checkin.memory;
    const checkInNote = checkin.checkInNote;
    if (checkInNote) saveMemory(userId, memory);

    let memoryBlock = buildMemoryBlock(memory, checkInNote, username);
    if (interrupted) {
      memoryBlock += "\n\nOne more thing for right now: the person just cut you off mid-reply to say this instead. Acknowledge that naturally and briefly as part of responding to what they're saying now — don't over-apologize or make a big deal of it, just fold it in like a person would ('oh — go ahead', 'sure, what's up') and then continue normally.";
    }

    const explicitCheck = detectExplicitCrisis(message);

    if (explicitCheck.isCrisis) {
      const crisisReply = await getCrisisResponse(message, 'explicit', conversationHistory, memoryBlock);
      memory = setCrisisFlag(memory, message);
      recordMemoryAsync(userId, message, crisisReply, memory, 'sad');
      return generateCrisisAudioAndRespond(res, crisisReply, 'sad');
    }

    const { response, sentiment, contextCrisisDetected } = await getTherapeuticResponse(message, conversationHistory, memoryBlock);

    if (contextCrisisDetected) {
      const crisisReply = await getCrisisResponse(message, 'ambiguous', conversationHistory, memoryBlock);
      memory = setCrisisFlag(memory, message);
      recordMemoryAsync(userId, message, crisisReply, memory, sentiment);
      return generateCrisisAudioAndRespond(res, crisisReply, sentiment);
    }

    recordMemoryAsync(userId, message, response, memory, sentiment);

    const audioFileName = `speech_${Date.now()}.mp3`;
    const audioFilePath = path.join(__dirname, 'public', 'audio', audioFileName);

    execFile('python', ['generate_speech.py', response, audioFilePath], (error) => {
      if (error) {
        console.error('TTS generation error:', error);
        return res.json({ response, isCrisis: false, audioUrl: null, sentiment });
      }
      res.json({ response, isCrisis: false, audioUrl: `/audio/${audioFileName}`, sentiment });
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/api/chat-image', upload.single('image'), async (req, res) => {
  try {
    const userId = getUserId(req);
    const username = getUsernameByAccountId(userId);
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
    if (req.file.size > MAX_IMAGE_BYTES) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Image is too large — try something under 8MB.' });
    }

    const caption = req.body.caption || '';
    let conversationHistory = [];
    try {
      conversationHistory = req.body.conversationHistory ? JSON.parse(req.body.conversationHistory) : [];
    } catch {
      conversationHistory = [];
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    fs.unlinkSync(req.file.path);

    let memory = loadMemory(userId);
    const checkin = consumeCrisisCheckIn(memory);
    memory = checkin.memory;
    if (checkin.checkInNote) saveMemory(userId, memory);
    const memoryBlock = buildMemoryBlock(memory, checkin.checkInNote, username);

    if (caption && detectExplicitCrisis(caption).isCrisis) {
      const crisisReply = await getCrisisResponse(caption, 'explicit', conversationHistory, memoryBlock);
      memory = setCrisisFlag(memory, caption);
      saveMemory(userId, memory);
      return generateCrisisAudioAndRespond(res, crisisReply, 'sad');
    }

    const { reply, sentiment } = await getImageReaction(base64Image, mimeType, caption, memoryBlock);

    extractVisualFact(base64Image, mimeType, caption)
      .then((fact) => {
        if (!fact) return;
        const current = loadMemory(userId);
        saveMemory(userId, addVisualFact(current, fact));
      })
      .catch((err) => console.error('Visual fact save failed:', err.message));

    memory.lastMessageTimestamp = Date.now();
    saveMemory(userId, memory);

    const audioFileName = `speech_${Date.now()}.mp3`;
    const audioFilePath = path.join(__dirname, 'public', 'audio', audioFileName);

    execFile('python', ['generate_speech.py', reply, audioFilePath], (error) => {
      if (error) {
        console.error('TTS generation error:', error);
        return res.json({ response: reply, sentiment, audioUrl: null });
      }
      res.json({ response: reply, sentiment, audioUrl: `/audio/${audioFileName}` });
    });
  } catch (error) {
    console.error('Image chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong analyzing that image' });
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    const oldPath = req.file.path;
    const newPath = `${oldPath}.webm`;
    fs.renameSync(oldPath, newPath);
    const transcript = await transcribeAudio(newPath);
    fs.unlinkSync(newPath);
    res.json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});