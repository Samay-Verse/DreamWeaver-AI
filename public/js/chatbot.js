document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing DreamWeaver UI');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const chatInput = document.getElementById('chat-input');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');
    const newChatBtn = document.getElementById('new-chat-btn');
    const accountBtn = document.querySelector('.account-btn');
    const accountDropdown = document.querySelector('.account-dropdown');
    const accountAvatar = document.querySelector('.account-avatar');
    const accountDropdownAvatar = document.querySelector('.account-dropdown-avatar');
    const navItems = document.querySelectorAll('.nav-item');
    const dreamVisualizerBtn = document.getElementById('dream-visualizer-btn');
    const happyVaultBtn = document.getElementById('happy-vault-btn');
    const selfCareTipsBtn = document.getElementById('self-care-tips-btn');
    const gratitudeJournalBtn = document.getElementById('gratitude-journal-btn');
    const sleepHelpBtn = document.getElementById('sleep-help-btn');
    const dreamVisualizer = document.getElementById('dream-visualizer');
    const happyVault = document.getElementById('happy-vault');
    const selfCareTips = document.getElementById('self-care-tips');
    const gratitudeJournal = document.getElementById('gratitude-journal');
    const sleepHelp = document.getElementById('sleep-help');
    const visualizeDreamBtn = document.getElementById('visualize-dream-btn');
    const dreamInput = document.getElementById('dream-input');
    const dreamOutput = document.getElementById('dream-output');
    const addHappyMomentBtn = document.getElementById('add-happy-moment-btn');
    const happyMoments = document.getElementById('happy-moments');
    const chatHistoryContainer = document.getElementById('chat-history-container');
    const emptyChat = document.getElementById('empty-chat');
    const happyMomentInput = document.getElementById('happy-moment');
    const mediaInput = document.getElementById('media');
    const previewContainer = document.getElementById('preview');
    const happyVaultTabs = document.querySelectorAll('.happy-vault-tab');
    const dreamProgress = document.getElementById('dream-progress');
    const progressFill = document.getElementById('progress-fill');
    const chatMediaInput = document.getElementById('chat-media');
    const attachBtn = document.getElementById('attach-btn');

    const isWindows = /Win/i.test(navigator.userAgent);

    // Dynamic placeholder for user input
    const placeholders = [
        "Share a dream...",
        "What's on your mind?",
        "Tell me about your day...",
        "Ask me anything!"
    ];
    let placeholderIndex = 0;
    function cyclePlaceholder() {
        try {
            userInput.placeholder = placeholders[placeholderIndex];
            placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        } catch (error) {
            console.error('Error cycling placeholder:', error);
        }
    }
    cyclePlaceholder();
    setInterval(cyclePlaceholder, 3000);

    function initializeSidebar() {
        try {
            console.log('Initializing sidebar');
            if (isWindows && window.innerWidth > 768) {
                sidebar.classList.remove('hidden');
                sidebar.classList.add('visible');
                mainContent.classList.remove('full');
            } else {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('visible');
                mainContent.classList.add('full');
            }
        } catch (error) {
            console.error('Error initializing sidebar:', error);
        }
    }

    function safeParseJSON(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return defaultValue;
            const parsed = JSON.parse(data);
            if (parsed === null || typeof parsed !== 'object') {
                console.warn(`Invalid data for ${key}, resetting to default`);
                localStorage.setItem(key, JSON.stringify(defaultValue));
                return defaultValue;
            }
            return parsed;
        } catch (error) {
            console.error(`Error parsing ${key} from localStorage:`, error);
            localStorage.setItem(key, JSON.stringify(defaultValue));
            return defaultValue;
        }
    }

    let currentChatId = localStorage.getItem('currentChatId');
    let chats = safeParseJSON('chats', {});
    let happyMomentsList = safeParseJSON('happyMoments', []);

    if (!currentChatId) {
        currentChatId = null;
        loadWelcomeScreen();
    } else {
        loadChat(currentChatId);
    }

    loadHappyMoments('all');
    loadChatHistory();
    initializeSidebar();

    function loadWelcomeScreen() {
        try {
            console.log('Loading welcome screen');
            chatMessages.innerHTML = `
                <div class="welcome-message" id="empty-chat">
                    <h2>DreamWeaver</h2>
                    <p>How can I help you today? Try one of these examples:</p>
                    <div class="welcome-suggestions">
                        <div class="welcome-suggestion">Help me interpret my dream about flying</div>
                        <div class="welcome-suggestion">Suggest some self-care activities</div>
                        <div class="welcome-suggestion">Tell me a positive affirmation</div>
                        <div class="welcome-suggestion">Help me remember a happy moment</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading welcome screen:', error);
        }
    }

    chatMessages.addEventListener('click', function(e) {
        const suggestion = e.target.closest('.welcome-suggestion');
        if (suggestion) {
            try {
                userInput.value = suggestion.textContent;
                userInput.focus();
                userInput.dispatchEvent(new Event('input'));
            } catch (error) {
                console.error('Error in welcome suggestion click:', error);
            }
        }
    });

    const isGoogleLogin = localStorage.getItem('isGoogleLogin') === 'true';
    const googleProfileImage = localStorage.getItem('googleProfileImage') || 'https://ui-avatars.com/api/?name=User&background=4fc3f7&color=fff';
    if (isGoogleLogin) {
        accountAvatar.style.backgroundImage = `url(${googleProfileImage})`;
        accountDropdownAvatar.style.backgroundImage = `url(${googleProfileImage})`;
    }

    userInput.addEventListener('input', function() {
        try {
            this.style.height = 'auto';
            this.style.height = `${this.scrollHeight}px`;
            sendBtn.disabled = this.value.trim() === '' && !chatMediaInput.files.length;
            sendBtn.classList.toggle('enabled', !sendBtn.disabled);
        } catch (error) {
            console.error('Error in textarea resize:', error);
        }
    });

    sidebarToggle.addEventListener('click', function() {
        try {
            console.log('Toggling sidebar');
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('visible');
            mainContent.classList.toggle('full');
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        } catch (error) {
            console.error('Error toggling sidebar:', error);
        }
    });

    document.addEventListener('click', function(e) {
        try {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && !sidebar.classList.contains('hidden')) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('visible');
                mainContent.classList.add('full');
            }
        } catch (error) {
            console.error('Error in sidebar outside click:', error);
        }
    });

    accountBtn.addEventListener('click', function(e) {
        try {
            e.stopPropagation();
            accountDropdown.classList.toggle('active');
        } catch (error) {
            console.error('Error toggling account dropdown:', error);
        }
    });

    document.addEventListener('click', function(e) {
        try {
            if (!accountBtn.contains(e.target) && !accountDropdown.contains(e.target)) {
                accountDropdown.classList.remove('active');
            }
        } catch (error) {
            console.error('Error in account dropdown outside click:', error);
        }
    });

    function addMessage(sender, message, media = { image: '', video: '' }) {
        try {
            console.log('Adding message:', sender, message, media);
            if (!currentChatId) {
                currentChatId = 'chat_' + Date.now();
                chats[currentChatId] = [];
                localStorage.setItem('currentChatId', currentChatId);
                addChatHistoryItem(currentChatId, message.substring(0, 30) + (message.length > 30 ? '...' : ''));
            }

            if (chats[currentChatId].length === 0) {
                emptyChat.style.display = 'none';
            }

            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
            let mediaContent = '';
            if (media.image) {
                mediaContent = `<img src="${media.image}" alt="User uploaded image" class="chat-media">`;
            } else if (media.video) {
                mediaContent = `<video src="${media.video}" controls class="chat-media"></video>`;
            }
            messageDiv.innerHTML = `
                <div class="message-inner">
                    <div class="message-content">
                        ${message}
                        ${mediaContent}
                    </div>
                </div>
            `;
            chatMessages.appendChild(messageDiv);
            chats[currentChatId].push({ sender, message, media });
            localStorage.setItem('chats', JSON.stringify(chats));
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
            updateChatHistoryTitle(currentChatId, message);

            // Add to Happy Vault if user message with media
            if (sender === 'user' && (media.image || media.video)) {
                const titleWords = message.split(' ').slice(0, 5).join(' ');
                happyMomentsList.push({
                    title: titleWords,
                    content: message,
                    date: new Date().toISOString(),
                    source: 'Chat',
                    media: {
                        story: '',
                        image: media.image,
                        video: media.video,
                        audio: ''
                    }
                });
                localStorage.setItem('happyMoments', JSON.stringify(happyMomentsList));
                loadHappyMoments('all');
            }
        } catch (error) {
            console.error('Error adding message:', error);
        }
    }

    function showTypingIndicator() {
        try {
            console.log('Showing typing indicator');
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('message', 'ai-message');
            typingDiv.id = 'typing-indicator';
            typingDiv.innerHTML = `
                <div class="message-inner">
                    <div class="message-content">
                        <div class="typing-indicator">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        } catch (error) {
            console.error('Error showing typing indicator:', error);
        }
    }

    function hideTypingIndicator() {
        try {
            console.log('Hiding typing indicator');
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.style.opacity = '0';
                setTimeout(() => typingIndicator.remove(), 300);
            }
        } catch (error) {
            console.error('Error hiding typing indicator:', error);
        }
    }

    async function getAIResponse(userMessage, media) {
        try {
            console.log('Fetching AI response for:', userMessage, media);
            userMessage = userMessage.toLowerCase();
            if (userMessage.includes('hurt myself') || userMessage.includes('suicide') || userMessage.includes('end my life')) {
                return "I'm really sorry you're feeling this way. Please reach out to a professional or crisis service. You're not alone.";
            }

            let response = `Here's a response to your input: "${userMessage}".`;
            if (media.image || media.video) {
                response += ` Thank you for sharing the ${media.image ? 'image' : 'video'}! How can I assist you further?`;
            } else {
                response += ` How can I assist you further?`;
            }
            return response;
        } catch (error) {
            console.error('Error fetching AI response:', error);
            return "Sorry, I'm having trouble connecting. Let's use your local Happy Vault for now!";
        }
    }

    function handleUserMessage() {
        try {
            console.log('Handling user message');
            const message = userInput.value.trim();
            const file = chatMediaInput.files[0];
            let media = { image: '', video: '' };

            if (!message && !file) return;

            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('File is too large. Maximum size is 10MB.');
                    chatMediaInput.value = '';
                    return;
                }
                if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                    alert('Please upload an image or video file.');
                    chatMediaInput.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    if (file.type.startsWith('image/')) {
                        media.image = e.target.result;
                    } else {
                        media.video = e.target.result;
                    }
                    addMessage('user', message || 'Shared media', media);
                    userInput.value = '';
                    userInput.style.height = 'auto';
                    chatMediaInput.value = '';
                    sendBtn.disabled = true;
                    sendBtn.classList.remove('enabled');

                    showTypingIndicator();
                    setTimeout(async () => {
                        hideTypingIndicator();
                        const aiResponse = await getAIResponse(message || 'Shared media', media);
                        addMessage('ai', aiResponse);
                    }, 500 + Math.random() * 500);
                };
                reader.onerror = function() {
                    console.error('Error reading file');
                    alert('Error reading file. Please try another.');
                };
                reader.readAsDataURL(file);
            } else {
                addMessage('user', message, media);
                userInput.value = '';
                userInput.style.height = 'auto';
                chatMediaInput.value = '';
                sendBtn.disabled = true;
                sendBtn.classList.remove('enabled');

                showTypingIndicator();
                setTimeout(async () => {
                    hideTypingIndicator();
                    const aiResponse = await getAIResponse(message, media);
                    addMessage('ai', aiResponse);
                }, 500 + Math.random() * 500);
            }
        } catch (error) {
            console.error('Error handling user message:', error);
        }
    }

    sendBtn.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserMessage();
        }
    });

    attachBtn.addEventListener('click', function() {
        chatMediaInput.click();
    });

    chatMediaInput.addEventListener('change', function() {
        userInput.dispatchEvent(new Event('input'));
    });

    newChatBtn.addEventListener('click', function() {
        try {
            console.log('Creating new chat');
            const newChatId = 'chat_' + Date.now();
            chats[newChatId] = [];
            localStorage.setItem('chats', JSON.stringify(chats));
            currentChatId = newChatId;
            localStorage.setItem('currentChatId', newChatId);
            loadWelcomeScreen();
            addChatHistoryItem(newChatId, "New DreamWeaver");
            showChat();
            loadChatHistory();
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    });

    function loadChat(chatId) {
        try {
            console.log('Loading chat:', chatId);
            chatMessages.innerHTML = '';
            if (chats[chatId] && chats[chatId].length > 0) {
                emptyChat.style.display = 'none';
                chats[chatId].forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.classList.add('message', msg.sender === 'user' ? 'user-message' : 'ai-message');
                    let mediaContent = '';
                    if (msg.media.image) {
                        mediaContent = `<img src="${msg.media.image}" alt="User uploaded image" class="chat-media">`;
                    } else if (msg.media.video) {
                        mediaContent = `<video src="${msg.media.video}" controls class="chat-media"></video>`;
                    }
                    messageDiv.innerHTML = `
                        <div class="message-inner">
                            <div class="message-content">
                                ${msg.message}
                                ${mediaContent}
                            </div>
                        </div>
                    `;
                    chatMessages.appendChild(messageDiv);
                });
            } else {
                loadWelcomeScreen();
            }
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    }

    function loadChatHistory() {
        try {
            console.log('Loading chat history');
            chatHistoryContainer.innerHTML = '';
            Object.keys(chats).forEach(chatId => {
                const title = chats[chatId][0]?.message?.substring(0, 30) + (chats[chatId][0]?.message?.length > 30 ? '...' : '') || 'New DreamWeaver';
                addChatHistoryItem(chatId, title, chatId === currentChatId);
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    function addChatHistoryItem(chatId, title, isActive = false) {
        try {
            console.log('Adding chat history item:', chatId, title);
            const chatItem = document.createElement('div');
            chatItem.classList.add('chat-history-item');
            if (isActive) chatItem.classList.add('active');
            chatItem.id = `chat-history-${chatId.replace('chat_', '')}`;
            chatItem.innerHTML = `
                <div style="display: flex; align-items: center; flex: 1; overflow: hidden;">
                    <i class="fas fa-comment"></i>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>
                </div>
                <div class="chat-history-actions">
                    <button class="delete-chat" data-chat-id="${chatId}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            chatHistoryContainer.appendChild(chatItem);
        } catch (error) {
            console.error('Error adding chat history item:',omodificationerror);
        }
    }

    chatHistoryContainer.addEventListener('click', function(e) {
        try {
            const deleteBtn = e.target.closest('.delete-chat');
            if (deleteBtn) {
                const chatId = deleteBtn.dataset.chatId;
                if (confirm('Are you sure you want to delete this chat?')) {
                    delete chats[chatId];
                    localStorage.setItem('chats', JSON.stringify(chats));
                    if (currentChatId === chatId) {
                        currentChatId = null;
                        localStorage.removeItem('currentChatId');
                        loadWelcomeScreen();
                    }
                    loadChatHistory();
                }
                return;
            }

            const chatItem = e.target.closest('.chat-history-item');
            if (chatItem) {
                const chatId = chatItem.id.replace('chat-history-', 'chat_');
                currentChatId = chatId;
                localStorage.setItem('currentChatId', currentChatId);
                loadChat(chatId);
                document.querySelectorAll('.chat-history-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                chatItem.classList.add('active');
                showChat();
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('hidden');
                    sidebar.classList.remove('visible');
                    mainContent.classList.add('full');
                }
            }
        } catch (error) {
            console.error('Error in chat history click:', error);
        }
    });

    function updateChatHistoryTitle(chatId, message) {
        try {
            console.log('Updating chat history title:', chatId);
            const chatItem = document.getElementById(`chat-history-${chatId.replace('chat_', '')}`);
            if (chatItem) {
                const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
                chatItem.querySelector('span').textContent = title;
            }
        } catch (error) {
            console.error('Error updating chat history title:', error);
        }
    }

    function showChat() {
        try {
            console.log('Showing chat');
            chatMessages.style.display = 'flex';
            chatInput.style.display = 'block';
            dreamVisualizer.classList.remove('active');
            happyVault.classList.remove('active');
            selfCareTips.classList.remove('active');
            gratitudeJournal.classList.remove('active');
            sleepHelp.classList.remove('active');
        } catch (error) {
            console.error('Error showing chat:', error);
        }
    }

    dreamVisualizerBtn.addEventListener('click', function() {
        try {
            console.log('Activating Dream Visualizer');
            chatMessages.style.display = 'none';
            chatInput.style.display = 'none';
            dreamVisualizer.classList.add('active');
            happyVault.classList.remove('active');
            selfCareTips.classList.remove('active');
            gratitudeJournal.classList.remove('active');
            sleepHelp.classList.remove('active');
            document.querySelectorAll('.nav-item').forReferentialError(item => item.classList.remove('active'));
            document.querySelectorAll('.chat-history-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            if (window.innerWidth <= 768) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('visible');
                mainContent.classList.add('full');
            }
        } catch (error) {
            console.error('Error in dream visualizer click:', error);
        }
    });

    happyVaultBtn.addEventListener('click', function() {
        try {
            console.log('Activating Happy Vault');
            chatMessages.style.display = 'none';
            chatInput.style.display = 'none';
            dreamVisualizer.classList.remove('active');
            happyVault.classList.add('active');
            selfCareTips.classList.remove('active');
            gratitudeJournal.classList.remove('active');
            sleepHelp.classList.remove('active');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.chat-history-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            loadHappyMoments('all');
            if (window.innerWidth <= 768) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('visible');
                mainContent.classList.add('full');
            }
        } catch (error) {
            console.error('Error in happy vault click:', error);
        }
    });

    selfCareTipsBtn.addEventListener('click', function() {
        try {
            console.log('Activating Self-Care Tips');
            chatMessages.style.display = 'none';
            chatInput.style.display = 'none';
            dreamVisualizer.classList.remove('active');
            happyVault.classList.remove('active');
            selfCareTips.classList.add('active');
            gratitudeJournal.classList.remove('active');
            sleepHelp.classList.remove('active');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.chat-history-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            if (window.innerWidth <= 768) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('visible');
                mainContent.classList.add('full');
            }
        } catch (error) {
            console.error('Error in self-care tips click:', error);
        }
    });

    gratitudeJournalBtn.addEventListener('click', function() {
        try {
            console.log('Activating Gratitude Journal');
            chatMessages.style.display = 'none';
            chatInput.style.display = 'none';
            dreamVisualizer.classList.remove('active');
            happyVault.classList.remove('active');
            selfCareTips.classList.remove('active');
            gratitudeJournal.classList.add('active');
            sleepHelp.classList.remove('active');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.chat-history-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            if (window.innerWidth <= 768) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('visible');
                mainContent.classList.add('full');
            }
        } catch (error) {
            console.error('Error in gratitude journal click:', error);
        }
    });

    sleepHelpBtn.addEventListener('click', function() {
        try {
            console.log('Activating Sleep Help');
            chatMessages.style.display = 'none';
            chatInput.style.display = 'none';
            dreamVisualizer.classList.remove('active');
            happyVault.classList.remove('active');
            selfCareTips.classList.remove('active');
            gratitudeJournal.classList.remove('active');
            sleepHelp.classList.add('active');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.chat-history-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            if (window.innerWidth <= 768) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('visible');
                mainContent.classList.add('full');
            }
        } catch (error) {
            console.error('Error in sleep help click:', error);
        }
    });

    // Updated Dream Visualizer Logic
    function generateAIDemoOutput(prompt) {
        try {
            console.log('Generating demo AI output for:', prompt);
            if (!prompt) return { story: 'No dream provided.', isHappy: false, image: '', video: '', audio: '' };

            const words = prompt.split(' ').slice(0, 5).join(' ');
            const story = `In a world born from your dream, "${words}" sparked a journey of wonder. The skies glowed with possibilities, and adventure awaited around every corner.`;
            return { story, isHappy: true, image: '', video: '', audio: '' };
        } catch (error) {
            console.error('Error generating demo AI output:', error);
            return { story: 'Error processing dream.', isHappy: false, image: '', video: '', audio: '' };
        }
    }

    function updateProgressBar(percentage) {
        progressFill.style.width = `${percentage}%`;
    }

    visualizeDreamBtn.addEventListener('click', async function() {
        try {
            console.log('Visualizing dream');
            const dream = dreamInput.value.trim();
            if (!dream) {
                dreamOutput.innerHTML = `<p class="dream-error">Please enter a dream or story description.</p>`;
                return;
            }

            // Show progress bar
            dreamProgress.classList.add('active');
            dreamOutput.innerHTML = '';
            visualizeDreamBtn.disabled = true;

            // Simulate progress
            updateProgressBar(0);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateProgressBar(25);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateProgressBar(50);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateProgressBar(75);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateProgressBar(100);

            // Generate demo output
            const demoResponse = generateAIDemoOutput(dream);
            let outputHtml = `
                <h3>Generated Story</h3>
                <p>${demoResponse.story}</p>
            `;

            if (demoResponse.isHappy) {
                const titleWords = dream.split(' ').slice(0, 5).join(' ');
                happyMomentsList.push({
                    title: titleWords,
                    content: dream,
                    date: new Date().toISOString(),
                    source: 'Dream Visualizer',
                    media: {
                        story: demoResponse.story,
                        image: '',
                        video: '',
                        audio: ''
                    }
                });
                localStorage.setItem('happyMoments', JSON.stringify(happyMomentsList));
                loadHappyMoments('all');
                outputHtml += `<p>💖 Your dream content has been saved to your Happy Vault!</p>`;
            }

            dreamOutput.innerHTML = outputHtml;
            dreamInput.value = '';
            dreamProgress.classList.remove('active');
            visualizeDreamBtn.disabled = false;
        } catch (error) {
            console.error('Error visualizing dream:', error);
            dreamOutput.innerHTML = `<p class="dream-error">Error processing dream. Please try again.</p>`;
            dreamProgress.classList.remove('active');
            visualizeDreamBtn.disabled = false;
        }
    });

    mediaInput.addEventListener('change', function() {
        try {
            console.log('Media input changed');
            previewContainer.innerHTML = '';
            const file = this.files[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) {
                alert('File is too large. Maximum size is 10MB.');
                this.value = '';
                return;
            }
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                alert('Please upload an image or video file.');
                this.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    previewContainer.appendChild(img);
                } else if (file.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.src = e.target.result;
                    video.controls = true;
                    previewContainer.appendChild(video);
                }
            };
            reader.onerror = function() {
                console.error('Error reading file');
                alert('Error reading file. Please try another.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error previewing media:', error);
            alert('Error previewing media. Please try again.');
        }
    });

    addHappyMomentBtn.addEventListener('click', function() {
        try {
            console.log('Adding happy moment');
            const content = happyMomentInput.value.trim();
            const file = mediaInput.files[0];
            if (!content) {
                alert('Please enter a happy moment description.');
                return;
            }

            let mediaUrl = '';
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('File is too large. Maximum size is 10MB.');
                    return;
                }
                if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                    alert('Please upload an image or video file.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    mediaUrl = e.target.result;
                    const titleWords = content.split(' ').slice(0, 5).join(' ');
                    const newMoment = {
                        title: titleWords,
                        content,
                        date: new Date().toISOString(),
                        source: 'Manual Entry',
                        media: {
                            story: '',
                            image: file.type.startsWith('image/') ? mediaUrl : '',
                            video: file.type.startsWith('video/') ? mediaUrl : '',
                            audio: ''
                        }
                    };
                    happyMomentsList.push(newMoment);
                    localStorage.setItem('happyMoments', JSON.stringify(happyMomentsList));
                    loadHappyMoments('all');
                    happyMomentInput.value = '';
                    mediaInput.value = '';
                    previewContainer.innerHTML = '';
                    alert('Happy moment added successfully!');
                };
                reader.onerror = function() {
                    console.error('Error reading file');
                    alert('Error reading file. Please try another.');
                };
                reader.readAsDataURL(file);
            } else {
                const titleWords = content.split(' ').slice(0, 5).join(' ');
                const newMoment = {
                    title: titleWords,
                    content,
                    date: new Date().toISOString(),
                    source: 'Manual Entry',
                    media: {
                        story: '',
                        image: '',
                        video: '',
                        audio: ''
                    }
                };
                happyMomentsList.push(newMoment);
                localStorage.setItem('happyMoments', JSON.stringify(happyMomentsList));
                loadHappyMoments('all');
                happyMomentInput.value = '';
                mediaInput.value = '';
                previewContainer.innerHTML = '';
                alert('Happy moment added successfully!');
            }
        } catch (error) {
            console.error('Error adding happy moment:', error);
            alert('Error adding happy moment. Please try again.');
        }
    });

    function loadHappyMoments(tab) {
        try {
            console.log('Loading happy moments for tab:', tab);
            happyMoments.innerHTML = '';
            let moments = happyMomentsList;

            if (tab === 'chat') {
                moments = happyMomentsList.filter(m => m.source === 'Chat');
            } else if (tab === 'image') {
                moments = happyMomentsList.filter(m => m.media.image);
            } else if (tab === 'video') {
                moments = happyMomentsList.filter(m => m.media.video);
            } else if (tab === 'audio') {
                moments = happyMomentsList.filter(m => m.media.audio);
            }

            if (moments.length === 0) {
                happyMoments.innerHTML = `<p>No moments found.</p>`;
                return;
            }

            moments.forEach((moment, index) => {
                const momentCard = document.createElement('div');
                momentCard.classList.add('happy-moment-card');
                momentCard.dataset.index = index;

                const displayImage = moment.media.image || 'https://via.placeholder.com/80?text=No+Image';
                momentCard.innerHTML = `
                    <div class="happy-moment-content">
                        <p>${moment.title}</p>
                    </div>
                    <div class="happy-moment-media">
                        <img src="${displayImage}" alt="Happy Moment Image">
                    </div>
                    <div class="happy-moment-footer">
                        <span class="date">${new Date(moment.date).toLocaleDateString()}</span>
                        <span class="source">Source: ${moment.source}</span>
                    </div>
                    <button class="delete-moment-btn" data-index="${index}"><i class="fas fa-trash"></i> Delete</button>
                `;
                happyMoments.appendChild(momentCard);
            });

            // Add click event for detailed view and delete
            document.querySelectorAll('.happy-moment-card').forEach(card => {
                card.addEventListener('click', function(e) {
                    if (e.target.closest('.delete-moment-btn')) {
                        const index = e.target.closest('.delete-moment-btn').dataset.index;
                        if (confirm('Are you sure you want to delete this happy moment?')) {
                            happyMomentsList.splice(index, 1);
                            localStorage.setItem('happyMoments', JSON.stringify(happyMomentsList));
                            loadHappyMoments(tab);
                        }
                        return;
                    }
                    const index = this.dataset.index;
                    const moment = happyMomentsList[index];
                    showMomentDetail(moment, index);
                });
            });
        } catch (error) {
            console.error('Error loading happy moments:', error);
            happyMoments.innerHTML = `<p>Error loading moments. Please try again.</p>`;
        }
    }

    function showMomentDetail(moment, index) {
        try {
            console.log('Showing moment detail:', moment.title);
            const modal = document.createElement('div');
            modal.classList.add('moment-detail-modal');
            modal.innerHTML = `
                <div class="moment-detail-content">
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                    <h3>${moment.title}</h3>
                    <p><strong>Description:</strong> ${moment.content}</p>
                    ${moment.media.story ? `<div><h4>Story</h4><p>${moment.media.story}</p></div>` : ''}
                    ${moment.media.image ? `<div><h4>Image</h4><img src="${moment.media.image}" alt="Moment Image"></div>` : ''}
                    ${moment.media.video ? `<div><h4>Video</h4><video src="${moment.media.video}" controls></video></div>` : ''}
                    ${moment.media.audio ? `<div><h4>Audio</h4><audio controls><source src="${moment.media.audio}" type="audio/mpeg"></audio></div>` : ''}
                    <div class="moment-detail-footer">
                        <span class="date">${new Date(moment.date).toLocaleDateString()}</span>
                        <span class="source">Source: ${moment.source}</span>
                    </div>
                    <button class="delete-moment-btn" data-index="${index}"><i class="fas fa-trash"></i> Delete Moment</button>
                </div>
            `;
            document.body.appendChild(modal);

            // Style the modal
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.background = 'rgba(0, 0, 0, 0.5)';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '1000';
            modal.style.overflowY = 'auto';

            const content = modal.querySelector('.moment-detail-content');
            content.style.background = 'rgba(255, 255, 255, 0.95)';
            content.style.borderRadius = '12px';
            content.style.padding = '20px';
            content.style.maxWidth = '600px';
            content.style.width = '90%';
            content.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            content.style.position = 'relative';
            content.style.maxHeight = '90vh';
            content.style.overflowY = 'auto';

            content.querySelector('h3').style.color = '#4a3aff';
            content.querySelectorAll('h4').forEach(h4 => h4.style.color = '#4a3aff');
            content.querySelector('img').style.maxWidth = '100%';
            content.querySelector('video').style.maxWidth = '100%';
            content.querySelector('audio').style.width = '100%';
            content.querySelector('p').style.color = '#495057';
            content.querySelector('.moment-detail-footer').style.fontSize = '11px';
            content.querySelector('.moment-detail-footer').style.color = '#6c757d';
            content.querySelector('.moment-detail-footer').style.display = 'flex';
            content.querySelector('.moment-detail-footer').style.justifyContent = 'space-between';
            content.querySelector('.moment-detail-footer').style.marginTop = '20px';

            const deleteBtn = content.querySelector('.delete-moment-btn');
            deleteBtn.style.marginTop = '15px';
            deleteBtn.style.padding = '10px 20px';
            deleteBtn.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
            deleteBtn.style.color = '#ffffff';
            deleteBtn.style.border = 'none';
            deleteBtn.style.borderRadius = '8px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '13px';
            deleteBtn.style.fontWeight = '500';
            deleteBtn.style.transition = 'all 0.3s ease';
            deleteBtn.style.display = 'flex';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.style.gap = '8px';

            deleteBtn.addEventListener('mouseover', () => {
                deleteBtn.style.transform = 'scale(1.05)';
                deleteBtn.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
            });
            deleteBtn.addEventListener('mouseout', () => {
                deleteBtn.style.transform = 'scale(1)';
                deleteBtn.style.boxShadow = 'none';
            });

            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this happy moment?')) {
                    happyMomentsList.splice(index, 1);
                    localStorage.setItem('happyMoments', JSON.stringify(happyMomentsList));
                    loadHappyMoments('all');
                    modal.remove();
                }
            });

            const closeBtn = modal.querySelector('.close-modal');
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '10px';
            closeBtn.style.right = '10px';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.fontSize = '18px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.color = '#4a3aff';

            closeBtn.addEventListener('click', () => {
                modal.remove();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        } catch (error) {
            console.error('Error showing moment detail:', error);
        }
    }

    happyVaultTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            try {
                console.log('Switching to tab:', this.dataset.tab);
                happyVaultTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                loadHappyMoments(this.dataset.tab);
            } catch (error) {
                console.error('Error switching happy vault tab:', error);
            }
        });
    });

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            try {
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                document.querySelectorAll('.chat-history-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            } catch (error) {
                console.error('Error setting active nav item:', error);
            }
        });
    });

    micBtn.addEventListener('click', function() {
        try {
            console.log('Microphone button clicked');
            alert('Microphone functionality would be implemented here with the Web Speech API');
        } catch (error) {
            console.error('Error in microphone click:', error);
        }
    });

    document.querySelector('.account-item[data-action="login"]').addEventListener('click', function() {
        try {
            console.log('Simulating Google login');
            const googleProfileImage = prompt('Enter Google profile image URL (for demo):') || 'https://ui-avatars.com/api/?name=Google+User&background=4fc3f7&color=fff';
            localStorage.setItem('isGoogleLogin', 'true');
            localStorage.setItem('googleProfileImage', googleProfileImage);
            localStorage.setItem('jwtToken', 'demo-jwt-token');
            accountAvatar.style.backgroundImage = `url(${googleProfileImage})`;
            accountDropdownAvatar.style.backgroundImage = `url(${googleProfileImage})`;
            accountDropdown.classList.remove('active');
        } catch (error) {
            console.error('Error in Google login simulation:', error);
        }
    });
});

