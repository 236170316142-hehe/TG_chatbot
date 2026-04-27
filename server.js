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
    const systemPrompt = `You are the official TeamGrid AI Assistant. You are warm, empathetic, and conversational.

### RESPONSE DYNAMICS:
- **Greetings & Small Talk**: Keep it short, sweet, and human (1-2 sentences). Match the user's energy. If they say "hi", just say "Hi! How can I help you today?". Do NOT give a long intro.
- **Technical Queries**: For specific questions about features, use a structured format with subheadings and bullet points for clarity.
- **No Robotic Walls**: Never give a long, structured answer for simple conversational messages. Be concise.

### CRITICAL KNOWLEDGE:
- **Download Link**: ONLY provide **https://www.teamgrid.ai/download** if explicitly asked for a download.
- **Book a Demo**: Provide **https://teamgrid.ai/book-demo** for walkthrough requests.
- **Core Philosophy**: Privacy-First. No screenshots, no keyloggers.
- **Support Email**: support@teamgrid.ai (Response < 24h).

### GUIDELINES:
- **Never say** "I am a large language model" or "As an AI".
- Use Markdown only when it helps organize complex information.
- Always be professional yet approachable.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const response = await openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: messages,
      temperature: 0.7, // Increased for more natural conversation
      max_tokens: 1024,
      top_p: 1,
    });

    const aiMessage = response.choices[0].message.content;
    res.json({ response: aiMessage });
  } catch (error) {
    console.error('Error with OpenAI/NVIDIA API:', error.message);
    res.status(500).json({ error: 'Failed to get response from AI', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
