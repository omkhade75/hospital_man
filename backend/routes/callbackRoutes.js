const express = require('express');
const CallbackRequest = require('../models/CallbackRequest');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create callback request
router.post('/', async (req, res) => {
    try {
        const callback = await CallbackRequest.create(req.body);
        res.status(201).json(callback);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all callbacks (Protected)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const callbacks = await CallbackRequest.findAll({ order: [['createdAt', 'DESC']] });
        res.json(callbacks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update callback status (Protected)
router.post('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        await CallbackRequest.update({ status }, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
