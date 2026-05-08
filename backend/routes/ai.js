const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/ai/chat  — proxy to Anthropic API (avoids browser CORS)
router.post('/chat', authenticate, async (req, res) => {
  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured. Add ANTHROPIC_API_KEY to environment variables.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: system || 'You are a helpful AI assistant integrated into TaskFlow, a team task management platform.',
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'AI API error' });
    }

    res.json({ content: data.content?.[0]?.text || '' });
  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: 'Failed to reach AI service' });
  }
});

module.exports = router;
