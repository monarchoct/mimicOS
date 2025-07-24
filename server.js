import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// API Routes
app.use('/api/companions', (await import('./routes/companions.js')).default);
app.use('/api/chat', (await import('./routes/chat.js')).default);
app.use('/api/voice', (await import('./routes/voice.js')).default);

// Start HTTP server
const server = app.listen(PORT, () => {
    console.log(`🚀 AI Companion Launchpad running on http://localhost:${PORT}`);
});

// WebSocket server for real-time communication
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'chat':
                    // Handle chat messages
                    const response = await handleChatMessage(data);
                    ws.send(JSON.stringify(response));
                    break;
                    
                case 'voice':
                    // Handle voice data
                    const voiceResponse = await handleVoiceData(data);
                    ws.send(JSON.stringify(voiceResponse));
                    break;
                    
                case 'animation':
                    // Handle animation triggers
                    ws.send(JSON.stringify({ type: 'animation', action: data.action }));
                    break;
            }
        } catch (error) {
            console.error('WebSocket error:', error);
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Helper functions
async function handleChatMessage(data) {
    // This will be implemented in the AI service
    const aiService = (await import('./services/aiService.js')).default;
    const response = await aiService.generateResponse(data.companionId, data.message);
    return { type: 'chat', response };
}

async function handleVoiceData(data) {
    // This will be implemented in the voice service
    const voiceService = (await import('./services/voiceService.js')).default;
    const transcription = await voiceService.transcribe(data.audio);
    return { type: 'voice', transcription };
}