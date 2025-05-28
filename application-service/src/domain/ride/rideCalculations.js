/**
 * Utility functions for ride cost calculations
 */

/**
 * Calculate the total cost of a ride
 * Formula: (fuelPrice * distance) + 20% markup for vehicle wear
 * @param {number} fuelPrice - Price per km of fuel
 * @param {number} distance - Distance in km
 * @returns {number} Total cost of the ride
 */
export const calculateTotalCost = (fuelPrice, distance) => {
  if (!fuelPrice || !distance || fuelPrice <= 0 || distance <= 0) {
    throw new Error("Preço do combustível e distância devem ser valores positivos");
  }
  
  const fuelCost = fuelPrice * distance;
  const markup = fuelCost * 0.20; // 20% markup for vehicle wear
  return Math.round((fuelCost + markup) * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate the price per member (passenger)
 * The driver doesn't pay, so total cost is divided by number of passengers
 * @param {number} totalCost - Total cost of the ride
 * @param {number} totalSeats - Total number of seats available
 * @returns {number} Price per passenger
 */
export const calculatePricePerMember = (totalCost, totalSeats) => {
  if (!totalCost || !totalSeats || totalCost <= 0 || totalSeats <= 0) {
    throw new Error("Custo total e número de vagas devem ser valores positivos");
  }
  
  // Driver doesn't pay, so we divide by number of passenger seats
  const passengerSeats = totalSeats;
  return Math.round((totalCost / passengerSeats) * 100) / 100; // Round to 2 decimal places
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
