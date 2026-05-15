const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/ai/chat — proxy to Groq API (free & fast)
router.post('/chat', authenticate, async (req, res) => {
  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ 
      error: 'AI service not configured. Add GROQ_API_KEY to Railway environment variables.' 
    });
  }

  try {
    // Build messages array with system message prepended
    const groqMessages = [
      {
        role: 'system',
        content: system || 'You are a helpful AI assistant integrated into TaskFlow, a team task management platform.'
      },
      ...messages
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',  // Free, fast Llama 3 model
        max_tokens: 1024,
        messages: groqMessages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'AI API error' 
      });
    }

    const content = data.choices?.[0]?.message?.content || '';
    res.json({ content });

  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: 'Failed to reach AI service' });
  }
});

module.exports = router;
