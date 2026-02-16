const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword, fullName, role });

        if (role === 'patient') {
            await Patient.create({ userId: user.id });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        res.status(201).json({ user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName }, token });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        res.json({ user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName }, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Current User
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.json({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

module.exports = router;
