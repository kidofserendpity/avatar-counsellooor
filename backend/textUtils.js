// Strips markdown formatting characters so text never gets displayed or
// spoken with literal asterisks/hashes/backticks — this is applied at the
// source, right where Aria's replies are generated, so it's impossible to
// forget at any individual call site later.
function cleanMarkdown(text) {
  if (!text) return text;
  let cleaned = text;

  cleaned = cleaned.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  cleaned = cleaned.replace(/_(.+?)_/g, '$1');
  cleaned = cleaned.replace(/~~(.+?)~~/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/^[ \t]*[-*•]\s+/gm, '');
  cleaned = cleaned.replace(/^[ \t]*\d+\.\s+/gm, '');
  // Catch-all for any stray markers the patterns above didn't pair up
  cleaned = cleaned.replace(/[*_`~#]/g, '');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

// Removes emoji specifically for the TTS path — text shown on screen keeps
// emoji, only the audio version gets stripped, since a voice engine has no
// good way to "say" 😊 out loud.
function stripEmoji(text) {
  if (!text) return text;
  return text
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

module.exports = { cleanMarkdown, stripEmoji };