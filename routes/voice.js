// Voice API Routes
import express from 'express';
import voiceService from '../services/voiceService.js';

const router = express.Router();

// Transcribe audio
router.post('/transcribe', async (req, res) => {
    try {
        const { audio } = req.body;
        
        if (!audio) {
            return res.status(400).json({ error: 'Audio data required' });
        }
        
        const result = await voiceService.transcribe(audio);
        res.json(result);
        
    } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

// Synthesize speech
router.post('/synthesize', async (req, res) => {
    try {
        const { text, voice } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text required' });
        }
        
        const audio = await voiceService.synthesize(text, voice);
        res.json({ audio });
        
    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: 'Failed to synthesize speech' });
    }
});

export default router;