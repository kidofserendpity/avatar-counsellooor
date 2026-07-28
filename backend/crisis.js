// Explicit, self-referential phrases only — deliberately narrow so things like
// "I want to kill him" (a threat toward someone else) never gets misread as
// suicidal ideation and given the wrong kind of response.
const EXPLICIT_CRISIS_PHRASES = [
  'kill myself', 'killing myself',
  'want to die', 'wanted to die', 'wish i was dead', 'wish i were dead',
  'end my life', 'ending my life', 'end my own life',
  'take my own life', 'taking my own life',
  'suicidal', 'commit suicide', 'attempt suicide',
  'better off dead', 'better off without me',
  'no reason to live', 'no reason to keep living', 'not worth living',
  'ready to end it', 'end it all', 'ending it all',
  'plan to kill myself', 'have a plan to end my life',
  'overdose on purpose',
  'hurt myself badly', 'seriously hurt myself', 'seriously harm myself'
];

function detectExplicitCrisis(message) {
  const lower = message.toLowerCase();
  const isCrisis = EXPLICIT_CRISIS_PHRASES.some(phrase => lower.includes(phrase));
  return { isCrisis, tier: isCrisis ? 'explicit' : null };
}

module.exports = { detectExplicitCrisis };