// Companions API Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for demo (use database in production)
const companions = new Map();

// Get all companions
router.get('/', (req, res) => {
    const companionList = Array.from(companions.values());
    res.json(companionList);
});

// Get single companion
router.get('/:id', (req, res) => {
    const companion = companions.get(req.params.id);
    if (!companion) {
        return res.status(404).json({ error: 'Companion not found' });
    }
    res.json(companion);
});

// Create new companion
router.post('/', (req, res) => {
    const { name, personality, voice, avatarType, description } = req.body;
    
    if (!name || !personality || !voice || !avatarType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const companion = {
        id: uuidv4(),
        name,
        personality,
        voice,
        avatarType,
        description,
        createdAt: new Date().toISOString(),
        stats: {
            messages: 0,
            voiceCalls: 0,
            lastActive: new Date().toISOString()
        }
    };
    
    companions.set(companion.id, companion);
    res.status(201).json(companion);
});

// Update companion
router.put('/:id', (req, res) => {
    const companion = companions.get(req.params.id);
    if (!companion) {
        return res.status(404).json({ error: 'Companion not found' });
    }
    
    const updated = {
        ...companion,
        ...req.body,
        id: companion.id, // Prevent ID change
        updatedAt: new Date().toISOString()
    };
    
    companions.set(req.params.id, updated);
    res.json(updated);
});

// Delete companion
router.delete('/:id', (req, res) => {
    if (!companions.has(req.params.id)) {
        return res.status(404).json({ error: 'Companion not found' });
    }
    
    companions.delete(req.params.id);
    res.status(204).send();
});

// Update companion stats
router.post('/:id/stats', (req, res) => {
    const companion = companions.get(req.params.id);
    if (!companion) {
        return res.status(404).json({ error: 'Companion not found' });
    }
    
    companion.stats = {
        ...companion.stats,
        ...req.body,
        lastActive: new Date().toISOString()
    };
    
    companions.set(req.params.id, companion);
    res.json(companion.stats);
});

export default router;