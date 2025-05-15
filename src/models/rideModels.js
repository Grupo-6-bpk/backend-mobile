const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assumindo que você tem um arquivo database.js na pasta config

const Ride = sequelize.define('Ride', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  start_location: {
    type: DataTypes.STRING,
  },
  end_location: {
    type: DataTypes.STRING,
  },
  distance: {
    type: DataTypes.FLOAT,
  },
  departure_time: {
    type: DataTypes.DATE,
  },
  total_cost: {
    type: DataTypes.FLOAT,
  },
  fuel_price: {
    type: DataTypes.FLOAT,
  },
  created_at: {
    type: DataTypes.DATE,
  },
  updated_at: {
    type: DataTypes.DATE,
  },
  driver_id: {
    type: DataTypes.INTEGER, // Chave estrangeira para a tabela de usuários (motorista)
    references: {
      model: 'user', // Nome da tabela de usuários
      key: 'id',
    },
  },
  // Adicione outros campos conforme a estrutura da sua tabela 'ride'
});

// Defina associações com outras tabelas se necessário (ex: passageiros)
// Ride.belongsToMany(User, { through: 'RidePassenger', as: 'passengers' });

module.exports = Ride;