const { Sequelize } = require('sequelize');
const config = require('./config.json')['development']; // Use 'production' ou 'test' conforme o ambiente

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
});

module.exports = sequelize;

