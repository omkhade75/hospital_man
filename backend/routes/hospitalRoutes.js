const express = require('express');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');

const router = express.Router();

// Get Departments
router.get('/departments', async (req, res) => {
    try {
        const depts = await Department.findAll();
        res.json(depts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Doctors (Optional: filter by departmentId)
router.get('/doctors', async (req, res) => {
    try {
        const { departmentId } = req.query;
        const where = departmentId ? { departmentId } : {};
        const docs = await Doctor.findAll({ where });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
