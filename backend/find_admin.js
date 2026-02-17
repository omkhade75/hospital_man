const User = require('./models/User');
const sequelize = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        const users = await User.findAll({ where: { role: 'admin' } });
        console.log('Admin Users:', JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
})();
