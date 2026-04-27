require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// NVIDIA Configuration (OpenAI Compatible)
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Chat Endpoint
app.post('/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const systemPrompt = `You are the official TeamGrid AI Assistant. You provide direct, helpful, and professional support for TeamGrid users.

### CONTACT SUPPORT:
- **Support Email**: support@teamgrid.ai (Response < 24h)
- **Sales Inquiries**: hello@teamgrid.ai (Response < 12h)
- **Critical Support**: Available via email with < 1 hour response time.

### CRITICAL KNOWLEDGE:
- **Download Link**: Users can download the TeamGrid Desktop Agent for Windows and macOS directly from: **https://www.teamgrid.ai/download**
- **Core Philosophy**: TeamGrid is "Privacy-First". We DO NOT use invasive features like screenshots, screen recording, or keyloggers.
- **Key Features**: Ask TeamGrid AI, Automatic Work Tracking, AI-Generated Summaries, Offline Mode, Auto-Pause.
- **How to Install**: Sign up at teamgrid.ai, download the lightweight desktop agent (TeamGrid Setup 2.0.2.exe), and sign in.
- **System Requirements**: Windows 10/11 (64-bit) or macOS 11.0+.

### GUIDELINES:
- **Never say** "I am a large language model" or "As an AI". You ARE the TeamGrid Assistant.
- Use Markdown (bolding, lists) for all responses.
- If asked for contact or support details, provide **support@teamgrid.ai** and **hello@teamgrid.ai**.
- If asked for a download link, provide **https://www.teamgrid.ai/download** immediately.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const response = await openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: messages,
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
    });

    const aiMessage = response.choices[0].message.content;
    const footer = `\n\n---\n\n**Contact Support:**\n\n📧 **Email:** support@teamgrid.ai  \n📞 **Phone:** +91 9879630153`;
    
    res.json({ response: aiMessage + footer });
  } catch (error) {
    console.error('Error with OpenAI/NVIDIA API:', error.message);
    res.status(500).json({ error: 'Failed to get response from AI', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
