/**
 * Calculate the total cost of a ride based on distance, fuel consumption and fuel price
 * @param {number} distance - Distance in km
 * @param {number} fuelConsumption - Vehicle fuel consumption in km/L
 * @param {number} fuelPrice - Price per liter of fuel (defaults to R$ 6.23)
 * @returns {number} Total cost of the ride
 */
export const calculateTotalCost = (distance, fuelConsumption, fuelPrice = 6.23) => {
  if (!distance || !fuelConsumption || distance <= 0 || fuelConsumption <= 0) {
    throw new Error("Distância e consumo do veículo devem ser valores positivos");
  }
  
  if (fuelPrice <= 0) {
    throw new Error("Preço do combustível deve ser um valor positivo");
  }
  
  // Calculate fuel needed in liters: distance / consumption
  const fuelNeeded = distance / fuelConsumption;
  
  // Calculate total cost: fuel needed * fuel price per liter
  const totalCost = fuelNeeded * fuelPrice;
  
  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
};
/**
 * Calculate the price per member (passenger and driver)
 * @param {number} totalCost - Total cost of the ride
 * @param {number} totalSeats - Total number of seats available (including driver)
 * @returns {number} Price per member (passenger or driver)
 */
export const calculatePricePerMember = (totalCost, totalSeats) => {
  if (!totalCost || !totalSeats || totalCost <= 0 || totalSeats <= 0) {
    throw new Error("Custo total e número de vagas devem ser valores positivos");
  }
  
  const totalMembers = totalSeats + 1; // +1 for the driver
  return Math.round((totalCost / totalMembers) * 100) / 100; // Round to 2 decimal places
};

/**
 * Recalculate costs for a ride based on vehicle consumption
 * @param {object} rideData - Ride data with distance, totalSeats and vehicle consumption
 * @param {number} rideData.distance - Distance in km
 * @param {number} rideData.totalSeats - Total number of seats available
 * @param {number} rideData.fuelConsumption - Vehicle fuel consumption in km/L (optional, will be fetched from vehicle if not provided)
 * @param {number} rideData.fuelPrice - Price per liter of fuel (optional, defaults to R$ 6.23)
 * @returns {object} Object with totalCost and pricePerMember
 */
export const recalculateRideCosts = (rideData) => {
  const { distance, totalSeats, fuelConsumption, fuelPrice = 6.23 } = rideData;
  
  if (!fuelConsumption) {
    throw new Error("Consumo do veículo é obrigatório para calcular o custo da viagem");
  }
  
  const totalCost = calculateTotalCost(distance, fuelConsumption, fuelPrice);
  const pricePerMember = calculatePricePerMember(totalCost, totalSeats);
  
  return {
    totalCost,
    pricePerMember
  };
};

/**
 * Recalculate costs for a ride with vehicle data
 * @param {object} rideData - Ride data with distance, totalSeats
 * @param {object} vehicle - Vehicle data with fuelConsumption
 * @param {number} fuelPrice - Price per liter of fuel (defaults to R$ 6.23)
 * @returns {object} Object with totalCost and pricePerMember
 */
export const recalculateRideCostsWithVehicle = (rideData, vehicle, fuelPrice = 6.23) => {
  const { distance, totalSeats } = rideData;
  const { fuelConsumption } = vehicle;
  
  const totalCost = calculateTotalCost(distance, fuelConsumption, fuelPrice);
  const pricePerMember = calculatePricePerMember(totalCost, totalSeats);
  
  return {
    totalCost,
    pricePerMember
  };
};
