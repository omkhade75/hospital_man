const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false }, // Hashed
    role: { type: DataTypes.STRING, defaultValue: 'patient' }, // 'patient' | 'staff' | 'admin'
    fullName: { type: DataTypes.STRING }
});

module.exports = User;
