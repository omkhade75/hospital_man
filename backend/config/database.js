const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbDialect = process.env.DB_DIALECT || 'sqlite';
let sequelize;

if (dbDialect === 'mysql') {
    sequelize = new Sequelize(
        process.env.DB_NAME || 'starhospital',
        process.env.DB_USER || 'root',
        process.env.DB_PASS || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            dialect: 'mysql',
            logging: false
        }
    );
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../', process.env.DB_FILE_PATH || 'database.sqlite'),
        logging: false
    });
}

module.exports = sequelize;
