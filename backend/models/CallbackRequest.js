const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CallbackRequest = sequelize.define('CallbackRequest', {
    fullName: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    time: { type: DataTypes.STRING },
    reason: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
});

module.exports = CallbackRequest;
