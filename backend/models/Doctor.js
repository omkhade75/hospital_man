const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
    name: { type: DataTypes.STRING, allowNull: false },
    specialty: { type: DataTypes.STRING, allowNull: false },
    experience: { type: DataTypes.STRING },
    departmentId: { type: DataTypes.INTEGER }
});

module.exports = Doctor;
