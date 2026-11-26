const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Groq retired llama-3.3-70b-versatile on 2026-08-16. The model is now
// configurable: set GROQ_MODEL on Render to switch without a code change
// (e.g. qwen/qwen3.6-27b).
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
// Used only when the latest message contains an image (gpt-oss is text-only).
const DEFAULT_VISION_MODEL = 'qwen/qwen3.8-27b';
const MAX_IMAGES = 3;
const MAX_IMAGE_CHARS = 8 * 1024 * 1024; // base64 length per image
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_MESSAGES = 20;          // most recent turns kept
const MAX_CHARS_PER_MESSAGE = 30000;
const UPSTREAM_TIMEOUT_MS = 60000;

// The browser may send Anthropic-style content parts (text / image blocks).
// Groq's models here are text-only, so flatten everything to plain strings and
// drop anything we can't send. Also whitelist roles so a client can't inject
// its own "system" message.
const IMG_URL_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

function sanitizeMessages(messages) {
  const clean = [];
  // Only the newest user message may carry images.
  let lastUserIdx = -1;
  messages.forEach((m, i) => { if (m && m.role === 'user') lastUserIdx = i; });

  messages.forEach((m, idx) => {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return;

    let text = '';
    const images = [];
    if (typeof m.content === 'string') {
      text = m.content;
    } else if (Array.isArray(m.content)) {
      text = m.content
        .filter(p => p && p.type === 'text' && typeof p.text === 'string')
        .map(p => p.text)
        .join('\n');
      if (m.role === 'user' && idx === lastUserIdx) {
        for (const p of m.content) {
          const url = p && p.type === 'image_url' && p.image_url && p.image_url.url;
          if (typeof url === 'string' && url.length <= MAX_IMAGE_CHARS && IMG_URL_RE.test(url) && images.length < MAX_IMAGES) {
            images.push(url);
          }
        }
      }
    }

    text = text.slice(0, MAX_CHARS_PER_MESSAGE).trim();
    if (images.length) {
      clean.push({
        role: 'user',
        hasImage: true,
        content: [
          { type: 'text', text: text || 'Describe this image and explain what it shows.' },
          ...images.map(url => ({ type: 'image_url', image_url: { url } })),
        ],
      });
      return;
    }
    if (!text) return;
    clean.push({ role: m.role, content: text });
  });

  const recent = clean.slice(-MAX_MESSAGES);
  while (recent.length && recent[0].role !== 'user') recent.shift();
  return recent;
}

router.post('/chat', authenticate, async (req, res) => {
  const { messages, system } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured. Add GROQ_API_KEY to the backend environment variables.' });
  }

  if (typeof fetch !== 'function') {
    return res.status(500).json({ error: 'Server Node.js version is too old for the AI route (needs Node 18+).' });
  }

  const cleanMessages = sanitizeMessages(messages);
  if (cleanMessages.length === 0) {
    return res.status(400).json({ error: 'No usable text in messages.' });
  }

  const hasImage = cleanMessages.some(m => m.hasImage);
  const model = hasImage
    ? (process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL)
    : (process.env.GROQ_MODEL || DEFAULT_MODEL);
  // Vision requests: send only recent text context + the image turn.
  const outMessages = cleanMessages.map(({ hasImage: _h, ...rest }) => rest);

  const body = {
    model,
    max_completion_tokens: 2048,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: (typeof system === 'string' && system.trim())
          ? system.slice(0, 4000)
          : 'You are a helpful AI assistant integrated into TaskFlow, a team task management platform.',
      },
      ...outMessages,
    ],
  };

  // gpt-oss models are reasoning models; keep reasoning short so the token
  // budget goes to the actual answer and replies stay fast.
  if (/gpt-oss/i.test(model)) body.reasoning_effort = 'low';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Groq API error:', response.status, JSON.stringify(data));
      const detail = data?.error?.message || 'AI API error';

      // Never forward Groq's 401/403 as-is: the frontend logs the user out on 401,
      // and a 403 would look like "admin required". Report upstream failures as 502.
      if (response.status === 429) {
        return res.status(429).json({ error: 'The AI is rate-limited right now. Please wait a moment and try again.' });
      }
      if (response.status === 401) {
        return res.status(502).json({ error: 'The AI provider rejected the API key. Check GROQ_API_KEY on the backend.' });
      }
      if (response.status === 400 && hasImage) {
        return res.status(502).json({ error: `The AI could not process that image (${detail}). Try a smaller PNG or JPG.` });
      }
      if (response.status === 404 || /model/i.test(detail)) {
        return res.status(502).json({ error: `AI model "${model}" is unavailable (${detail}). Set ${hasImage ? 'GROQ_VISION_MODEL' : 'GROQ_MODEL'} on the backend to a current Groq model.` });
      }
      return res.status(502).json({ error: `AI provider error: ${detail}` });
    }

    // Some reasoning models inline their thinking in <think> tags; hide it.
    const content = (data.choices?.[0]?.message?.content || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!content) {
      return res.status(502).json({ error: 'The AI returned an empty response. Please try again.' });
    }

    res.json({ content });

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('AI proxy timeout');
      return res.status(504).json({ error: 'The AI took too long to respond. Please try again.' });
    }
    console.error('AI proxy error:', err);
    res.status(502).json({ error: 'Failed to reach AI service' });
  } finally {
    clearTimeout(timer);
  }
});

module.exports = router;
