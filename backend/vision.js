const Groq = require('groq-sdk');
const { CBT_SYSTEM_PROMPT } = require('./dialogue');
const { cleanMarkdown } = require('./textUtils');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VISION_REACTION_PROMPT = `The person just shared a photo with you, maybe with a short caption. Actually look at what's specifically in the image and react to it like a person seeing it for real — notice concrete details, not generic compliments. If there's a caption, weave your response to it into the same reaction, not addressed separately.

Respond in exactly this format, two lines:
REPLY: <your 2-4 sentence in-character reaction, always finishing the thought>
SENTIMENT: <one word: calm, anxious, sad, hopeful, or angry — the overall mood of the image and moment>`;

const VISUAL_FACT_PROMPT = `You're looking at a photo someone shared with an AI companion, possibly with a short caption. Write ONE short, plain, respectful factual description that could help recall who or what was in the photo later — for a person: general appearance (hair, approximate age range, notable features, expression), described plainly, never evaluated or judged. For anything else, the key subject of the photo. If the caption makes clear who this person is to the user (e.g. someone they mentioned), include that briefly. Under 25 words, third person, description only — no commentary. Respond with only the description.`;

function imageContent(promptText, base64Image, mimeType, caption) {
  const text = caption && caption.trim()
    ? `${promptText}\n\nCaption from the person: "${caption.trim()}"`
    : promptText;
  return [
    { type: 'text', text },
    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
  ];
}

const getImageReaction = async (base64Image, mimeType, caption, memoryBlock = '') => {
  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3.6-27b',
    messages: [
      { role: 'system', content: CBT_SYSTEM_PROMPT + memoryBlock },
      { role: 'user', content: imageContent(VISION_REACTION_PROMPT, base64Image, mimeType, caption) }
    ],
    max_tokens: 280,
    temperature: 0.85,
  });

  const raw = completion.choices[0].message.content.trim();
  const replyMatch = raw.match(/REPLY:\s*([\s\S]+?)(?:\nSENTIMENT:|$)/i);
  const sentimentMatch = raw.match(/SENTIMENT:\s*(calm|anxious|sad|hopeful|angry)/i);

  const reply = cleanMarkdown(replyMatch ? replyMatch[1].trim() : raw);
  const validSentiments = ['calm', 'anxious', 'sad', 'hopeful', 'angry'];
  const sentiment = sentimentMatch && validSentiments.includes(sentimentMatch[1].toLowerCase())
    ? sentimentMatch[1].toLowerCase()
    : 'calm';

  return { reply, sentiment };
};

const extractVisualFact = async (base64Image, mimeType, caption) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.6-27b',
      messages: [
        { role: 'system', content: VISUAL_FACT_PROMPT },
        { role: 'user', content: imageContent('Describe this photo.', base64Image, mimeType, caption) }
      ],
      max_tokens: 60,
      temperature: 0.3,
    });
    const fact = completion.choices[0].message.content.trim();
    return fact.length < 3 ? null : fact;
  } catch (err) {
    console.error('Visual fact extraction failed:', err.message);
    return null;
  }
};

module.exports = { getImageReaction, extractVisualFact };