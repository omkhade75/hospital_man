const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    patientName: { type: DataTypes.STRING },
    patientPhone: { type: DataTypes.STRING },
    department: { type: DataTypes.STRING },
    doctorName: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    time: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING, defaultValue: 'consultation' },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
});

module.exports = Appointment;
