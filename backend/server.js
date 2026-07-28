const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { execFile } = require('child_process');
const path = require('path');
require('dotenv').config();

const { getTherapeuticResponse, getCrisisResponse, extractMemoryAndStyle } = require('./dialogue');
const { detectExplicitCrisis } = require('./crisis');
const { transcribeAudio } = require('./transcribe');
const { getImageReaction, extractVisualFact } = require('./vision');
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
const { loadJournal, saveJournal, addEntry, extractJournalFact } = require('./journal');

const app = express();
const PORT = process.env.PORT || 5000;

// Fresh deploys don't have these folders yet — make sure they exist before
// anything tries to read/write into them.
fs.mkdirSync(path.join(__dirname, 'public', 'audio'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

app.get('/', (req, res) => {
  res.json({ message: 'Avatar Counsellor Backend is running!' });
});

app.get('/api/mood-history', (req, res) => {
  const memory = loadMemory();
  res.json({ moodLog: memory.moodLog });
});

app.get('/api/journal', (req, res) => {
  const entries = loadJournal();
  res.json({ entries });
});

app.post('/api/journal', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Entry text is required' });
    }

    const entries = loadJournal();
    const { entries: updatedEntries, entry } = addEntry(entries, text.trim());
    saveJournal(updatedEntries);

    extractJournalFact(text.trim())
      .then((fact) => {
        if (!fact) return;
        const memory = loadMemory();
        saveMemory(addJournalFact(memory, fact));
      })
      .catch((err) => console.error('Journal fact update failed:', err.message));

    res.json({ entry });
  } catch (error) {
    console.error('Journal save error:', error.message);
    res.status(500).json({ error: 'Could not save entry' });
  }
});

app.delete('/api/memory', (req, res) => {
  try {
    const fresh = clearMemory();
    res.json({ cleared: true, memory: fresh });
  } catch (error) {
    console.error('Clear memory error:', error.message);
    res.status(500).json({ error: 'Could not clear memory' });
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

function recordMemoryAsync(userMessage, ariaReply, memory, sentiment) {
  extractMemoryAndStyle(userMessage, ariaReply)
    .then(({ fact, length, humor, formality }) => {
      let updated = memory;
      if (fact) updated = addFact(updated, fact);
      if (sentiment) updated = addMoodEntry(updated, sentiment);
      updated = updateStyle(updated, { length, humor, formality });
      updated.lastMessageTimestamp = Date.now();
      saveMemory(updated);
    })
    .catch((err) => console.error('Memory update failed:', err.message));
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let memory = loadMemory();
    const checkin = consumeCrisisCheckIn(memory);
    memory = checkin.memory;
    const checkInNote = checkin.checkInNote;
    if (checkInNote) saveMemory(memory);

    const memoryBlock = buildMemoryBlock(memory, checkInNote);

    const explicitCheck = detectExplicitCrisis(message);

    if (explicitCheck.isCrisis) {
      const crisisReply = await getCrisisResponse(message, 'explicit', conversationHistory, memoryBlock);
      memory = setCrisisFlag(memory, message);
      recordMemoryAsync(message, crisisReply, memory, 'sad');
      return generateCrisisAudioAndRespond(res, crisisReply, 'sad');
    }

    const { response, sentiment, contextCrisisDetected } = await getTherapeuticResponse(message, conversationHistory, memoryBlock);

    if (contextCrisisDetected) {
      const crisisReply = await getCrisisResponse(message, 'ambiguous', conversationHistory, memoryBlock);
      memory = setCrisisFlag(memory, message);
      recordMemoryAsync(message, crisisReply, memory, sentiment);
      return generateCrisisAudioAndRespond(res, crisisReply, sentiment);
    }

    recordMemoryAsync(message, response, memory, sentiment);

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

    let memory = loadMemory();
    const checkin = consumeCrisisCheckIn(memory);
    memory = checkin.memory;
    if (checkin.checkInNote) saveMemory(memory);
    const memoryBlock = buildMemoryBlock(memory, checkin.checkInNote);

    if (caption && detectExplicitCrisis(caption).isCrisis) {
      const crisisReply = await getCrisisResponse(caption, 'explicit', conversationHistory, memoryBlock);
      memory = setCrisisFlag(memory, caption);
      saveMemory(memory);
      return generateCrisisAudioAndRespond(res, crisisReply, 'sad');
    }

    const { reply, sentiment } = await getImageReaction(base64Image, mimeType, caption, memoryBlock);

    extractVisualFact(base64Image, mimeType, caption)
      .then((fact) => {
        if (!fact) return;
        const current = loadMemory();
        saveMemory(addVisualFact(current, fact));
      })
      .catch((err) => console.error('Visual fact save failed:', err.message));

    memory.lastMessageTimestamp = Date.now();
    saveMemory(memory);

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