// ===== Fabbly AI Chat Widget =====
document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = document.getElementById('chatWidget');
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatMinimizeBtn = document.getElementById('chatMinimizeBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatSuggestions = document.getElementById('chatSuggestions');
    const chatBadge = document.getElementById('chatBadge');
    const chatIconOpen = chatToggleBtn?.querySelector('.chat-icon-open');
    const chatIconClose = chatToggleBtn?.querySelector('.chat-icon-close');

    if (!chatWidget || !chatToggleBtn || !chatWindow) return;

    let isOpen = false;

    // ---- Persistent User ID (for memory system) ----
    function getOrCreateUserId() {
        const KEY = 'fabbly_user_id';
        let uid = localStorage.getItem(KEY);
        if (!uid) {
            // Use crypto.randomUUID if available, else fallback
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                uid = crypto.randomUUID();
            } else {
                uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            }
            localStorage.setItem(KEY, uid);
        }
        return uid;
    }
    const USER_ID = getOrCreateUserId();

    // ---- Toggle chat open/close ----
    function openChat() {
        isOpen = true;
        chatWindow.classList.add('open');
        chatToggleBtn.classList.add('active');
        if (chatIconOpen) chatIconOpen.style.display = 'none';
        if (chatIconClose) chatIconClose.style.display = 'block';
        if (chatBadge) chatBadge.style.display = 'none';
        chatInput?.focus();
        scrollToBottom();
    }

    function closeChat() {
        isOpen = false;
        chatWindow.classList.remove('open');
        chatToggleBtn.classList.remove('active');
        if (chatIconOpen) chatIconOpen.style.display = 'block';
        if (chatIconClose) chatIconClose.style.display = 'none';
    }

    chatToggleBtn.addEventListener('click', () => {
        if (isOpen) closeChat();
        else openChat();
    });

    if (chatMinimizeBtn) {
        chatMinimizeBtn.addEventListener('click', closeChat);
    }

    // ---- Message helpers ----
    function getTimestamp() {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    }

    function scrollToBottom() {
        if (chatMessages) {
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender === 'user' ? 'user-message' : 'bot-message'}`;

        if (sender === 'bot') {
            msgDiv.innerHTML = `
                <div class="chat-message-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                    </svg>
                </div>
                <div class="chat-bubble">
                    <p>${text}</p>
                    <span class="chat-time">${getTimestamp()}</span>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="chat-bubble">
                    <p>${text}</p>
                    <span class="chat-time">${getTimestamp()}</span>
                </div>
            `;
        }

        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot-message chat-typing';
        typingDiv.id = 'chatTypingIndicator';
        typingDiv.innerHTML = `
            <div class="chat-message-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                </svg>
            </div>
            <div class="chat-bubble typing-bubble">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('chatTypingIndicator');
        if (indicator) indicator.remove();
    }

    // ---- Webhook URL ----
    const WEBHOOK_URL = 'https://personal-assistant-4rc3.onrender.com/webhook/chat';

    // ---- Send message ----
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        chatInput.value = '';
        chatSendBtn.disabled = true;

        // Hide suggestion chips after first user message
        if (chatSuggestions) {
            chatSuggestions.style.display = 'none';
        }

        // Show typing indicator while waiting
        showTypingIndicator();

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    userId: USER_ID,
                    sessionId: USER_ID
                })
            });

            removeTypingIndicator();

            if (response.ok) {
                const data = await response.json();
                const botReply = data.output || data.reply || data.text || data.response ||
                                 (Array.isArray(data) ? data[0]?.output || data[0]?.reply || data[0]?.text || data[0]?.response : null) ||
                                 (typeof data === 'string' ? data : null);
                if (botReply) {
                    addMessage(botReply, 'bot');
                }
            }
        } catch (err) {
            removeTypingIndicator();
            // Silent fail — no error shown to the user
        }
    }

    // ---- Event listeners ----
    chatSendBtn.addEventListener('click', handleSend);

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    chatInput.addEventListener('input', () => {
        chatSendBtn.disabled = chatInput.value.trim().length === 0;
    });

    // Quick suggestion chips
    if (chatSuggestions) {
        chatSuggestions.addEventListener('click', (e) => {
            const chip = e.target.closest('.chat-suggestion-chip');
            if (!chip) return;
            const msg = chip.getAttribute('data-msg');
            if (msg) {
                chatInput.value = msg;
                chatSendBtn.disabled = false;
                handleSend();
            }
        });
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) closeChat();
    });
});
