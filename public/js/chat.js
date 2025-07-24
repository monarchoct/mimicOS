// Chat Management Module
export class ChatManager {
    constructor() {
        this.messages = [];
        this.messagesContainer = document.getElementById('chat-messages');
        this.typingIndicator = null;
        this.onSendMessage = null;
    }
    
    addMessage(role, content, metadata = {}) {
        const message = {
            id: Date.now(),
            role,
            content,
            timestamp: new Date(),
            ...metadata
        };
        
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
        
        return message;
    }
    
    addSystemMessage(content) {
        const systemMessage = document.createElement('div');
        systemMessage.className = 'system-message';
        systemMessage.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${content}</span>
        `;
        
        this.messagesContainer.appendChild(systemMessage);
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        // Remove welcome message if it exists
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;
        messageEl.dataset.messageId = message.id;
        
        const avatar = message.role === 'user' ? 'U' : 'AI';
        const time = this.formatTime(message.timestamp);
        
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-bubble">${this.formatContent(message.content)}</div>
                <div class="message-time">${time}</div>
            </div>
            <div class="message-actions">
                ${message.role === 'assistant' ? `
                    <button class="message-action" data-action="copy" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="message-action" data-action="regenerate" title="Regenerate">
                        <i class="fas fa-redo"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        // Add event listeners for actions
        messageEl.querySelectorAll('.message-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleMessageAction(action, message);
            });
        });
        
        this.messagesContainer.appendChild(messageEl);
    }
    
    formatContent(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
    
    showTypingIndicator() {
        if (this.typingIndicator) return;
        
        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'typing-indicator';
        this.typingIndicator.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        this.messagesContainer.appendChild(this.typingIndicator);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.remove();
            this.typingIndicator = null;
        }
    }
    
    handleMessageAction(action, message) {
        switch (action) {
            case 'copy':
                this.copyMessage(message.content);
                break;
                
            case 'regenerate':
                this.regenerateMessage(message);
                break;
        }
    }
    
    copyMessage(content) {
        // Remove HTML tags for plain text copy
        const plainText = content.replace(/<[^>]*>/g, '');
        
        navigator.clipboard.writeText(plainText).then(() => {
            this.showToast('Message copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }
    
    regenerateMessage(message) {
        // Find the user message before this assistant message
        const messageIndex = this.messages.findIndex(m => m.id === message.id);
        if (messageIndex > 0) {
            const previousMessage = this.messages[messageIndex - 1];
            if (previousMessage.role === 'user' && this.onSendMessage) {
                // Remove the current assistant message
                this.removeMessage(message.id);
                // Resend the user message
                this.onSendMessage(previousMessage.content);
            }
        }
    }
    
    removeMessage(messageId) {
        this.messages = this.messages.filter(m => m.id !== messageId);
        const messageEl = this.messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            messageEl.remove();
        }
    }
    
    clearMessages() {
        this.messages = [];
        this.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-hand-sparkles"></i>
                <p>Chat cleared. Start a new conversation!</p>
            </div>
        `;
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--surface-dark);
            color: var(--text-primary);
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    exportChat() {
        const chatData = {
            exportDate: new Date().toISOString(),
            messages: this.messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp
            }))
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    searchMessages(query) {
        const lowerQuery = query.toLowerCase();
        return this.messages.filter(m => 
            m.content.toLowerCase().includes(lowerQuery)
        );
    }
    
    getMessageStats() {
        const userMessages = this.messages.filter(m => m.role === 'user').length;
        const assistantMessages = this.messages.filter(m => m.role === 'assistant').length;
        const totalWords = this.messages.reduce((acc, m) => 
            acc + m.content.split(/\s+/).length, 0
        );
        
        return {
            totalMessages: this.messages.length,
            userMessages,
            assistantMessages,
            totalWords,
            averageWordCount: Math.round(totalWords / this.messages.length) || 0
        };
    }
}

// Add CSS animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
    }
    
    .system-message {
        text-align: center;
        padding: 10px;
        color: var(--text-secondary);
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
`;
document.head.appendChild(style);