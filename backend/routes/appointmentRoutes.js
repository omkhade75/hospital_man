const express = require('express');
const Appointment = require('../models/Appointment');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get my appointments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const appointments = await Appointment.findAll({ where: { userId: req.user.id } });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create appointment
router.post('/', authenticateToken, async (req, res) => {
    try {
        const appointment = await Appointment.create({ ...req.body, userId: req.user.id });
        res.status(201).json(appointment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
