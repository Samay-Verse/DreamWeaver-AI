const BASE_URL = 'http://localhost:3000';
const sidebar = document.getElementById('sidebar');
const expandedMenu = document.getElementById('expanded-menu');
const navLinks = document.querySelectorAll('.nav-link');
const addBtn = document.getElementById('add-btn');
const mainContent = document.getElementById('main-content');
const dreamSpaceSection = document.getElementById('dream-space-section');
const soulSafeSection = document.getElementById('soul-safe-section');
const userAccount = document.getElementById('user-account');
const userDropdown = document.getElementById('user-dropdown');
let searchInput = document.getElementById('search-input');
let submitButton = document.getElementById('submit-button');
const searchContainer = document.getElementById('search-container');
const logoText = document.getElementById('logo-text');
const chatList = document.getElementById('chat-list');
const menuToggle = document.getElementById('menu-toggle');

// Toggle sidebar and expanded menu on mobile
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    expandedMenu.classList.toggle('active');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('active');
        expandedMenu.classList.remove('active');
    }
});

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
let token = urlParams.get('token') || localStorage.getItem('dreamweaver_token');
if (!token) {
    window.location.href = 'loginPage.html';
} else {
    localStorage.setItem('dreamweaver_token', token);
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('dreamweaver_token');
    token = null;
    userDropdown.classList.remove('active');
    window.location.href = 'loginPage.html';
}

// Helper function to make authenticated API requests
async function makeAuthenticatedRequest(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };
    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (response.status === 401) {
            localStorage.removeItem('dreamweaver_token');
            window.location.href = 'loginPage.html';
            throw new Error('Session expired. Please log in again.');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Load existing chats
async function loadChats() {
    try {
        const chats = await makeAuthenticatedRequest(`${BASE_URL}/api/chats`);
        chatList.innerHTML = '';
        if (!chats || chats.length === 0) {
            chatList.innerHTML = '<li class="section-header">No chats yet. Start a new conversation!</li>';
            return;
        }

        chats.forEach(chat => {
            const chatItem = document.createElement('li');
            chatItem.classList.add('chat-item');
            chatItem.innerHTML = `
                <a href="#" class="expanded-menu-item" data-chat-id="${chat._id}">${chat.title || 'Untitled Chat'}</a>
                <button class="delete-chat-btn" data-chat-id="${chat._id}" aria-label="Delete chat">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#666" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-10 4v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8H6z"/>
                    </svg>
                </button>
            `;
            chatList.appendChild(chatItem);
        });

        document.querySelectorAll('.expanded-menu-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const chatId = item.getAttribute('data-chat-id');
                await loadChat(chatId);
                sidebar.classList.remove('active');
                expandedMenu.classList.remove('active');
            });
        });

        document.querySelectorAll('.delete-chat-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const chatId = button.getAttribute('data-chat-id');
                if (confirm('Are you sure you want to delete this chat?')) {
                    await deleteChat(chatId);
                }
            });
        });
    } catch (err) {
        console.error('Error loading chats:', err);
        chatList.innerHTML = '<li class="section-header">Failed to load chats.</li>';
        alert('Failed to load chats: ' + err.message);
    }
}

// Delete a specific chat
async function deleteChat(chatId) {
    try {
        await makeAuthenticatedRequest(`${BASE_URL}/api/chats/${chatId}`, {
            method: 'DELETE',
        });
        await loadChats();
        if (currentChatId === chatId) {
            const homeLink = document.querySelector('.nav-link[data-section="home"]');
            if (homeLink) homeLink.click();
            isChatActive = false;
            currentChatId = null;
        }
    } catch (err) {
        console.error('Error deleting chat:', err);
        alert('Failed to delete chat: ' + err.message);
    }
}

// Load a specific chat
async function loadChat(chatId) {
    try {
        const chat = await makeAuthenticatedRequest(`${BASE_URL}/api/chats/${chatId}`);
        if (!chat) throw new Error('Chat not found');

        if (!isChatActive) transitionToChat();
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) throw new Error('Chat messages container not found');

        chatMessages.innerHTML = '';
        chat.messages.forEach(msg => addMessage(msg.content, msg.sender, chatMessages));
        currentChatId = chatId;
    } catch (err) {
        console.error('Error loading chat:', err);
        alert('Failed to load chat: ' + err.message);
    }
}

// Handle navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(item => item.classList.remove('active'));
        link.classList.add('active');

        const section = link.getAttribute('data-section');
        const menuTitle = document.querySelector('.expanded-menu-title');
        if (menuTitle) menuTitle.firstChild.textContent = link.textContent.trim();

        expandedMenu.style.display = 'none';
        mainContent.style.display = 'none';
        dreamSpaceSection.classList.remove('active');
        soulSafeSection.classList.remove('active');

        if (section === 'home') {
            expandedMenu.style.display = 'block';
            mainContent.style.display = 'flex';
            loadChats();
        } else if (section === 'dream-space') {
            dreamSpaceSection.classList.add('active');
        } else if (section === 'soul-safe') {
            soulSafeSection.classList.add('active');
        }

        sidebar.classList.remove('actave');
        expandedMenu.classList.remove('active');
    });
});

// Handle add button
addBtn.addEventListener('click', () => {
    const homeLink = document.querySelector('.nav-link[data-section="home"]');
    if (homeLink) homeLink.click();
    if (isChatActive) {
        mainContent.innerHTML = `
            <div class="logo-text" id="logo-text">DreamWeaver</div>
            <div class="search-container" id="search-container">
                <div class="input-container">
                    <input type="text" class="search-input" id="search-input" placeholder="Ask anything..."
                        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                </div>
                <div class="search-actions">
                    <div class="search-modes">
                        <div class="search-mode active">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <path d="M16 13H8" />
                                <path d="M16 17H8" />
                                <path d="M10 9H8" />
                            </svg>
                        </div>
                        <div class="search-mode">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 19l-2-2 2-2m0 0H7v-5m5 7l2-2m-2-2l2 2m0-4l2 2 2-2m0 0V7h5m-7 7l-2 2" />
                            </svg>
                        </div>
                    </div>
                    <div class="search-tools">
                        <div class="tool-button" id="file-upload-initial">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
                                <path d="M19 10a7 7 0 0 1-14 0" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        </div>
                        <div class="tool-button" id="sparkle-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 3l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
                            </svg>
                        </div>
                        <div class="submit-button" id="submit-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="example-prompts">
                    <p>How can I help you today? Try one of these examples:</p>
                    <div class="prompt-buttons">
                        <button class="prompt-button"
                            onclick="document.getElementById('search-input').value='Help me interpret my dream about flying'; document.getElementById('submit-button').click();">Help
                            me interpret my dream about flying</button>
                        <button class="prompt-button"
                            onclick="document.getElementById('search-input').value='Suggest some self-care activities'; document.getElementById('submit-button').click();">Suggest
                            some self-care activities</button>
                        <button class="prompt-button"
                            onclick="document.getElementById('search-input').value='Tell me a positive affirmation'; document.getElementById('submit-button').click();">Tell
                            me a positive affirmation</button>
                        <button class="prompt-button"
                            onclick="document.getElementById('search-input').value='Help me remember a happy moment'; document.getElementById('submit-button').click();">Help
                            me remember a happy moment</button>
                    </div>
                </div>
            </div>
        `;
        searchInput = document.getElementById('search-input');
        submitButton = document.getElementById('submit-button');
        bindEventListeners();
        isChatActive = false;
        currentChatId = null;
    }
});

// Search mode toggle
const searchModes = document.querySelectorAll('.search-mode');
searchModes.forEach(mode => {
    mode.addEventListener('click', () => {
        searchModes.forEach(searchMode => searchMode.classList.remove('active'));
        mode.classList.add('active');
    });
});

// Tool buttons hover effect
const applyToolButtonHoverEffects = (buttons) => {
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#f0f0f0';
            button.style.color = '#2f2f2f';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '';
            button.style.color = '';
        });
    });
};

applyToolButtonHoverEffects(document.querySelectorAll('.tool-button'));

// User account dropdown toggle
userAccount.addEventListener('click', () => {
    userDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!userAccount.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
});

// File upload and sparkle buttons
document.getElementById('file-upload-initial').addEventListener('click', () => {
    alert('File upload functionality is not implemented yet.');
});
document.getElementById('sparkle-button').addEventListener('click', () => {
    alert('Sparkle functionality is not implemented yet.');
});

// Chat functionality
let isChatActive = false;
let currentChatId = null;
// Store speech instances for each message
const speechInstances = new Map();

// Language detection heuristic (simplified)
function detectLanguage(text) {
    // Common characters for language detection
    const languagePatterns = [
        { lang: 'en-US', pattern: /[a-zA-Z]/, name: 'English' }, // English
        { lang: 'es-ES', pattern: /[áéíóúñ¿¡]/, name: 'Spanish' }, // Spanish
        { lang: 'fr-FR', pattern: /[àâäéèêëîïôœùûüç]/, name: 'French' }, // French
        { lang: 'de-DE', pattern: /[äöüß]/, name: 'German' }, // German
        { lang: 'zh-CN', pattern: /[\u4e00-\u9fa5]/, name: 'Chinese' }, // Chinese
        { lang: 'ja-JP', pattern: /[\u3040-\u30ff]/, name: 'Japanese' }, // Japanese
        { lang: 'ko-KR', pattern: /[\uac00-\ud7a3]/, name: 'Korean' }, // Korean
        { lang: 'ru-RU', pattern: /[\u0400-\u04ff]/, name: 'Russian' }, // Russian
        { lang: 'ar-SA', pattern: /[\u0600-\u06ff]/, name: 'Arabic' }, // Arabic
        { lang: 'hi-IN', pattern: /[\u0900-\u097f]/, name: 'Hindi' }, // Hindi
    ];

    for (const { lang, pattern } of languagePatterns) {
        if (pattern.test(text)) {
            return lang;
        }
    }
    return 'en-US'; // Default to English
}

// Load voices and select a female voice
let voices = [];
let femaleVoice = null;

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    // Look for a female voice (names vary by browser/OS)
    femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.includes('Zira') || // Microsoft Zira (Windows)
        voice.name.includes('Samantha') || // macOS
        voice.name.includes('Tessa') || // macOS
        voice.name.includes('Google US English') // Chrome
    ) || voices.find(voice => voice.lang === 'en-US'); // Fallback to any en-US voice
}

// Ensure voices are loaded (some browsers load voices asynchronously)
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices(); // Initial load

function transitionToChat() {
    mainContent.innerHTML = `
        <div class="chat-container">
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-container">
                <div class="chat-tools">
                    <div class="tool-button" id="file-upload">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                            <path d="M10 9H8" />
                        </svg>
                    </div>
                    <div class="tool-button" id="voice-assistant">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 19l-2-2 2-2m0 0H7v-5m5 7l2-2m-2-2l2 2m0-4l2 2 2-2m0 0V7h5m-7 7l-2 2" />
                        </svg>
                    </div>
                </div>
                <input type="text" class="search-input" id="search-input" placeholder="Ask anything..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                <div class="search-tools">
                    <div class="tool-button" id="sparkle-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                            <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
                            <path d="M19 10a7 7 0 0 1-14 0" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <div class="submit-button" id="submit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `;
    searchInput = document.getElementById('search-input');
    submitButton = document.getElementById('submit-button');
    const chatMessages = document.getElementById('chat-messages');
    if (!searchInput || !submitButton || !chatMessages) {
        alert('Error loading chat UI. Please refresh the page.');
        return { chatMessages: null };
    }
    bindEventListeners();
    document.getElementById('file-upload').addEventListener('click', () => alert('File upload not implemented.'));
    document.getElementById('voice-assistant').addEventListener('click', () => alert('Voice assistant not implemented.'));
    document.getElementById('sparkle-button').addEventListener('click', () => alert('Sparkle not implemented.'));
    applyToolButtonHoverEffects(document.querySelectorAll('.tool-button'));
    isChatActive = true;
    return { chatMessages };
}

function addMessage(content, type, chatMessages, withTyping = false) {
    if (!chatMessages) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type);
    const messageId = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Unique ID for each message
    if (type === 'ai') {
        messageDiv.innerHTML = `
            <div class="message-header">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="1.5">
                    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="#4CAF50" stroke="#4CAF50"/>
                    <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" fill="#81C784" stroke="#4CAF50"/>
                    <path d="M17 16L17.3 17.5L18.5 18L17.3 18.5L17 20L16.7 18.5L15.5 18L16.7 17.5L17 16Z" fill="#81C784" stroke="#4CAF50"/>
                </svg>
            </div>
            <div class="message-content">
                <span class="message-text"></span>
            </div>
            <div class="speaker-container" data-message-id="${messageId}">
                <button class="speaker-button" aria-label="Play audio">
                    <svg class="speaker-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#666" stroke-width="2">
                        <path d="M3 9v6h4l5 5V4L7 9H3z"/>
                        <path d="M16 9a4 4 0 0 1 0 6"/>
                        <path d="M18 7a6 6 0 0 1 0 10"/>
                    </svg>
                    <svg class="pause-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#666" stroke-width="2" style="display: none;">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                </button>
            </div>
        `;
        const messageText = messageDiv.querySelector('.message-text');
        if (withTyping) {
            typeMessage(content, messageText);
        } else {
            messageText.textContent = content;
        }
        const speakerButton = messageDiv.querySelector('.speaker-button');
        speakerButton.addEventListener('click', () => toggleSpeech(content, speakerButton, messageId));
    } else if (type === 'loading') {
        messageDiv.innerHTML = `
            <div class="message-header">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="1.5">
                    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="#4CAF50" stroke="#4CAF50"/>
                    <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" fill="#81C784" stroke="#4CAF50"/>
                    <path d="M17 16L17.3 17.5L18.5 18L17.3 18.5L17 20L16.7 18.5L15.5 18L16.7 17.5L17 16Z" fill="#81C784" stroke="#4CAF50"/>
                </svg>
            </div>
            <div class="message-content loading"><span>Generating...</span></div>
        `;
    } else {
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    }
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Typing effect for AI messages
function typeMessage(content, element) {
    let index = 0;
    const speed = 30; // Typing speed in ms
    function type() {
        if (index < content.length) {
            element.textContent += content.charAt(index);
            index++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Text-to-speech functionality
function toggleSpeech(text, button, messageId) {
    const speakerIcon = button.querySelector('.speaker-icon');
    const pauseIcon = button.querySelector('.pause-icon');

    let speechInstance = speechInstances.get(messageId);

    // Stop any currently playing speech for this message
    if (speechInstance) {
        window.speechSynthesis.cancel(); // Cancel the current speech
        speechInstances.delete(messageId); // Remove the instance
        speechInstance = null;
        speakerIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        return; // Toggle to stop
    }

    // Detect the language of the text
    const detectedLang = detectLanguage(text);

    // Start new speech
    speechInstance = new SpeechSynthesisUtterance(text);
    speechInstance.lang = detectedLang;

    // Select a voice for the detected language, preferring a female voice
    let voiceForLang = voices.find(voice => 
        voice.lang === detectedLang && (
            voice.name.toLowerCase().includes('female') ||
            voice.name.includes('Zira') ||
            voice.name.includes('Samantha') ||
            voice.name.includes('Tessa') ||
            voice.name.includes('Google')
        )
    ) || voices.find(voice => voice.lang === detectedLang) || femaleVoice;

    if (voiceForLang) {
        speechInstance.voice = voiceForLang;
    } else {
        console.warn(`No voice found for language ${detectedLang}. Using default female voice.`);
        speechInstance.voice = femaleVoice;
    }

    speechInstance.onend = () => {
        speechInstances.delete(messageId);
        speakerIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    };
    speechInstance.onpause = () => {
        speakerIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    };
    speechInstance.onresume = () => {
        speakerIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    };

    // Store the speech instance for this message
    speechInstances.set(messageId, speechInstance);

    // Play the speech
    window.speechSynthesis.speak(speechInstance);
    speakerIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
}

async function handleSubmit() {
    const userInput = searchInput.value.trim();
    if (!userInput) return;
    let chatMessages;
    if (!isChatActive) {
        const { chatMessages: newChatMessages } = transitionToChat();
        chatMessages = newChatMessages;
        if (!chatMessages) return;
    } else {
        chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            alert('Error: Chat messages container not found.');
            return;
        }
    }
    addMessage(userInput, 'user', chatMessages);
    addMessage('', 'loading', chatMessages);
    try {
        const data = await makeAuthenticatedRequest(`${BASE_URL}/api/emotional-chat`, {
            method: 'POST',
            body: JSON.stringify({ input: userInput, chatId: currentChatId }),
        });
        const loadingMessage = chatMessages.querySelector('.message.loading');
        if (loadingMessage) loadingMessage.remove();
        addMessage(data.response, 'ai', chatMessages, true);
        currentChatId = data.chatId;
        await loadChats();
    } catch (err) {
        const loadingMessage = chatMessages.querySelector('.message.loading');
        if (loadingMessage) loadingMessage.remove();
        addMessage('Sorry, I couldn’t respond. Please try again.', 'ai', chatMessages);
        alert('Error: ' + err.message);
    }
    searchInput.value = '';
}

function bindEventListeners() {
    submitButton.addEventListener('click', handleSubmit);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });
}

// Initial event listeners
bindEventListeners();
if (token) loadChats();