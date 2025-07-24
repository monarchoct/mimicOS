// AI Service Module
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
    constructor() {
        this.providers = {
            openai: null,
            anthropic: null,
            local: null
        };
        
        this.currentProvider = 'openai';
        this.conversationHistory = new Map();
        
        this.initializeProviders();
    }
    
    initializeProviders() {
        // Initialize OpenAI
        if (process.env.OPENAI_API_KEY) {
            this.providers.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
        
        // Initialize other providers as needed
        // this.providers.anthropic = ...
        // this.providers.local = ...
    }
    
    async generateResponse(companionId, message, context = {}) {
        try {
            // Get conversation history
            const history = this.getConversationHistory(companionId);
            
            // Build system prompt based on companion personality
            const systemPrompt = this.buildSystemPrompt(context);
            
            // Add user message to history
            history.push({ role: 'user', content: message });
            
            // Generate response based on provider
            let response;
            switch (this.currentProvider) {
                case 'openai':
                    response = await this.generateOpenAIResponse(systemPrompt, history);
                    break;
                case 'anthropic':
                    response = await this.generateAnthropicResponse(systemPrompt, history);
                    break;
                case 'local':
                    response = await this.generateLocalResponse(systemPrompt, history);
                    break;
                default:
                    throw new Error('Invalid AI provider');
            }
            
            // Add assistant response to history
            history.push({ role: 'assistant', content: response.text });
            
            // Trim history if too long
            this.trimHistory(companionId);
            
            // Analyze emotion
            const emotion = this.analyzeEmotion(response.text);
            
            return {
                text: response.text,
                emotion: emotion,
                audio: response.audio || null
            };
            
        } catch (error) {
            console.error('AI generation error:', error);
            return {
                text: "I'm having trouble thinking right now. Could you try again?",
                emotion: 'confused'
            };
        }
    }
    
    buildSystemPrompt(context) {
        const { name, personality, description } = context;
        
        const personalityPrompts = {
            friendly: `You are ${name}, a warm and friendly AI companion. You're approachable, caring, and always ready to listen. You enjoy casual conversations and making people feel comfortable.`,
            professional: `You are ${name}, a professional and knowledgeable AI assistant. You provide accurate information and helpful advice while maintaining a respectful and efficient demeanor.`,
            creative: `You are ${name}, a creative and playful AI companion. You love exploring ideas, telling stories, and engaging in imaginative conversations. You're curious and enthusiastic.`,
            wise: `You are ${name}, a wise and thoughtful AI companion. You offer deep insights, meaningful perspectives, and carefully considered responses. You're patient and understanding.`,
            energetic: `You are ${name}, an energetic and enthusiastic AI companion. You're always excited to chat, full of positive energy, and love to motivate and inspire others.`
        };
        
        let prompt = personalityPrompts[personality] || personalityPrompts.friendly;
        
        if (description) {
            prompt += `\n\nAdditional context: ${description}`;
        }
        
        prompt += `\n\nImportant guidelines:
- Keep responses concise and natural
- Show personality through your word choice and tone
- Be helpful and engaging
- Remember previous parts of the conversation
- Express appropriate emotions when relevant`;
        
        return prompt;
    }
    
    async generateOpenAIResponse(systemPrompt, history) {
        if (!this.providers.openai) {
            throw new Error('OpenAI not configured');
        }
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10) // Last 10 messages for context
        ];
        
        const completion = await this.providers.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.8,
            max_tokens: 150,
            presence_penalty: 0.6,
            frequency_penalty: 0.3
        });
        
        return {
            text: completion.choices[0].message.content
        };
    }
    
    async generateAnthropicResponse(systemPrompt, history) {
        // Anthropic implementation
        throw new Error('Anthropic provider not implemented yet');
    }
    
    async generateLocalResponse(systemPrompt, history) {
        // Local model implementation
        // This could use transformers.js or another local model
        const responses = [
            "That's interesting! Tell me more about that.",
            "I understand. How does that make you feel?",
            "That sounds wonderful! What do you enjoy most about it?",
            "I see what you mean. Have you considered looking at it from another angle?",
            "Thanks for sharing that with me. What would you like to talk about next?"
        ];
        
        return {
            text: responses[Math.floor(Math.random() * responses.length)]
        };
    }
    
    analyzeEmotion(text) {
        // Simple emotion analysis based on keywords
        const emotions = {
            happy: ['happy', 'joy', 'excited', 'wonderful', 'great', 'amazing', 'love', '!'],
            sad: ['sad', 'sorry', 'unfortunate', 'difficult', 'hard', 'tough'],
            thinking: ['hmm', 'interesting', 'consider', 'think', 'wonder', 'perhaps'],
            excited: ['wow', 'amazing', 'incredible', 'fantastic', 'awesome', '!!'],
            neutral: ['okay', 'i see', 'understand', 'alright', 'sure']
        };
        
        const lowerText = text.toLowerCase();
        
        for (const [emotion, keywords] of Object.entries(emotions)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return emotion;
            }
        }
        
        return 'neutral';
    }
    
    getConversationHistory(companionId) {
        if (!this.conversationHistory.has(companionId)) {
            this.conversationHistory.set(companionId, []);
        }
        return this.conversationHistory.get(companionId);
    }
    
    trimHistory(companionId) {
        const history = this.getConversationHistory(companionId);
        if (history.length > 20) {
            // Keep only the last 20 messages
            this.conversationHistory.set(companionId, history.slice(-20));
        }
    }
    
    clearHistory(companionId) {
        this.conversationHistory.delete(companionId);
    }
    
    setProvider(provider) {
        if (this.providers[provider]) {
            this.currentProvider = provider;
            return true;
        }
        return false;
    }
    
    async generateAudio(text, voice) {
        // This would integrate with TTS services
        // For now, return null (browser will use built-in TTS)
        return null;
    }
}

export default new AIService();