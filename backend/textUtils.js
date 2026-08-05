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
  cleaned = cleaned.replace(/[*_`~#]/g, '');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

function stripEmoji(text) {
  if (!text) return text;
  return text
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// TTS spells "A.R.I.A" out letter by letter because of the periods used
// for on-screen branding. This swaps that specific pattern back to the
// plain word before speech generation only, so it's actually pronounced
// as a name. Display text elsewhere is untouched.
function toSpokenForm(text) {
  if (!text) return text;
  return text.replace(/\bA\.\s*R\.\s*I\.\s*A\.?\b/gi, 'Aria');
}

function prepareSpeechText(text) {
  return toSpokenForm(stripEmoji(text));
}

module.exports = { cleanMarkdown, stripEmoji, toSpokenForm, prepareSpeechText };