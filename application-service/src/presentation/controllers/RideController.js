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
    });    res.created(newRide);
  } catch (err) {
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
    
    // Only show future rides by default, unless includeExpired is true
    if (!req.query.includeExpired || req.query.includeExpired !== 'true') {
      where.departureTime = {
        gte: new Date()
      };
    }
    
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
    } else if (req.query.fromDate) {
      where.departureTime = {
        gte: new Date(req.query.fromDate)
      };
    } else if (req.query.toDate) {
      where.departureTime = {
        lte: new Date(req.query.toDate)
      };
    }

    const rides = await prisma.ride.findMany({
      where,
      skip: offset,
      take: size,
      orderBy: {
        departureTime: 'asc',
        ...(req.order || {})
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
    const totalPages = Math.ceil(totalData / size);    const data = res.hateos_list("rides/available", rides, totalPages);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const getDashboardData = async (req, res, next) => {
  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'Get dashboard data for user including past rides as driver and passenger'
  #swagger.responses[200] = {
    description: 'Dashboard data retrieved successfully',
    schema: {
      userId: 1,
      summary: {
        totalRidesAsDriver: 15,
        totalRidesAsPassenger: 8,
        totalSharedCosts: 450.75,
        totalSavedMoney: 320.50,
        totalDistanceTraveled: 1250.5,
        averageCostPerKm: 0.36
      },
      recentRidesAsDriver: [
        {
          id: 1,
          startLocation: "Campus A",
          endLocation: "Shopping Center",
          distance: 15.5,
          departureTime: "2025-05-25T14:30:00Z",
          totalCost: 45.00,
          pricePerMember: 11.25,
          totalSeats: 4,
          occupiedSeats: 3,
          passengersCount: 3,
          vehicle: {
            model: "Civic",
            brand: "Honda", 
            plate: "ABC1234"
          }
        }
      ],
      recentRidesAsPassenger: [
        {
          id: 2,
          startLocation: "Campus B", 
          endLocation: "Downtown",
          distance: 12.0,
          departureTime: "2025-05-20T08:00:00Z",
          passengerShare: 15.00,
          status: "APPROVED",
          driver: {
            name: "João Silva"
          },
          vehicle: {
            model: "Corolla",
            brand: "Toyota",
            plate: "XYZ5678"
          }
        }
      ],
      monthlyStats: [
        {
          month: "2025-05",
          ridesAsDriver: 3,
          ridesAsPassenger: 2,
          totalSharedCosts: 85.50,
          totalSavedMoney: 45.00
        }
      ]
    }
  }
  #swagger.responses[400] = { description: 'User ID is required' }
  #swagger.responses[404] = { description: 'User not found' }
  */
  try {
    const userId = parseInt(req.query.userId) || parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ message: "ID do usuário é obrigatório" });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: true,
        passenger: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const currentDate = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

    let dashboardData = {
      userId,
      summary: {
        totalRidesAsDriver: 0,
        totalRidesAsPassenger: 0,
        totalSharedCosts: 0,
        totalSavedMoney: 0,
        totalDistanceTraveled: 0,
        averageCostPerKm: 0
      },
      recentRidesAsDriver: [],
      recentRidesAsPassenger: [],
      monthlyStats: []
    };

    // Buscar dados como motorista (se for driver)
    if (user.driver) {
      // Caronas passadas como motorista
      const ridesAsDriver = await prisma.ride.findMany({
        where: {
          driverId: user.driver.id,
          departureTime: {
            lt: currentDate, // Apenas caronas já realizadas
            gte: threeMonthsAgo // Últimos 3 meses
          }
        },
        include: {
          vehicle: {
            select: {
              model: true,
              brand: true,
              plate: true
            }
          },
          _count: {
            select: {
              rideRequests: {
                where: {
                  status: "APPROVED"
                }
              }
            }
          },
          rideRequests: {
            where: {
              status: "APPROVED"
            },
            include: {
              passenger: {
                include: {
                  user: {
                    select: {
                      name: true,
                      last_name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          departureTime: 'desc'
        }
      });

      // Calcular estatísticas como motorista
      const totalRidesAsDriver = ridesAsDriver.length;
      const totalSharedCosts = ridesAsDriver.reduce((sum, ride) => {
        const passengersCount = ride._count.rideRequests;
        const driverShare = ride.totalCost - (passengersCount * ride.pricePerMember);
        return sum + (ride.totalCost - driverShare); // Total compartilhado com passageiros
      }, 0);

      const totalDistanceAsDriver = ridesAsDriver.reduce((sum, ride) => sum + (ride.distance || 0), 0);

      dashboardData.summary.totalRidesAsDriver = totalRidesAsDriver;
      dashboardData.summary.totalSharedCosts += totalSharedCosts;
      dashboardData.summary.totalDistanceTraveled += totalDistanceAsDriver;

      // Caronas recentes como motorista (últimas 5)
      dashboardData.recentRidesAsDriver = ridesAsDriver.slice(0, 5).map(ride => ({
        id: ride.id,
        startLocation: ride.startLocation,
        endLocation: ride.endLocation,
        distance: ride.distance,
        departureTime: ride.departureTime,
        totalCost: ride.totalCost,
        pricePerMember: ride.pricePerMember,
        totalSeats: ride.totalSeats,
        occupiedSeats: ride._count.rideRequests,
        passengersCount: ride._count.rideRequests,
        vehicle: ride.vehicle,
        passengers: ride.rideRequests.map(req => ({
          name: `${req.passenger.user.name} ${req.passenger.user.last_name}`,
          share: req.passengerShare
        }))
      }));
    }

    // Buscar dados como passageiro (se for passenger)
    if (user.passenger) {
      // Solicitações aprovadas como passageiro
      const ridesAsPassenger = await prisma.rideRequest.findMany({
        where: {
          passengerId: user.passenger.id,
          status: "APPROVED",
          ride: {
            departureTime: {
              lt: currentDate, // Apenas caronas já realizadas
              gte: threeMonthsAgo // Últimos 3 meses
            }
          }
        },
        include: {
          ride: {
            include: {
              driver: {
                include: {
                  user: {
                    select: {
                      name: true,
                      last_name: true
                    }
                  }
                }
              },
              vehicle: {
                select: {
                  model: true,
                  brand: true,
                  plate: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      // Calcular estatísticas como passageiro
      const totalRidesAsPassenger = ridesAsPassenger.length;
      const totalSavedMoney = ridesAsPassenger.reduce((sum, request) => {
        // Estimar economia: diferença entre custo total da viagem sozinho vs compartilhado
        const fullTripCost = request.ride.totalCost || 0;
        const sharedCost = request.passengerShare || 0;
        const estimatedSavings = Math.max(0, fullTripCost - sharedCost);
        return sum + estimatedSavings;
      }, 0);

      const totalDistanceAsPassenger = ridesAsPassenger.reduce((sum, request) => sum + (request.ride.distance || 0), 0);

      dashboardData.summary.totalRidesAsPassenger = totalRidesAsPassenger;
      dashboardData.summary.totalSavedMoney = totalSavedMoney;
      dashboardData.summary.totalDistanceTraveled += totalDistanceAsPassenger;

      // Caronas recentes como passageiro (últimas 5)
      dashboardData.recentRidesAsPassenger = ridesAsPassenger.slice(0, 5).map(request => ({
        id: request.ride.id,
        requestId: request.id,
        startLocation: request.startLocation || request.ride.startLocation,
        endLocation: request.endLocation || request.ride.endLocation,
        distance: request.ride.distance,
        departureTime: request.ride.departureTime,
        passengerShare: request.passengerShare,
        status: request.status,
        driver: {
          name: `${request.ride.driver.user.name} ${request.ride.driver.user.last_name}`
        },
        vehicle: request.ride.vehicle
      }));
    }

    // Calcular custo médio por km
    if (dashboardData.summary.totalDistanceTraveled > 0) {
      const totalCosts = dashboardData.summary.totalSharedCosts + dashboardData.summary.totalSavedMoney;
      dashboardData.summary.averageCostPerKm = totalCosts / dashboardData.summary.totalDistanceTraveled;
    }

    // Estatísticas mensais dos últimos 3 meses
    const monthlyStatsMap = new Map();
    
    // Inicializar meses
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyStatsMap.set(monthKey, {
        month: monthKey,
        ridesAsDriver: 0,
        ridesAsPassenger: 0,
        totalSharedCosts: 0,
        totalSavedMoney: 0
      });
    }

    // Processar caronas como motorista por mês
    if (user.driver) {
      const monthlyDriverRides = await prisma.ride.findMany({
        where: {
          driverId: user.driver.id,
          departureTime: {
            lt: currentDate,
            gte: threeMonthsAgo
          }
        },
        include: {
          _count: {
            select: {
              rideRequests: {
                where: { status: "APPROVED" }
              }
            }
          }
        }
      });

      monthlyDriverRides.forEach(ride => {
        const rideDate = new Date(ride.departureTime);
        const monthKey = `${rideDate.getFullYear()}-${String(rideDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyStatsMap.has(monthKey)) {
          const stats = monthlyStatsMap.get(monthKey);
          stats.ridesAsDriver++;
          
          const passengersCount = ride._count.rideRequests;
          const sharedAmount = passengersCount * ride.pricePerMember;
          stats.totalSharedCosts += sharedAmount;
          
          monthlyStatsMap.set(monthKey, stats);
        }
      });
    }

    // Processar caronas como passageiro por mês
    if (user.passenger) {
      const monthlyPassengerRides = await prisma.rideRequest.findMany({
        where: {
          passengerId: user.passenger.id,
          status: "APPROVED",
          ride: {
            departureTime: {
              lt: currentDate,
              gte: threeMonthsAgo
            }
          }
        },
        include: {
          ride: true
        }
      });

      monthlyPassengerRides.forEach(request => {
        const rideDate = new Date(request.ride.departureTime);
        const monthKey = `${rideDate.getFullYear()}-${String(rideDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyStatsMap.has(monthKey)) {
          const stats = monthlyStatsMap.get(monthKey);
          stats.ridesAsPassenger++;
          
          const fullTripCost = request.ride.totalCost || 0;
          const sharedCost = request.passengerShare || 0;
          const savings = Math.max(0, fullTripCost - sharedCost);
          stats.totalSavedMoney += savings;
          
          monthlyStatsMap.set(monthKey, stats);
        }
      });
    }

    dashboardData.monthlyStats = Array.from(monthlyStatsMap.values()).reverse();

    const data = res.hateos_item(dashboardData);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const getUserRideHistory = async (req, res, next) => {
  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'Get detailed ride history for a user with pagination and filters'
  #swagger.responses[200] = {
    description: 'User ride history retrieved successfully',
    schema: {
      currentPage: 1,
      totalPages: 5,
      totalItems: 45,
      items: [
        {
          id: 1,
          type: "driver",
          startLocation: "Campus A",
          endLocation: "Shopping Center",
          distance: 15.5,
          departureTime: "2025-05-25T14:30:00Z",
          totalCost: 45.00,
          userShare: 22.50,
          savings: 22.50,
          status: "completed",
          vehicle: {
            model: "Civic",
            brand: "Honda",
            plate: "ABC1234"
          },
          participants: [
            {
              name: "Maria Silva",
              role: "passenger",
              share: 11.25
            }
          ]
        },
        {
          id: 2,
          type: "passenger", 
          startLocation: "Campus B",
          endLocation: "Downtown",
          distance: 12.0,
          departureTime: "2025-05-20T08:00:00Z",
          totalCost: 30.00,
          userShare: 10.00,
          savings: 20.00,
          status: "completed",
          driver: {
            name: "João Santos"
          },
          vehicle: {
            model: "Corolla",
            brand: "Toyota",
            plate: "XYZ5678"
          }
        }
      ]
    }
  }
  #swagger.responses[400] = { description: 'User ID is required' }
  #swagger.responses[404] = { description: 'User not found' }
  */
  try {
    const userId = parseInt(req.query.userId) || parseInt(req.params.userId);
    const page = parseInt(req.query._page) || 1;
    const size = parseInt(req.query._size) || 10;
    const offset = (page - 1) * size;
    
    // Filtros opcionais
    const type = req.query.type; // 'driver', 'passenger', ou undefined para ambos
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : null;
    const status = req.query.status; // 'completed', 'cancelled', etc.

    if (!userId) {
      return res.status(400).json({ message: "ID do usuário é obrigatório" });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: true,
        passenger: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    let allRides = [];
    let totalCount = 0;

    // Construir filtros de data
    const dateFilter = {};
    if (fromDate) dateFilter.gte = fromDate;
    if (toDate) dateFilter.lte = toDate;

    // Buscar caronas como motorista
    if (user.driver && (!type || type === 'driver')) {
      const driverRideFilter = {
        driverId: user.driver.id,
        ...(Object.keys(dateFilter).length > 0 && { departureTime: dateFilter })
      };

      const driverRides = await prisma.ride.findMany({
        where: driverRideFilter,
        include: {
          vehicle: {
            select: {
              model: true,
              brand: true,
              plate: true
            }
          },
          rideRequests: {
            where: {
              status: "APPROVED"
            },
            include: {
              passenger: {
                include: {
                  user: {
                    select: {
                      name: true,
                      last_name: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              rideRequests: {
                where: { status: "APPROVED" }
              }
            }
          }
        },
        orderBy: {
          departureTime: 'desc'
        }
      });

      const driverRideHistory = driverRides.map(ride => {
        const passengersCount = ride._count.rideRequests;
        const totalSharedAmount = passengersCount * ride.pricePerMember;
        const driverShare = ride.totalCost - totalSharedAmount;
        
        return {
          id: ride.id,
          type: "driver",
          startLocation: ride.startLocation,
          endLocation: ride.endLocation,
          distance: ride.distance,
          departureTime: ride.departureTime,
          totalCost: ride.totalCost,
          userShare: driverShare,
          savings: totalSharedAmount,
          status: ride.departureTime < new Date() ? "completed" : "upcoming",
          vehicle: ride.vehicle,
          participants: ride.rideRequests.map(request => ({
            name: `${request.passenger.user.name} ${request.passenger.user.last_name}`,
            role: "passenger",
            share: request.passengerShare
          })),
          passengersCount,
          createdAt: ride.createdAt,
          updatedAt: ride.updatedAt
        };
      });

      allRides.push(...driverRideHistory);
    }

    // Buscar caronas como passageiro
    if (user.passenger && (!type || type === 'passenger')) {
      const passengerRideFilter = {
        passengerId: user.passenger.id,
        ...(status === 'completed' && { status: "APPROVED" }),
        ...(status === 'cancelled' && { status: { in: ["REJECTED", "CANCELLED"] } }),
        ride: {
          ...(Object.keys(dateFilter).length > 0 && { departureTime: dateFilter })
        }
      };

      const passengerRides = await prisma.rideRequest.findMany({
        where: passengerRideFilter,
        include: {
          ride: {
            include: {
              driver: {
                include: {
                  user: {
                    select: {
                      name: true,
                      last_name: true
                    }
                  }
                }
              },
              vehicle: {
                select: {
                  model: true,
                  brand: true,
                  plate: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      const passengerRideHistory = passengerRides.map(request => {
        const estimatedFullCost = request.ride.totalCost || 0;
        const userShare = request.passengerShare || 0;
        const savings = Math.max(0, estimatedFullCost - userShare);
        
        let rideStatus = "pending";
        if (request.status === "APPROVED") {
          rideStatus = request.ride.departureTime < new Date() ? "completed" : "upcoming";
        } else if (request.status === "REJECTED" || request.status === "CANCELLED") {
          rideStatus = "cancelled";
        }

        return {
          id: request.ride.id,
          requestId: request.id,
          type: "passenger",
          startLocation: request.startLocation || request.ride.startLocation,
          endLocation: request.endLocation || request.ride.endLocation,
          distance: request.ride.distance,
          departureTime: request.ride.departureTime,
          totalCost: request.ride.totalCost,
          userShare: userShare,
          savings: savings,
          status: rideStatus,
          requestStatus: request.status,
          driver: {
            name: `${request.ride.driver.user.name} ${request.ride.driver.user.last_name}`
          },
          vehicle: request.ride.vehicle,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt
        };
      });

      allRides.push(...passengerRideHistory);
    }

    // Aplicar filtro de status se especificado
    if (status) {
      allRides = allRides.filter(ride => ride.status === status);
    }

    // Ordenar por data de partida (mais recente primeiro)
    allRides.sort((a, b) => {
      const dateA = new Date(a.departureTime || a.updatedAt);
      const dateB = new Date(b.departureTime || b.updatedAt);
      return dateB - dateA;
    });

    // Aplicar paginação
    totalCount = allRides.length;
    const paginatedRides = allRides.slice(offset, offset + size);
    const totalPages = Math.ceil(totalCount / size);

    const response = {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      items: paginatedRides
    };

    const data = res.hateos_list("rides/history", response.items, totalPages);
    
    // Adicionar metadados de paginação
    data.currentPage = page;
    data.totalItems = totalCount;
    
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const getCostSharingStats = async (req, res, next) => {
  /*
  #swagger.tags = ["Rides"]
  #swagger.description = 'Get cost sharing statistics for environmental and economic impact'
  #swagger.responses[200] = {
    description: 'Cost sharing statistics retrieved successfully',
    schema: {
      userId: 1,
      period: {
        startDate: "2025-03-01T00:00:00Z",
        endDate: "2025-05-31T23:59:59Z",
        totalDays: 92
      },
      economicImpact: {
        totalSharedCosts: 450.75,
        totalSavedMoney: 320.50,
        averageSavingsPerRide: 15.25,
        costEfficiencyRate: 0.71
      },
      environmentalImpact: {
        totalDistanceShared: 1250.5,
        estimatedEmissionsSaved: 187.6,
        equivalentTreesPlanted: 8.5
      },
      communityImpact: {
        studentsHelped: 24,
        ridesShared: 23,
        averageOccupancyRate: 0.75,
        communityConnectionScore: 8.2
      },
      trends: [
        {
          month: "2025-03",
          sharedCosts: 125.50,
          savedMoney: 89.25,
          distanceShared: 345.2,
          ridesCount: 8
        },
        {
          month: "2025-04", 
          sharedCosts: 167.25,
          savedMoney: 125.75,
          distanceShared: 456.8,
          ridesCount: 11
        },
        {
          month: "2025-05",
          sharedCosts: 158.00,
          savedMoney: 105.50,
          distanceShared: 448.5,
          ridesCount: 10
        }
      ]
    }
  }
  #swagger.responses[400] = { description: 'User ID is required' }
  #swagger.responses[404] = { description: 'User not found' }
  */
  try {
    const userId = parseInt(req.query.userId) || parseInt(req.params.userId);
    const months = parseInt(req.query.months) || 3; // Padrão: últimos 3 meses
    
    if (!userId) {
      return res.status(400).json({ message: "ID do usuário é obrigatório" });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: true,
        passenger: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const currentDate = new Date();
    const startDate = new Date();
    startDate.setMonth(currentDate.getMonth() - months);
    startDate.setDate(1); // Primeiro dia do mês
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let stats = {
      userId,
      period: {
        startDate,
        endDate,
        totalDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      economicImpact: {
        totalSharedCosts: 0,
        totalSavedMoney: 0,
        averageSavingsPerRide: 0,
        costEfficiencyRate: 0
      },
      environmentalImpact: {
        totalDistanceShared: 0,
        estimatedEmissionsSaved: 0, // kg CO2
        equivalentTreesPlanted: 0
      },
      communityImpact: {
        studentsHelped: 0,
        ridesShared: 0,
        averageOccupancyRate: 0,
        communityConnectionScore: 0
      },
      trends: []
    };

    let totalRidesCount = 0;
    let totalOccupancySum = 0;
    const uniqueStudentsHelped = new Set();

    // Analisar caronas como motorista
    if (user.driver) {
      const driverRides = await prisma.ride.findMany({
        where: {
          driverId: user.driver.id,
          departureTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          rideRequests: {
            where: {
              status: "APPROVED"
            },
            include: {
              passenger: {
                include: {
                  user: {
                    select: {
                      id: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      driverRides.forEach(ride => {
        const passengersCount = ride.rideRequests.length;
        if (passengersCount > 0) {
          const sharedAmount = passengersCount * ride.pricePerMember;
          stats.economicImpact.totalSharedCosts += sharedAmount;
          stats.environmentalImpact.totalDistanceShared += ride.distance || 0;
          
          totalRidesCount++;
          totalOccupancySum += passengersCount / ride.totalSeats;
          
          // Adicionar estudantes únicos ajudados
          ride.rideRequests.forEach(request => {
            uniqueStudentsHelped.add(request.passenger.user.id);
          });
        }
      });
    }

    // Analisar caronas como passageiro
    if (user.passenger) {
      const passengerRequests = await prisma.rideRequest.findMany({
        where: {
          passengerId: user.passenger.id,
          status: "APPROVED",
          ride: {
            departureTime: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        include: {
          ride: true
        }
      });

      passengerRequests.forEach(request => {
        const fullTripCost = request.ride.totalCost || 0;
        const userPaid = request.passengerShare || 0;
        const savings = Math.max(0, fullTripCost - userPaid);
        
        stats.economicImpact.totalSavedMoney += savings;
        stats.environmentalImpact.totalDistanceShared += request.ride.distance || 0;
        totalRidesCount++;
      });
    }

    // Calcular métricas derivadas
    if (totalRidesCount > 0) {
      stats.economicImpact.averageSavingsPerRide = 
        (stats.economicImpact.totalSharedCosts + stats.economicImpact.totalSavedMoney) / totalRidesCount;
      
      const totalCostImpact = stats.economicImpact.totalSharedCosts + stats.economicImpact.totalSavedMoney;
      const estimatedOriginalCost = totalCostImpact * 1.5; // Estimativa de custo sem compartilhamento
      stats.economicImpact.costEfficiencyRate = totalCostImpact / estimatedOriginalCost;
      
      stats.communityImpact.averageOccupancyRate = totalOccupancySum / totalRidesCount;
    }

    // Cálculos ambientais (estimativas)
    if (stats.environmentalImpact.totalDistanceShared > 0) {
      // Estimativa: 0.15 kg CO2 por km economizado
      stats.environmentalImpact.estimatedEmissionsSaved = 
        stats.environmentalImpact.totalDistanceShared * 0.15;
      
      // Estimativa: 1 árvore absorve ~22 kg CO2 por ano
      stats.environmentalImpact.equivalentTreesPlanted = 
        stats.environmentalImpact.estimatedEmissionsSaved / 22;
    }

    // Métricas da comunidade
    stats.communityImpact.studentsHelped = uniqueStudentsHelped.size;
    stats.communityImpact.ridesShared = totalRidesCount;
    
    // Score de conexão da comunidade (0-10) baseado em atividade e ajuda mútua
    const activityScore = Math.min(totalRidesCount / 10, 1) * 5; // Max 5 pontos por atividade
    const helpScore = Math.min(uniqueStudentsHelped.size / 20, 1) * 3; // Max 3 pontos por ajuda
    const efficiencyScore = stats.communityImpact.averageOccupancyRate * 2; // Max 2 pontos por eficiência
    stats.communityImpact.communityConnectionScore = activityScore + helpScore + efficiencyScore;

    // Análise de tendências mensais
    const trendsMap = new Map();
    
    // Inicializar meses
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      trendsMap.set(monthKey, {
        month: monthKey,
        sharedCosts: 0,
        savedMoney: 0,
        distanceShared: 0,
        ridesCount: 0
      });
    }

    // Processar tendências como motorista
    if (user.driver) {
      const monthlyDriverRides = await prisma.ride.findMany({
        where: {
          driverId: user.driver.id,
          departureTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          rideRequests: {
            where: { status: "APPROVED" }
          }
        }
      });

      monthlyDriverRides.forEach(ride => {
        const rideDate = new Date(ride.departureTime);
        const monthKey = `${rideDate.getFullYear()}-${String(rideDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (trendsMap.has(monthKey)) {
          const trend = trendsMap.get(monthKey);
          const passengersCount = ride.rideRequests.length;
          
          if (passengersCount > 0) {
            trend.sharedCosts += passengersCount * ride.pricePerMember;
            trend.distanceShared += ride.distance || 0;
            trend.ridesCount++;
          }
          
          trendsMap.set(monthKey, trend);
        }
      });
    }

    // Processar tendências como passageiro
    if (user.passenger) {
      const monthlyPassengerRides = await prisma.rideRequest.findMany({
        where: {
          passengerId: user.passenger.id,
          status: "APPROVED",
          ride: {
            departureTime: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        include: {
          ride: true
        }
      });

      monthlyPassengerRides.forEach(request => {
        const rideDate = new Date(request.ride.departureTime);
        const monthKey = `${rideDate.getFullYear()}-${String(rideDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (trendsMap.has(monthKey)) {
          const trend = trendsMap.get(monthKey);
          
          const fullTripCost = request.ride.totalCost || 0;
          const userPaid = request.passengerShare || 0;
          const savings = Math.max(0, fullTripCost - userPaid);
          
          trend.savedMoney += savings;
          trend.distanceShared += request.ride.distance || 0;
          trend.ridesCount++;
          
          trendsMap.set(monthKey, trend);
        }
      });
    }

    stats.trends = Array.from(trendsMap.values()).reverse();

    const data = res.hateos_item(stats);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};
