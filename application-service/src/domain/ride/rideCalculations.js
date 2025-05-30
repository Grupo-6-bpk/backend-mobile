/**
 * Calculate the total cost of a ride
 * @param {number} fuelPrice - Price per km of fuel
 * @param {number} distance - Distance in km
 * @returns {number} Total cost of the ride
 */
export const calculateTotalCost = (fuelPrice, distance) => {
  if (!fuelPrice || !distance || fuelPrice <= 0 || distance <= 0) {
    throw new Error("Preço do combustível e distância devem ser valores positivos");
  }
  
  const totalCost = fuelPrice * distance;
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
 * Recalculate costs for a ride
 * @param {object} rideData - Ride data with fuelPrice, distance, and totalSeats
 * @returns {object} Object with totalCost and pricePerMember
 */
export const recalculateRideCosts = (rideData) => {
  const { fuelPrice, distance, totalSeats } = rideData;
  
  const totalCost = calculateTotalCost(fuelPrice, distance);
  const pricePerMember = calculatePricePerMember(totalCost, totalSeats);
  
  return {
    totalCost,
    pricePerMember
  };
};
