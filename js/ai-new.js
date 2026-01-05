// 🤖 AI CHAT - PHIÊN BẢN MỚI - Code lại hoàn toàn
// Modern, Clean, Efficient AI Chat System

import { auth } from './firebase.js';

class ModernAIChat {
    constructor() {
        // Core properties
        this.currentUser = null;
        this.conversations = [];
        this.currentConversationId = null;
        this.isLoading = false;
        
        // Configuration
        this.config = {
            apiKey: "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",
            model: "gpt-4o-mini",
            maxTokens: 2000,
            temperature: 0.7,
            maxConversations: 10,
            storagePrefix: 'ai_chat_'
        };
        
        // DOM elements cache
        this.elements = {};
        
        // Initialize
        this.init();
    }

    // ==================== INITIALIZATION ====================
    
    async init() {
        try {
            console.log('🤖 Initializing Modern AI Chat...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
            
        } catch (error) {
            console.error('❌ Error initializing AI Chat:', error);
            this.showError('Lỗi khởi tạo ứng dụng');
        }
    }

    initializeApp() {
        // Cache DOM elements
        this.cacheElements();
        
        // Setup authentication listener
        this.setupAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup UI enhancements
        this.setupUIEnhancements();
        
        console.log('✅ Modern AI Chat initialized successfully');
    }

    cacheElements() {
        this.elements = {
            // Chat elements
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton'),
            
            // Conversation elements
            conversationsList: document.getElementById('conversationsList'),
            newConversationBtn: document.getElementById('newConversationBtn'),
            newConversationBtnMobile: document.getElementById('newConversationBtnMobile'),
            
            // Quick actions
            quickActions: {
                math: document.getElementById('quick-math'),
                explain: document.getElementById('quick-explain'),
                homework: document.getElementById('quick-homework'),
                summary: document.getElementById('quick-summary')
            },
            
            // Mobile elements
            mobileMenuBtn: document.getElementById('mobileMenuBtn'),
            mobileOverlay: document.getElementById('mobileOverlay'),
            sidebar: document.getElementById('conversationsSidebar')
        };
    }

    setupAuth() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData();
                this.showWelcomeMessage();
            } else {
                this.handleLogout();
            }
        });
    }

    async loadUserData() {
        try {
            await this.loadConversations();
            this.updateConversationsList();
            console.log(`✅ Loaded ${this.conversations.length} conversations`);
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            this.showError('Lỗi tải dữ liệu người dùng');
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.conversations = [];
        this.currentConversationId = null;
        this.clearChat();
    }

    // ==================== EVENT LISTENERS ====================
    
    setupEventListeners() {
        // Send message
        this.elements.sendButton?.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput?.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        
        // New conversation
        this.elements.newConversationBtn?.addEventListener('click', () => this.createNewConversation());
        this.elements.newConversationBtnMobile?.addEventListener('click', () => this.createNewConversation());
        
        // Quick actions
        Object.entries(this.elements.quickActions).forEach(([key, element]) => {
            if (element) {
                element.addEventListener('click', () => this.handleQuickAction(key));
            }
        });
        
        // Mobile menu
        this.elements.mobileMenuBtn?.addEventListener('click', () => this.toggleMobileMenu());
        this.elements.mobileOverlay?.addEventListener('click', () => this.closeMobileMenu());
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    setupUIEnhancements() {
        // Auto-resize textarea
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('input', (e) => {
                this.autoResizeTextarea(e.target);
                this.updateCharCounter(e.target);
                this.showSuggestions(e.target.value);
            });
            
            // Add character counter
            this.addCharCounter();
        }
        
        // Focus management
        this.setupFocusManagement();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Enhanced quick actions
        this.enhanceQuickActions();
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 160);
        textarea.style.height = newHeight + 'px';
        
        // Update input container height
        const container = textarea.closest('.input-container');
        if (container) {
            const minHeight = window.innerWidth <= 480 ? 60 : 72;
            container.style.minHeight = Math.max(minHeight, newHeight + 16) + 'px';
        }
    }

    addCharCounter() {
        const inputContainer = this.elements.messageInput?.closest('.input-container');
        if (inputContainer && !inputContainer.querySelector('.char-counter')) {
            const counter = document.createElement('div');
            counter.className = 'char-counter';
            counter.textContent = '0/2000';
            inputContainer.appendChild(counter);
        }
    }

    updateCharCounter(textarea) {
        const counter = textarea.closest('.input-container')?.querySelector('.char-counter');
        if (counter) {
            const length = textarea.value.length;
            const maxLength = 2000;
            counter.textContent = `${length}/${maxLength}`;
            
            // Update counter color based on length
            counter.className = 'char-counter';
            if (length > maxLength * 0.9) {
                counter.classList.add('danger');
            } else if (length > maxLength * 0.75) {
                counter.classList.add('warning');
            }
        }
    }

    showSuggestions(value) {
        // Simple suggestion system
        if (value.length < 2) {
            this.hideSuggestions();
            return;
        }

        const suggestions = this.getSuggestions(value);
        if (suggestions.length > 0) {
            this.renderSuggestions(suggestions);
        } else {
            this.hideSuggestions();
        }
    }

    getSuggestions(value) {
        const commonQuestions = [
            { icon: '🧮', text: 'Giải bài toán này giúp tôi' },
            { icon: '💡', text: 'Giải thích khái niệm' },
            { icon: '📚', text: 'Hướng dẫn làm bài tập' },
            { icon: '📝', text: 'Tóm tắt nội dung' },
            { icon: '🔍', text: 'Phân tích vấn đề' },
            { icon: '💭', text: 'Cho ví dụ cụ thể' }
        ];

        return commonQuestions.filter(q => 
            q.text.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 4);
    }

    renderSuggestions(suggestions) {
        let dropdown = document.querySelector('.suggestions-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'suggestions-dropdown';
            this.elements.messageInput.closest('.input-container').appendChild(dropdown);
        }

        dropdown.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-text="${suggestion.text}">
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-text">${suggestion.text}</div>
            </div>
        `).join('');

        // Add click handlers
        dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.elements.messageInput.value = item.dataset.text + ': ';
                this.autoResizeTextarea(this.elements.messageInput);
                this.elements.messageInput.focus();
                this.hideSuggestions();
            });
        });

        dropdown.classList.add('show');
    }

    hideSuggestions() {
        const dropdown = document.querySelector('.suggestions-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    enhanceQuickActions() {
        // Add icons to quick actions if not present
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            if (!action.querySelector('i')) {
                const icon = document.createElement('i');
                const id = action.id;
                
                switch(id) {
                    case 'quick-math':
                        icon.className = 'fas fa-calculator';
                        break;
                    case 'quick-explain':
                        icon.className = 'fas fa-lightbulb';
                        break;
                    case 'quick-homework':
                        icon.className = 'fas fa-book';
                        break;
                    case 'quick-summary':
                        icon.className = 'fas fa-file-text';
                        break;
                    default:
                        icon.className = 'fas fa-comment';
                }
                
                action.insertBefore(icon, action.firstChild);
            }
        });
    }

    setupFocusManagement() {
        // Auto-focus input when page loads
        setTimeout(() => {
            this.elements.messageInput?.focus();
        }, 500);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to send message
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
            
            // Escape to close mobile menu
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    // ==================== INPUT HANDLING ====================
    
    handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    handleQuickAction(action) {
        const quickTexts = {
            math: 'Giải bài toán này giúp tôi: ',
            explain: 'Giải thích khái niệm này: ',
            homework: 'Hướng dẫn làm bài tập: ',
            summary: 'Tóm tắt nội dung này: '
        };
        
        const text = quickTexts[action];
        if (text && this.elements.messageInput) {
            this.elements.messageInput.value = text;
            this.elements.messageInput.focus();
            this.autoResizeTextarea(this.elements.messageInput);
        }
    }

    // ==================== CONVERSATION MANAGEMENT ====================
    
    async loadConversations() {
        try {
            if (!this.currentUser) return false; // ✅ KHÔNG được return trống
            
            const storageKey = `${this.config.storagePrefix}${this.currentUser.uid}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                const allConversations = JSON.parse(stored);
                const today = new Date().toDateString();
                
                // Filter today's conversations and limit count
                this.conversations = allConversations
                    .filter(conv => conv.date === today)
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .slice(0, this.config.maxConversations);
            } else {
                this.conversations = [];
            }
            
            return true; // ✅ Return boolean success
        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            this.conversations = [];
            return false; // ✅ Return boolean on error
        }
    }

    async saveConversations() {
        try {
            if (!this.currentUser) return false; // ✅ KHÔNG được return trống
            
            const storageKey = `${this.config.storagePrefix}${this.currentUser.uid}`;
            localStorage.setItem(storageKey, JSON.stringify(this.conversations));
            
            return true; // ✅ Return boolean success
        } catch (error) {
            console.error('❌ Error saving conversations:', error);
            return false; // ✅ Return boolean on error
        }
    }

    createNewConversation() {
        if (!this.currentUser) {
            this.showError('Vui lòng đăng nhập để sử dụng AI Chat');
            return;
        }

        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newConversation = {
            id: conversationId,
            title: 'Cuộc hội thoại mới',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toDateString(),
            messageCount: 0
        };

        // Add to beginning of array
        this.conversations.unshift(newConversation);
        
        // Limit conversations count
        if (this.conversations.length > this.config.maxConversations) {
            this.conversations = this.conversations.slice(0, this.config.maxConversations);
        }

        this.currentConversationId = conversationId;
        
        // Update UI
        this.clearChat();
        this.showWelcomeMessage();
        this.updateConversationsList();
        this.saveConversations();
        
        // Close mobile menu if open
        this.closeMobileMenu();
        
        // Focus input
        this.elements.messageInput?.focus();

        console.log('✅ New conversation created:', conversationId);
    }

    switchConversation(conversationId) {
        if (conversationId === this.currentConversationId) return;
        
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentConversationId = conversationId;
        this.loadConversationMessages(conversation);
        this.updateConversationsList();
        this.closeMobileMenu();
        
        console.log('✅ Switched to conversation:', conversationId);
    }

    loadConversationMessages(conversation) {
        this.clearChat();
        
        if (conversation.messages.length === 0) {
            this.showWelcomeMessage();
        } else {
            conversation.messages.forEach(msg => {
                this.addMessage(msg.userMessage, 'user', false);
                this.addMessage(msg.aiResponse, 'ai', false);
            });
        }
        
        this.scrollToBottom();
    }

    deleteConversation(conversationId) {
        if (!confirm('Bạn có chắc muốn xóa cuộc hội thoại này?')) return;
        
        // Remove from array
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        
        // Handle current conversation deletion
        if (conversationId === this.currentConversationId) {
            if (this.conversations.length > 0) {
                this.switchConversation(this.conversations[0].id);
            } else {
                this.currentConversationId = null;
                this.clearChat();
                this.showWelcomeMessage();
            }
        }
        
        this.updateConversationsList();
        this.saveConversations();
        
        this.showToast('Đã xóa cuộc hội thoại');
        console.log('✅ Conversation deleted:', conversationId);
    }

    // ==================== MESSAGE HANDLING ====================
    
    async sendMessage() {
        if (!this.elements.messageInput || this.isLoading) return false; // ✅ KHÔNG được return trống

        const message = this.elements.messageInput.value.trim();
        if (!message) return false; // ✅ KHÔNG được return trống

        // Create conversation if none exists
        if (!this.currentConversationId) {
            this.createNewConversation();
        }

        // Prepare UI
        this.setLoading(true);
        this.elements.messageInput.value = '';
        this.autoResizeTextarea(this.elements.messageInput);

        // Add user message
        this.addMessage(message, 'user');

        // Add loading message
        const loadingId = this.addLoadingMessage();

        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove loading message
            this.removeMessage(loadingId);
            
            // Add AI response
            this.addMessage(response, 'ai');

            // Save to conversation
            this.saveMessageToConversation(message, response);

            return true; // ✅ Return boolean success
        } catch (error) {
            console.error('❌ Error sending message:', error);
            
            this.removeMessage(loadingId);
            this.addMessage('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau. 😔', 'ai');
            
            this.showError('Lỗi gửi tin nhắn');
            return false; // ✅ Return boolean on error
        } finally {
            this.setLoading(false);
            this.elements.messageInput?.focus();
        }
    }

    saveMessageToConversation(userMessage, aiResponse) {
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) return;

        const messageData = {
            id: `msg_${Date.now()}`,
            userMessage,
            aiResponse,
            timestamp: new Date().toISOString()
        };

        conversation.messages.push(messageData);
        conversation.updatedAt = new Date().toISOString();
        conversation.messageCount = conversation.messages.length;
        
        // Update title if it's still default
        if (conversation.title === 'Cuộc hội thoại mới') {
            conversation.title = this.generateConversationTitle(userMessage);
        }

        // Move to top of list
        this.conversations = this.conversations.filter(c => c.id !== this.currentConversationId);
        this.conversations.unshift(conversation);

        this.updateConversationsList();
        this.saveConversations();
    }

    generateConversationTitle(message) {
        // Smart title generation
        const maxLength = 30;
        let title = message.trim();
        
        // Remove common prefixes
        const prefixes = ['giải', 'hỏi', 'tôi muốn', 'bạn có thể', 'làm thế nào'];
        prefixes.forEach(prefix => {
            if (title.toLowerCase().startsWith(prefix)) {
                title = title.substring(prefix.length).trim();
            }
        });
        
        // Truncate if too long
        if (title.length > maxLength) {
            title = title.substring(0, maxLength).trim() + '...';
        }
        
        return title || 'Cuộc hội thoại';
    }

    // ==================== AI INTEGRATION ====================
    
    async getAIResponse(message) {
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        {
                            role: "system",
                            content: this.getSystemPrompt()
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error('❌ OpenAI API Error:', error);
            return this.getFallbackResponse(message);
        }
    }

    getSystemPrompt() {
        return `Bạn là AI hỗ trợ học tập thông minh cho học sinh Việt Nam.

🎯 NHIỆM VỤ:
- Trả lời câu hỏi học tập chi tiết, dễ hiểu
- Giải thích từng bước một cách logic và rõ ràng
- Đưa ra ví dụ cụ thể và thực tế
- Khuyến khích tư duy độc lập

✨ PHONG CÁCH:
- Thân thiện, nhiệt tình, tích cực
- Sử dụng emoji phù hợp (không quá nhiều)
- Cấu trúc rõ ràng với bullet points
- Kết thúc bằng câu hỏi hoặc gợi ý suy nghĩ

📚 CHUYÊN MÔN:
- Toán học: Đại số, hình học, giải tích
- Khoa học: Vật lý, hóa học, sinh học
- Ngôn ngữ: Văn học, tiếng Anh
- Xã hội: Lịch sử, địa lý

🚫 KHÔNG:
- Làm bài tập thay học sinh
- Đưa ra đáp án trực tiếp mà không giải thích
- Sử dụng ngôn ngữ phức tạp, khó hiểu`;
    }

    getFallbackResponse(message) {
        const responses = {
            'toán': '🧮 Tôi có thể giúp bạn giải toán từ cơ bản đến nâng cao! Hãy gửi đề bài cụ thể để tôi hướng dẫn chi tiết nhé.',
            'vật lý': '⚡ Vật lý thật thú vị! Tôi có thể giúp bạn với cơ học, điện học, quang học... Bạn cần hỗ trợ phần nào?',
            'hóa': '🧪 Hóa học có nhiều phản ứng thú vị! Tôi sẵn sàng giúp bạn cân bằng phương trình, tính mol, giải thích cơ chế.',
            'văn': '📚 Văn học Việt Nam rất phong phú! Tôi có thể giúp phân tích tác phẩm, viết luận, hiểu sâu về tác giả.',
            'anh': '🇬🇧 English is amazing! I can help with grammar, vocabulary, writing, or conversation. What do you need?',
            'lịch sử': '🏛️ Lịch sử giúp ta hiểu quá khứ để xây dựng tương lai! Bạn muốn tìm hiểu giai đoạn nào?',
            'địa': '🌍 Địa lý giúp hiểu thế giới xung quanh! Tôi có thể giải thích địa hình, khí hậu, dân cư...',
            'sinh': '🔬 Sinh học là khoa học về sự sống! Từ tế bào đến hệ sinh thái, tôi sẵn sàng giải thích.',
            'default': `🤖 Xin chào! Tôi là AI hỗ trợ học tập của bạn.

Tôi có thể giúp bạn với:
• 🧮 **Toán học**: Đại số, hình học, giải tích
• ⚡ **Vật lý**: Cơ học, điện học, quang học  
• 🧪 **Hóa học**: Phản ứng, cân bằng, tính toán
• 📚 **Văn học**: Phân tích, viết luận, ngữ pháp
• 🇬🇧 **Tiếng Anh**: Grammar, vocabulary, writing
• 🏛️ **Lịch sử**: Sự kiện, nhân vật, niên đại
• 🌍 **Địa lý**: Địa hình, khí hậu, kinh tế
• 🔬 **Sinh học**: Tế bào, di truyền, sinh thái

Hãy đặt câu hỏi cụ thể để tôi hỗ trợ bạn tốt nhất! 😊`
        };

        const lowerMessage = message.toLowerCase();
        for (const [key, response] of Object.entries(responses)) {
            if (key !== 'default' && lowerMessage.includes(key)) {
                return response;
            }
        }
        return responses.default;
    }

    // ==================== UI MANAGEMENT ====================
    
    addMessage(content, type, animate = true) {
        if (!this.elements.chatMessages) return null;

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = `chat-message ${type}`;
        
        if (!animate) {
            messageDiv.classList.add('no-animate');
        }
        
        const timestamp = new Date().toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-bubble user">
                    <div class="message-content">${this.formatMessage(content)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-bubble ai">
                    <div class="message-content">${this.formatMessage(content)}</div>
                    <div class="message-time">${timestamp}</div>
                    <div class="message-actions">
                        <button onclick="modernAIChat.copyMessage('${messageId}')" title="Sao chép">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="modernAIChat.likeMessage('${messageId}')" title="Thích">
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.elements.chatMessages.appendChild(messageDiv);
        
        if (animate) {
            // Add show class after a brief delay for animation
            requestAnimationFrame(() => {
                messageDiv.classList.add('show');
            });
        } else {
            messageDiv.classList.add('show');
        }
        
        this.scrollToBottom();
        return messageId;
    }

    addLoadingMessage() {
        if (!this.elements.chatMessages) return null;

        const messageId = `loading_${Date.now()}`;
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = 'chat-message ai loading';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-bubble ai">
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="typing-text">AI đang suy nghĩ...</span>
                </div>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageId;
    }

    removeMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove();
        }
    }

    formatMessage(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/#{1,6}\s(.*?)$/gm, '<h3>$1</h3>')
            .replace(/•\s(.*?)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    }

    showWelcomeMessage() {
        const welcomeMessages = [
            "👋 Xin chào! Tôi là AI hỗ trợ học tập của bạn. Hôm nay bạn muốn học gì?",
            "🎓 Chào bạn! Tôi sẵn sàng giúp bạn với mọi câu hỏi học tập. Hãy bắt đầu nào!",
            "✨ Hello! Tôi là trợ lý AI thông minh. Bạn có bài tập nào cần hỗ trợ không?",
            "🚀 Chào mừng bạn! Hãy đặt câu hỏi và để tôi giúp bạn học tập hiệu quả hơn!"
        ];
        
        const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        this.addMessage(randomWelcome, 'ai');
    }

    clearChat() {
        if (this.elements.chatMessages) {
            this.elements.chatMessages.innerHTML = '';
        }
    }

    scrollToBottom() {
        if (this.elements.chatMessages) {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }
    }

    updateConversationsList() {
        if (!this.elements.conversationsList) return;

        if (this.conversations.length === 0) {
            this.elements.conversationsList.innerHTML = `
                <div class="empty-conversations">
                    <i class="fas fa-comments"></i>
                    <p>Chưa có cuộc hội thoại nào</p>
                    <small>Bắt đầu chat để tạo cuộc hội thoại đầu tiên</small>
                </div>
            `;
            return;
        }

        let html = '';
        this.conversations.forEach((conversation) => {
            const isActive = conversation.id === this.currentConversationId;
            const date = new Date(conversation.updatedAt).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            html += `
                <div class="conversation-item ${isActive ? 'active' : ''}" data-conversation-id="${conversation.id}">
                    <div class="conversation-content" onclick="modernAIChat.switchConversation('${conversation.id}')">
                        <div class="conversation-header">
                            <div class="conversation-title">${this.escapeHtml(conversation.title)}</div>
                            <div class="conversation-time">${date}</div>
                        </div>
                        <div class="conversation-preview">
                            ${conversation.messageCount} tin nhắn
                        </div>
                    </div>
                    <div class="conversation-actions">
                        <button onclick="modernAIChat.deleteConversation('${conversation.id}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        this.elements.conversationsList.innerHTML = html;
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        if (this.elements.sendButton) {
            this.elements.sendButton.disabled = loading;
            
            if (loading) {
                this.elements.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                this.elements.sendButton.classList.add('loading');
            } else {
                this.elements.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
                this.elements.sendButton.classList.remove('loading');
            }
        }
        
        if (this.elements.messageInput) {
            this.elements.messageInput.disabled = loading;
            
            if (loading) {
                this.elements.messageInput.placeholder = 'AI đang suy nghĩ...';
            } else {
                this.elements.messageInput.placeholder = 'Nhập câu hỏi hoặc đề bài của bạn...';
            }
        }
        
        // Update input container state
        const inputContainer = this.elements.messageInput?.closest('.input-container');
        if (inputContainer) {
            if (loading) {
                inputContainer.classList.add('loading');
            } else {
                inputContainer.classList.remove('loading');
            }
        }
    }

    // ==================== MOBILE MENU ====================
    
    toggleMobileMenu() {
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.toggle('open');
        }
        if (this.elements.mobileOverlay) {
            this.elements.mobileOverlay.classList.toggle('show');
        }
    }

    closeMobileMenu() {
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove('open');
        }
        if (this.elements.mobileOverlay) {
            this.elements.mobileOverlay.classList.remove('show');
        }
    }

    handleResize() {
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
    }

    // ==================== UTILITY FUNCTIONS ====================
    
    copyMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            const content = messageElement.querySelector('.message-content').textContent;
            navigator.clipboard.writeText(content).then(() => {
                this.showToast('Đã sao chép tin nhắn');
            }).catch(() => {
                this.showToast('Không thể sao chép tin nhắn');
            });
        }
    }

    likeMessage(messageId) {
        const button = document.querySelector(`#${messageId} .fa-thumbs-up`);
        if (button) {
            button.classList.toggle('liked');
            button.style.color = button.classList.contains('liked') ? '#10b981' : '';
            
            if (button.classList.contains('liked')) {
                this.showToast('Cảm ơn phản hồi của bạn! 👍');
            }
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    showError(message) {
        this.showToast(message, 'error');
        console.error('❌', message);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    cleanup() {
        // Cleanup when page unloads
        this.saveConversations();
    }

    // ==================== PUBLIC API ====================
    
    // Export conversation
    exportConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        let content = `Cuộc hội thoại: ${conversation.title}\n`;
        content += `Ngày: ${new Date(conversation.createdAt).toLocaleDateString('vi-VN')}\n\n`;
        
        conversation.messages.forEach((msg, index) => {
            content += `${index + 1}. Bạn: ${msg.userMessage}\n`;
            content += `   AI: ${msg.aiResponse}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation_${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Đã xuất cuộc hội thoại');
    }

    // Get conversation stats
    getStats() {
        const totalMessages = this.conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
        return {
            totalConversations: this.conversations.length,
            totalMessages,
            averageMessagesPerConversation: this.conversations.length > 0 ? Math.round(totalMessages / this.conversations.length) : 0
        };
    }
}

// ==================== INITIALIZATION ====================

// Create global instance
const modernAIChat = new ModernAIChat();

// Export for external access
export { modernAIChat };

// Global access for HTML onclick handlers
window.modernAIChat = modernAIChat;

// Debug helper
window.aiChatDebug = {
    getStats: () => modernAIChat.getStats(),
    clearStorage: () => {
        localStorage.removeItem(`${modernAIChat.config.storagePrefix}${modernAIChat.currentUser?.uid}`);
        location.reload();
    },
    exportAll: () => {
        modernAIChat.conversations.forEach(conv => {
            modernAIChat.exportConversation(conv.id);
        });
    }
};

console.log('🤖 Modern AI Chat loaded successfully');