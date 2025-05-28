import prisma from "../../infrastructure/config/prismaClient.js";
import { recalculateRideCosts } from "../../domain/ride/rideCalculations.js";

export const listRides = async (req, res, next) => {
  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'List rides with pagination'  #swagger.responses[200] = {
    description: 'Rides listed successfully',
    schema: {
      currentPage: 1,
      totalPages: 3,
      totalItems: 25,
      items: [        {
          id: 1,
          startLocation: "Start Location",
          endLocation: "End Location",
          distance: 15.5,
          departureTime: "2025-05-18T12:00:00Z",
          totalCost: 50.00,
          fuelPrice: 5.50,
          pricePerMember: 12.50,
          totalSeats: 4,
          availableSeats: 2,
          createdAt: "2025-05-18T12:00:00Z",
          updatedAt: "2025-05-18T12:00:00Z",          driverId: 1,
          vehicleId: 1,          driver: {
            id: 1,
            userId: 1
          },
          vehicle: {
            id: 1,
            model: "Model S",
            brand: "Tesla",
            plate: "ABC1234"
          },
          _count: {
            rideRequests: 2
          }
        }
      ]
    }
  }
  */
  try {
    const page = parseInt(req.query._page) || 1;
    const size = parseInt(req.query._size) || 10;
    const offset = (page - 1) * size;
    
    let where = {};
    
    // Filter by driver if query param exists
    if (req.query.driverId) {
      where.driverId = parseInt(req.query.driverId);
    }
      // Filter by departure time range if query params exist
    if (req.query.fromDate && req.query.toDate) {
      where.departureTime = {
        gte: new Date(req.query.fromDate),
        lte: new Date(req.query.toDate)
      };
    }
    
    // Filter by rides with available seats if query param exists
    if (req.query.hasAvailableSeats === "true") {
      where.availableSeats = {
        gt: 0
      };
    }
  const rides = await prisma.ride.findMany({
      where,
      skip: offset,
      take: size,
      orderBy: {
        ...req.order,
      },      include: {
        driver: {
          select: {
            id: true,
            userId: true
          }
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            brand: true,
            plate: true
          }
        },
        _count: {
          select: {
            rideRequests: true
          }
        }
      }
    });

    const totalData = await prisma.ride.count({ where });
    const totalPages = Math.ceil(totalData / size);

    const data = res.hateos_list("rides", rides, totalPages);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const getRide = async (req, res, next) => {
  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'Get a ride by ID with detailed information'  #swagger.responses[200] = { 
    description: 'Ride found',    schema: {
      id: 1,
      startLocation: "Start Location",
      endLocation: "End Location",
      distance: 15.5,
      departureTime: "2025-05-18T12:00:00Z",
      totalCost: 50.00,
      fuelPrice: 5.50,
      pricePerMember: 12.50,
      totalSeats: 4,
      availableSeats: 2,
      createdAt: "2025-05-18T12:00:00Z",
      updatedAt: "2025-05-18T12:00:00Z",      driverId: 1,
      vehicleId: 1,
      driver: {
        id: 1,
        cnh: "1234567890",
        cnhVerified: true,
        userId: 1,
        user: {
          id: 1,
          name: "Driver Name",
          last_name: "Driver Lastname"
        }
      },      vehicle: {
        id: 1,
        model: "Model S",
        brand: "Tesla",
        plate: "ABC1234"
      },
      rideRequests: [
        {
          id: 1,
          status: "PENDING",
          passengerShare: 25.00,
          passengerId: 1,
          passenger: {
            id: 1,
            userId: 1,
            user: {
              id: 1,
              name: "Passenger Name",
              last_name: "Passenger Lastname"
            }
          }
        }
      ]
    }
  }
  #swagger.responses[404] = { description: 'Ride not found' }
  */
  try {
    const rideId = Number(req.params.id) || 0;      const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
      driver: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              name: true,
              last_name: true
            }
          }
        }
      },
      vehicle: true,
      rideRequests: {
        include: {
        passenger: {
          include: {
          user: true
          }
        }
        }
      }
      }
    });

    if (!ride) {
      return res.status(404).json({ message: "Carona não encontrada" });
    }

    const data = res.hateos_item(ride);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const createRide = async (req, res, next) => {  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'Create a new ride'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/RideCreate" }
  }  #swagger.responses[201] = { 
    description: 'Ride created successfully',
    schema: { 
      id: 1,
      startLocation: "Start Location",
      endLocation: "End Location",
      distance: 15.5,
      departureTime: "2025-05-18T12:00:00Z",
      totalCost: 50.00,
      fuelPrice: 5.50,
      pricePerMember: 12.50,
      totalSeats: 4,
      availableSeats: 4,
      driverId: 1,
      vehicleId: 1
    } 
  }
  #swagger.responses[400] = {
    description: "Bad Request"
  }
  */  try {
    const { 
      id, createdAt, updatedAt, 
      driver, vehicle, rideRequests, 
      ...rideData 
    } = req.body;

    // Check if driver exists
    const driverExists = await prisma.driver.findUnique({
      where: { id: rideData.driverId }
    });

    if (!driverExists) {
      return res.status(400).json({ message: "Motorista não encontrado" });
    }

    // Check if vehicle exists and belongs to the driver
    if (rideData.vehicleId) {
      const vehicleExists = await prisma.vehicle.findUnique({
        where: { id: rideData.vehicleId }
      });

      if (!vehicleExists) {
        return res.status(400).json({ message: "Veículo não encontrado" });
      }

      if (vehicleExists.driverId !== rideData.driverId) {
        return res.status(400).json({ message: "Este veículo não pertence ao motorista informado" });
      }
    }    // Set timestamps and available seats
    rideData.createdAt = new Date();
    rideData.updatedAt = new Date();
    rideData.availableSeats = rideData.totalSeats; // Initially all seats are available

    // Calculate costs automatically
    const calculatedCosts = recalculateRideCosts(rideData);
    rideData.totalCost = calculatedCosts.totalCost;
    rideData.pricePerMember = calculatedCosts.pricePerMember;

    // Create proper data object with relationships using connect syntax
    const createData = {
      ...rideData,
      driver: {
        connect: { id: rideData.driverId }
      }
    };

    // Add vehicle connection if vehicleId is provided
    if (rideData.vehicleId) {
      createData.vehicle = {
        connect: { id: rideData.vehicleId }
      };
    }

    // Remove the raw IDs since we're now using connect syntax
    delete createData.driverId;
    delete createData.vehicleId;

    const newRide = await prisma.ride.create({
      data: createData
    });

    res.created(newRide);
  } catch (err) {
    console.error("Erro ao criar carona:", err);
    next(err);
  }
};

export const updateRide = async (req, res, next) => {  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'Update a ride'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/RideCreate" }
  }  #swagger.responses[200] = {    description: 'Ride updated successfully',
    schema: { 
      id: 1,
      startLocation: "Updated Start Location",
      endLocation: "Updated End Location",
      distance: 20.5,
      departureTime: "2025-06-18T12:00:00Z",      
      totalCost: 60.00,
      fuelPrice: 6.50,
      pricePerMember: 15.00,
      totalSeats: 4,
      availableSeats: 2,
      createdAt: "2025-05-18T12:00:00Z",
      updatedAt: "2025-05-18T12:00:00Z",
      driverId: 1,
      vehicleId: 1
    } 
  }
  #swagger.responses[404] = { description: 'Ride not found' }
  */
  try {
    const rideId = Number(req.params.id) || 0;
    
    // Check if ride exists
    const rideExists = await prisma.ride.findUnique({
      where: { id: rideId }
    });

    if (!rideExists) {
      return res.status(404).json({ message: "Carona não encontrada" });
    }
      // Remove read-only fields
    const { id, createdAt, updatedAt, driverId, ...updateData } = req.body;
      // If vehicleId is being updated, verify that the vehicle exists and belongs to the driver
    if (updateData.vehicleId) {
      const ride = await prisma.ride.findUnique({
        where: { id: rideId }
      });
      
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: updateData.vehicleId }
      });
      
      if (!vehicle) {
        return res.status(400).json({ message: "Veículo não encontrado" });
      }
      
      if (vehicle.driverId !== ride.driverId) {
        return res.status(400).json({ message: "Este veículo não pertence ao motorista desta carona" });
      }
    }
    
    // If totalSeats is being updated, verify that it's not less than occupied seats
    if (updateData.totalSeats) {
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          _count: {
            select: {
              rideRequests: {
                where: {
                  status: "APPROVED"
                }
              }
            }
          }
        }
      });
      
      const occupiedSeats = ride._count.rideRequests;
      
      if (updateData.totalSeats < occupiedSeats) {
        return res.status(400).json({ 
          message: `Não é possível reduzir o número de vagas para ${updateData.totalSeats}. Já existem ${occupiedSeats} vagas ocupadas.` 
        });
      }
      
      // Update available seats accordingly
      updateData.availableSeats = updateData.totalSeats - occupiedSeats;    }
    
    // Update the timestamp
    updateData.updatedAt = new Date();
    
    // Recalculate costs if relevant fields changed
    const needsRecalculation = updateData.fuelPrice || updateData.distance || updateData.totalSeats;
    if (needsRecalculation) {
      // Get current ride data to merge with updates
      const currentRide = await prisma.ride.findUnique({
        where: { id: rideId }
      });
      
      const mergedData = {
        fuelPrice: updateData.fuelPrice || currentRide.fuelPrice,
        distance: updateData.distance || currentRide.distance,
        totalSeats: updateData.totalSeats || currentRide.totalSeats
      };
      
      const calculatedCosts = recalculateRideCosts(mergedData);
      updateData.totalCost = calculatedCosts.totalCost;
      updateData.pricePerMember = calculatedCosts.pricePerMember;
    }
    
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: updateData
    });

    const data = res.hateos_item(updatedRide);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const deleteRide = async (req, res, next) => {
  /*
  #swagger.tags = ['Rides']
  #swagger.description = 'Delete a ride by ID'
  #swagger.responses[204] = { description: 'Ride deleted successfully' }
  #swagger.responses[404] = { description: 'Ride not found' }
  */
  try {
    const rideId = Number(req.params.id) || 0;
    
    // Check if ride exists
    const rideExists = await prisma.ride.findUnique({
      where: { id: rideId }
    });

    if (!rideExists) {
      return res.status(404).json({ message: "Carona não encontrada" });
    }

    // Check if there are any approved ride requests
    const approvedRequests = await prisma.rideRequest.count({
      where: { 
        rideId: rideId,
        status: "APPROVED"
      }
    });

    if (approvedRequests > 0) {
      return res.status(400).json({ 
        message: "Carona possui solicitações aprovadas e não pode ser excluída" 
      });
    }

    // Delete all pending ride requests first (maintain referential integrity)
    await prisma.rideRequest.deleteMany({
      where: { rideId: rideId }
    });

    // Then delete the ride
    await prisma.ride.delete({
      where: { id: rideId }
    });

    res.no_content();
  } catch (err) {
    next(err);
  }
};

export const recalculateAvailableSeats = async (req, res, next) => {
  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'Recalculate available seats for a ride based on approved requests'
  #swagger.responses[200] = { 
    description: 'Available seats recalculated successfully',
    schema: {
      id: 1,
      totalSeats: 4,
      approvedRequests: 2,
      availableSeats: 2,
      message: "Vagas disponíveis recalculadas com sucesso"
    }
  }
  #swagger.responses[404] = { description: 'Ride not found' }
  */
  try {
    const rideId = Number(req.params.id) || 0;
    
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        _count: {
          select: {
            rideRequests: {
              where: {
                status: "APPROVED"
              }
            }
          }
        }
      }
    });

    if (!ride) {
      return res.status(404).json({ message: "Carona não encontrada" });
    }

    const approvedRequests = ride._count.rideRequests;
    const newAvailableSeats = ride.totalSeats - approvedRequests;

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        availableSeats: newAvailableSeats,
        updatedAt: new Date()
      }
    });

    res.ok({
      id: rideId,
      totalSeats: ride.totalSeats,
      approvedRequests: approvedRequests,
      availableSeats: newAvailableSeats,
      message: "Vagas disponíveis recalculadas com sucesso"
    });
  } catch (err) {
    next(err);
  }
};

export const listAvailableRides = async (req, res, next) => {
  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'List rides with available seats'
  #swagger.responses[200] = {
    description: 'Available rides listed successfully',
    schema: {
      currentPage: 1,
      totalPages: 2,
      totalItems: 15,
      items: [
        {
          id: 1,
          startLocation: "Start Location",
          endLocation: "End Location", 
          distance: 15.5,
          departureTime: "2025-05-18T12:00:00Z",
          totalCost: 50.00,
          fuelPrice: 5.50,
          pricePerMember: 12.50,
          totalSeats: 4,
          availableSeats: 2,
          createdAt: "2025-05-18T12:00:00Z",
          updatedAt: "2025-05-18T12:00:00Z",
          driverId: 1,
          vehicleId: 1,
          driver: {
            id: 1,
            userId: 1
          },
          vehicle: {
            id: 1,
            model: "Model S",
            brand: "Tesla",
            plate: "ABC1234"
          }
        }
      ]
    }
  }
  */
  try {
    const page = parseInt(req.query._page) || 1;
    const size = parseInt(req.query._size) || 10;
    const offset = (page - 1) * size;
    
    let where = {
      availableSeats: {
        gt: 0
      }
    };
    
    // Filter by driver if query param exists
    if (req.query.driverId) {
      where.driverId = parseInt(req.query.driverId);
    }
    
    // Filter by departure time range if query params exist
    if (req.query.fromDate && req.query.toDate) {
      where.departureTime = {
        gte: new Date(req.query.fromDate),
        lte: new Date(req.query.toDate)
      };
    }

    const rides = await prisma.ride.findMany({
      where,
      skip: offset,
      take: size,
      orderBy: {
        departureTime: 'asc',
        ...req.order,
      },
      include: {
        driver: {
          select: {
            id: true,
            userId: true
          }
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            brand: true,
            plate: true
          }
        }
      }
    });

    const totalData = await prisma.ride.count({ where });
    const totalPages = Math.ceil(totalData / size);

    const data = res.hateos_list("rides/available", rides, totalPages);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};
