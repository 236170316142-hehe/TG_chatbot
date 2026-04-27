document.addEventListener('DOMContentLoaded', () => {
    const chatTrigger = document.getElementById('chat-trigger');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const userInput = document.getElementById('user-input');
    const sendMessage = document.getElementById('send-message');
    const chatMessages = document.getElementById('chat-messages');

    let chatHistory = [];

    // Toggle Chat Window
    chatTrigger.addEventListener('click', () => {
        chatWindow.classList.remove('hidden');
        userInput.focus();
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });

    // Send Message Logic
    const handleSend = async () => {
        const text = userInput.value.trim();
        if (!text) return;

        // Add user message to UI
        appendMessage('user', text);
        userInput.value = '';

        // Show typing indicator
        const typingIndicator = showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: text,
                    history: chatHistory
                }),
            });

            const data = await response.json();
            
            // Remove typing indicator
            typingIndicator.remove();

            if (data.response) {
                appendMessage('bot', data.response);
                appendAgentFooter();
                // Update history
                chatHistory.push({ role: 'user', content: text });
                chatHistory.push({ role: 'assistant', content: data.response });
                // Keep history manageable
                if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
            } else {
                appendMessage('bot', 'Sorry, I encountered an error. Please try again later.');
            }
        } catch (error) {
            typingIndicator.remove();
            appendMessage('bot', 'Network error. Make sure the server is running and API key is set.');
            console.error('Error:', error);
        }
    };

    sendMessage.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // Helper functions
    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        // Parse markdown for bot messages
        const content = sender === 'bot' ? marked.parse(text) : text;
        
        msgDiv.innerHTML = `<div class="message-content">${content}</div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendAgentFooter() {
        const footerDiv = document.createElement('div');
        footerDiv.className = 'agent-footer';
        footerDiv.innerHTML = `
            <div><i class="fas fa-shield-alt"></i> Official TeamGrid AI Agent | Privacy-First Intelligence</div>
            <div class="support-email">Need Help? <a href="mailto:support@teamgrid.ai">support@teamgrid.ai</a></div>
        `;
        chatMessages.appendChild(footerDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot typing';
        indicator.innerHTML = '<div class="message-content">Thinking...</div>';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return indicator;
    }
});
