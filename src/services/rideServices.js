// services/ride.service.js

const mockDatabase = [
    {
      id: 1,
      userId: 'user123',
      date: '23/04/2025',
      address: 'Av. Cirne de Lima - 5486, Centro, Toledo - PR',
      route: 'Biapark/Educação',
      time: '07:00',
      price: 20.90,
      distance: 8.5,
      timestamp: new Date('2025-04-23T07:00:00.000Z'),
      title: null,
      vehicleInfo: 'Veículo: Sonic 3.0 Turbo, Cor: Branco',
      passengers: [],
    },
    {
      id: 2,
      userId: 'user123',
      date: '24/03/2025',
      address: 'Av. Parigot de Souza - 1200, Jardim, Toledo - PR',
      route: 'Centro/Faculdade',
      time: '19:30',
      price: 15.50,
      distance: 5.8,
      timestamp: new Date('2025-03-24T19:30:00.000Z'),
      title: 'Viagem para a Faculdade',
      vehicleInfo: 'Veículo: HB20 1.6, Cor: Prata',
      passengers: ['user456'],
    },
    // ... mais dados mockados
  ];
  
  async function getUserRideHistory(userId, startDate, endDate) {
    return mockDatabase.filter(ride =>
      ride.userId === userId &&
      new Date(ride.timestamp) >= new Date(startDate) &&
      new Date(ride.timestamp) <= new Date(endDate)
    );
  }
  
  async function getRideDetails(rideId) {
    return mockDatabase.find(ride => ride.id === parseInt(rideId));
  }
  
  module.exports = {
    getUserRideHistory,
    getRideDetails,
  };