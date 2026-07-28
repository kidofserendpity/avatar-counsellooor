const Groq = require('groq-sdk');
const fs = require('fs');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const transcribeAudio = async (audioFilePath) => {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-large-v3',
    response_format: 'text',
  });
  return transcription;
};

module.exports = { transcribeAudio };