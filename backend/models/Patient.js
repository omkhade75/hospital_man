const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    phone: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    bloodGroup: { type: DataTypes.STRING }
});

module.exports = Patient;
