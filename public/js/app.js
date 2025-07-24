// Main Application Controller
import { CompanionManager } from './companion.js';
import { ChatManager } from './chat.js';
import { Avatar3D } from './avatar3d.js';
import { VoiceManager } from './voice.js';

class AICompanionApp {
    constructor() {
        this.companions = new CompanionManager();
        this.chat = new ChatManager();
        this.avatar3d = new Avatar3D();
        this.voice = new VoiceManager();
        
        this.ws = null;
        this.currentCompanion = null;
        this.settings = this.loadSettings();
        
        this.init();
    }
    
    async init() {
        console.log('Initializing AI Companion Launchpad...');
        
        // Hide loading screen after initialization
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1500);
        
        // Initialize WebSocket connection
        this.initWebSocket();
        
        // Initialize UI event listeners
        this.initUIListeners();
        
        // Load saved companions
        await this.companions.loadCompanions();
        
        // Initialize 3D scene
        this.avatar3d.init('character-canvas');
        
        // Initialize voice recognition
        await this.voice.init();
        
        // Set up chat callbacks
        this.chat.onSendMessage = (message) => this.handleUserMessage(message);
        this.voice.onTranscription = (text) => this.handleVoiceInput(text);
        
        console.log('AI Companion Launchpad ready!');
    }
    
    initWebSocket() {
        const wsUrl = `ws://${window.location.host}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.updateConnectionStatus(true);
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus(false);
            // Attempt to reconnect after 3 seconds
            setTimeout(() => this.initWebSocket(), 3000);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'chat':
                this.handleAIResponse(data.response);
                break;
                
            case 'voice':
                this.handleVoiceResponse(data);
                break;
                
            case 'animation':
                this.avatar3d.playAnimation(data.action);
                break;
                
            case 'emotion':
                this.updateCompanionEmotion(data.emotion);
                break;
                
            case 'error':
                this.handleError(data.message);
                break;
        }
    }
    
    initUIListeners() {
        // Create companion button
        document.getElementById('create-companion-btn').addEventListener('click', () => {
            this.showCompanionModal();
        });
        
        // Companion form submission
        document.getElementById('companion-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCompanion();
        });
        
        // Avatar type selection - show/hide URL input
        document.querySelectorAll('input[name="avatarType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const urlGroup = document.getElementById('avatar-url-group');
                const needsUrl = ['readyplayerme', 'custom', 'vrm'].includes(e.target.value);
                urlGroup.style.display = needsUrl ? 'block' : 'none';
                
                // Update placeholder based on type
                const urlInput = document.getElementById('avatar-url');
                if (e.target.value === 'readyplayerme') {
                    urlInput.placeholder = 'Enter Ready Player Me URL or avatar ID';
                } else if (e.target.value === 'custom') {
                    urlInput.placeholder = 'Enter path to .glb/.gltf file';
                } else if (e.target.value === 'vrm') {
                    urlInput.placeholder = 'Enter path to .vrm file';
                }
            });
        });
        
        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideCompanionModal();
        });
        
        document.getElementById('cancel-create').addEventListener('click', () => {
            this.hideCompanionModal();
        });
        
        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        document.getElementById('close-settings').addEventListener('click', () => {
            this.hideSettingsModal();
        });
        
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Chat input
        const chatInput = document.getElementById('chat-input');
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });
        
        // Send button
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Voice input
        document.getElementById('voice-input-btn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });
        
        // Voice call
        document.getElementById('voice-call-btn').addEventListener('click', () => {
            this.startVoiceCall();
        });
        
        // 3D controls
        document.getElementById('rotate-left').addEventListener('click', () => {
            this.avatar3d.rotate(-45);
        });
        
        document.getElementById('rotate-right').addEventListener('click', () => {
            this.avatar3d.rotate(45);
        });
        
        document.getElementById('reset-view').addEventListener('click', () => {
            this.avatar3d.resetView();
        });
        
        // Companion selection
        this.companions.onSelectCompanion = (companion) => {
            this.selectCompanion(companion);
        };
    }
    
    showCompanionModal() {
        const modal = document.getElementById('companion-modal');
        modal.classList.add('active');
        document.getElementById('companion-name').focus();
    }
    
    hideCompanionModal() {
        const modal = document.getElementById('companion-modal');
        modal.classList.remove('active');
        document.getElementById('companion-form').reset();
    }
    
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        modal.classList.add('active');
        
        // Load current settings
        document.getElementById('ai-provider').value = this.settings.aiProvider || 'openai';
        document.getElementById('api-key').value = this.settings.apiKey || '';
        document.getElementById('auto-voice').checked = this.settings.autoVoice !== false;
        document.getElementById('high-quality').checked = this.settings.highQuality !== false;
    }
    
    hideSettingsModal() {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('active');
    }
    
    async createCompanion() {
        const formData = new FormData(document.getElementById('companion-form'));
        const companionData = {
            name: formData.get('name'),
            personality: formData.get('personality'),
            voice: formData.get('voice'),
            avatarType: formData.get('avatarType'),
            description: formData.get('description')
        };
        
        // Add avatar-specific data
        const avatarUrl = formData.get('avatarUrl');
        if (avatarUrl) {
            companionData.avatarData = {
                url: avatarUrl,
                avatarId: avatarUrl, // For Ready Player Me
                modelPath: avatarUrl, // For custom models
                vrmPath: avatarUrl,   // For VRM models
                vroidPath: avatarUrl  // For VRoid models
            };
        }
        
        try {
            const companion = await this.companions.createCompanion(companionData);
            this.hideCompanionModal();
            this.selectCompanion(companion);
            
            // Show success message
            this.chat.addSystemMessage(`${companion.name} has been created! Say hello!`);
        } catch (error) {
            console.error('Failed to create companion:', error);
            this.handleError('Failed to create companion. Please try again.');
        }
    }
    
    async selectCompanion(companion) {
        this.currentCompanion = companion;
        
        // Update UI
        document.getElementById('active-companion-name').textContent = companion.name;
        
        // Update avatar icon based on type
        const iconMap = {
            realistic: 'user',
            anime: 'star',
            cartoon: 'smile',
            readyplayerme: 'globe',
            custom: 'cube',
            vrm: 'user-astronaut'
        };
        
        document.getElementById('active-companion-avatar').innerHTML = 
            `<i class="fas fa-${iconMap[companion.avatarType] || 'user'}"></i>`;
        
        // Load 3D avatar with avatar data
        await this.avatar3d.loadAvatar(
            companion.id, 
            companion.avatarType,
            companion.avatarData || {}
        );
        
        // Clear chat and add welcome message
        this.chat.clearMessages();
        this.chat.addMessage('assistant', 
            `Hello! I'm ${companion.name}. ${this.getPersonalityGreeting(companion.personality)}`
        );
        
        // Update companion list selection
        this.companions.setActiveCompanion(companion.id);
    }
    
    getPersonalityGreeting(personality) {
        const greetings = {
            friendly: "I'm here to chat and keep you company! How are you doing today?",
            professional: "I'm here to assist you with any questions or tasks you may have.",
            creative: "Ready for some fun and creative conversations? Let's explore ideas together!",
            wise: "I'm here to offer thoughtful insights and meaningful conversations.",
            energetic: "I'm super excited to chat with you! What would you like to talk about?"
        };
        
        return greetings[personality] || "Nice to meet you!";
    }
    
    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message || !this.currentCompanion) return;
        
        // Add user message to chat
        this.chat.addMessage('user', message);
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Send to server
        this.handleUserMessage(message);
    }
    
    handleUserMessage(message) {
        if (!this.currentCompanion || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.chat.addSystemMessage('Please select a companion and ensure you\'re connected.');
            return;
        }
        
        // Show typing indicator
        this.chat.showTypingIndicator();
        
        // Trigger thinking animation
        this.avatar3d.playAnimation('thinking');
        
        // Send message via WebSocket
        this.ws.send(JSON.stringify({
            type: 'chat',
            companionId: this.currentCompanion.id,
            message: message,
            context: {
                personality: this.currentCompanion.personality,
                name: this.currentCompanion.name,
                description: this.currentCompanion.description
            }
        }));
    }
    
    handleAIResponse(response) {
        // Hide typing indicator
        this.chat.hideTypingIndicator();
        
        // Add AI message
        this.chat.addMessage('assistant', response.text);
        
        // Play talking animation
        this.avatar3d.playAnimation('talking');
        
        // Play voice if enabled
        if (this.settings.autoVoice && response.audio) {
            this.voice.playAudio(response.audio);
        }
        
        // Update emotion if provided
        if (response.emotion) {
            this.updateCompanionEmotion(response.emotion);
        }
    }
    
    toggleVoiceInput() {
        const btn = document.getElementById('voice-input-btn');
        
        if (this.voice.isRecording) {
            this.voice.stopRecording();
            btn.classList.remove('recording');
        } else {
            this.voice.startRecording();
            btn.classList.add('recording');
        }
    }
    
    handleVoiceInput(text) {
        if (text && this.currentCompanion) {
            // Add transcribed text to input
            const input = document.getElementById('chat-input');
            input.value = text;
            
            // Optionally auto-send
            if (this.settings.autoSendVoice) {
                this.sendMessage();
            }
        }
    }
    
    startVoiceCall() {
        if (!this.currentCompanion) {
            this.chat.addSystemMessage('Please select a companion first.');
            return;
        }
        
        // Implementation for voice call UI
        console.log('Starting voice call with', this.currentCompanion.name);
        // This would open a voice call overlay
    }
    
    updateCompanionEmotion(emotion) {
        // Update 3D avatar expression
        this.avatar3d.setExpression(emotion);
        
        // Update UI emotion indicator
        const emotionIcons = {
            happy: '😊',
            sad: '😢',
            excited: '🤩',
            thinking: '🤔',
            neutral: '😐'
        };
        
        // Could add an emotion indicator to the UI
        console.log('Companion emotion:', emotion, emotionIcons[emotion]);
    }
    
    updateConnectionStatus(connected) {
        const status = document.getElementById('companion-status');
        if (connected) {
            status.innerHTML = '<i class="fas fa-circle"></i> Connected';
            status.style.color = 'var(--success-color)';
        } else {
            status.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
            status.style.color = 'var(--error-color)';
        }
    }
    
    handleError(message) {
        console.error('Error:', message);
        this.chat.addSystemMessage(`Error: ${message}`);
    }
    
    loadSettings() {
        const saved = localStorage.getItem('aiCompanionSettings');
        return saved ? JSON.parse(saved) : {
            aiProvider: 'openai',
            autoVoice: true,
            highQuality: true,
            autoSendVoice: false
        };
    }
    
    saveSettings() {
        this.settings = {
            aiProvider: document.getElementById('ai-provider').value,
            apiKey: document.getElementById('api-key').value,
            autoVoice: document.getElementById('auto-voice').checked,
            highQuality: document.getElementById('high-quality').checked
        };
        
        // Save to localStorage (excluding API key for security)
        const toSave = { ...this.settings };
        delete toSave.apiKey;
        localStorage.setItem('aiCompanionSettings', JSON.stringify(toSave));
        
        // Store API key securely (in production, this should be handled server-side)
        if (this.settings.apiKey) {
            sessionStorage.setItem('apiKey', this.settings.apiKey);
        }
        
        // Update 3D quality
        this.avatar3d.setQuality(this.settings.highQuality ? 'high' : 'low');
        
        this.hideSettingsModal();
        this.chat.addSystemMessage('Settings saved successfully!');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AICompanionApp();
});