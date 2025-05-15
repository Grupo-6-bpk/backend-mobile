// controllers/ride.controller.js

const rideService = require('../services/rideServices');

async function getUserRideHistory(req, res) {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
    }

    const rideHistory = await rideService.getUserRideHistory(userId, startDate, endDate);
    res.status(200).json(rideHistory);
  } catch (error) {
    console.error('Erro ao processar requisição do histórico de caronas:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico de caronas.' });
  }
}

async function getRideDetails(req, res) {
  try {
    const { id } = req.params; // O ID da carona virá como um parâmetro na URL
    const rideDetails = await rideService.getRideDetails(id);
    res.status(200).json(rideDetails);
  } catch (error) {
    console.error('Erro ao processar requisição de detalhes da carona:', error);
    if (error.message === 'Carona não encontrada.') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao buscar detalhes da carona.' });
  }
}

module.exports = {
  getUserRideHistory,
  getRideDetails, // Exporta a nova função
};