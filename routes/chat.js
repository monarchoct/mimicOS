// Chat API Routes
import express from 'express';
import aiService from '../services/aiService.js';

const router = express.Router();

// Send chat message
router.post('/message', async (req, res) => {
    try {
        const { companionId, message, context } = req.body;
        
        if (!companionId || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const response = await aiService.generateResponse(companionId, message, context);
        res.json(response);
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Clear chat history
router.delete('/history/:companionId', (req, res) => {
    aiService.clearHistory(req.params.companionId);
    res.status(204).send();
});

// Set AI provider
router.post('/provider', (req, res) => {
    const { provider } = req.body;
    
    if (!provider) {
        return res.status(400).json({ error: 'Provider required' });
    }
    
    const success = aiService.setProvider(provider);
    if (!success) {
        return res.status(400).json({ error: 'Invalid provider' });
    }
    
    res.json({ provider });
});

export default router;