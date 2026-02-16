const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');

// Import Models (Must be loaded before sync)
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const CallbackRequest = require('./models/CallbackRequest');
const Department = require('./models/Department');
const Doctor = require('./models/Doctor');

const app = express();
const PORT = process.env.PORT || 5000;

// Health Check
app.get('/health', (req, res) => res.sendStatus(200));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/callbacks', require('./routes/callbackRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api', require('./routes/hospitalRoutes')); // /api/doctors, /api/departments

// Sync Database & Start Server
(async () => {
    try {
        await sequelize.authenticate();
        console.log(`Database Connection (${sequelize.getDialect()}) established.`);

        await sequelize.sync({ alter: true });
        console.log('Database synced.');

        // Seed Initial Data
        const docCount = await Doctor.count();
        if (docCount === 0) {
            console.log('Seeding initial data...');
            const cardiology = await Department.create({ name: 'Cardiology', description: 'Heart care specialists' });
            await Doctor.create({ name: 'Dr. Sarah Johnson', specialty: 'Cardiology', departmentId: cardiology.id });
            await Doctor.create({ name: 'Dr. Michael Chen', specialty: 'Neurology' });
        }

        if (require.main === module) {
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        }
    } catch (error) {
        console.error('Database error:', error);
    }
})();

module.exports = app;
