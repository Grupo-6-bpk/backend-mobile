import prisma from "../../infrastructure/config/prismaClient.js";

export const listRideRequests = async (req, res, next) => {
  /*
  #swagger.tags = ["Ride Requests"]
  #swagger.description = 'List ride requests with pagination'
  #swagger.responses[200] = {
    description: 'Ride requests listed successfully',
    schema: {
      currentPage: 1,
      totalPages: 3,
      totalItems: 25,
      items: [
        {
          id: 1,
          startLocation: "Start Location",
          endLocation: "End Location",
          status: "PENDING",
          passengerShare: 25.50,
          createdAt: "2025-05-18T12:00:00Z",
          updatedAt: "2025-05-18T12:00:00Z",
          rideId: 1,
          passengerId: 1,
          passenger: {
            id: 1,
            active: true,
            userId: 1
          },
          ride: {
            id: 1,
            startLocation: "Start Location",
            endLocation: "End Location",
            distance: 15.5,
            departureTime: "2025-05-18T12:00:00Z",
            totalCost: 50.00,
            fuelPrice: 5.50,
            vehicleId: 1,
            vehicle: {
              id: 1,
              model: "Model S",
              brand: "Tesla",
              year: 2023,
              plate: "ABC1234",
              fuelConsumption: 0
            }
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
    
    // Filter by passenger if query param exists
    if (req.query.passengerId) {
      where.passengerId = parseInt(req.query.passengerId);
    }
    
    // Filter by ride if query param exists
    if (req.query.rideId) {
      where.rideId = parseInt(req.query.rideId);
    }
    
    // Filter by status if query param exists
    if (req.query.status) {
      where.status = req.query.status;
    }    const rideRequests = await prisma.rideRequest.findMany({
      where,
      skip: offset,
      take: size,
      orderBy: {
        ...req.order,
      },
      include: {
        passenger: true,
        ride: {
          include: {
            vehicle: true
          }
        }
      }
    });

    const totalData = await prisma.rideRequest.count({ where });
    const totalPages = Math.ceil(totalData / size);

    const data = res.hateos_list("rideRequests", rideRequests, totalPages);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const getRideRequest = async (req, res, next) => {
  /*
  #swagger.tags = ["Ride Requests"]
  #swagger.description = 'Get a ride request by ID'
  #swagger.responses[200] = { 
    description: 'Ride request found',
    schema: {
      id: 1,
      startLocation: "Start Location",
      endLocation: "End Location",
      status: "PENDING",
      passengerShare: 25.50,
      createdAt: "2025-05-18T12:00:00Z",
      updatedAt: "2025-05-18T12:00:00Z",
      rideId: 1,
      passengerId: 1,
      passenger: {
        id: 1,
        active: true,
        userId: 1
      },
      ride: {
        id: 1,
        startLocation: "Start Location",
        endLocation: "End Location",
        distance: 15.5,
        departureTime: "2025-05-18T12:00:00Z",
        totalCost: 50.00,
        fuelPrice: 5.50,
        vehicleId: 1,
        vehicle: {
          id: 1,
          model: "Model S",
          brand: "Tesla",
          year: 2023,
          plate: "ABC1234",
          fuelConsumption: 0
        }
      }
    }
  }
  #swagger.responses[404] = { description: 'Ride request not found' }
  */
  try {
    const rideRequestId = Number(req.params.id) || 0;    const rideRequest = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: {
        passenger: true,
        ride: {
          include: {
            vehicle: true
          }
        }
      }
    });

    if (!rideRequest) {
      return res.status(404).json({ message: "Solicitação de carona não encontrada" });
    }

    const data = res.hateos_item(rideRequest);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const createRideRequest = async (req, res, next) => {
  /*
  #swagger.tags = ["Ride Requests"]
  #swagger.description = 'Create a new ride request'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/RideRequestCreate" }
  }
  #swagger.responses[201] = { 
    description: 'Ride request created successfully',
    schema: { 
      id: 1,
      startLocation: "Start Location",
      endLocation: "End Location",
      status: "PENDING",
      passengerShare: 25.50,
      rideId: 1,
      passengerId: 1
    } 
  }
  #swagger.responses[400] = {
    description: "Bad Request"
  }
  */
  try {
    // Remove read-only fields and nested objects that Prisma doesn't expect
    const { id, createdAt, updatedAt, ride, passenger, ...rideRequestData } = req.body;

    // Check if passenger exists
    const passengerExists = await prisma.passenger.findUnique({
      where: { id: rideRequestData.passengerId }
    });

    if (!passengerExists) {
      return res.status(400).json({ message: "Passageiro não encontrado" });
    }    // Check if ride exists
    const rideExists = await prisma.ride.findUnique({
      where: { id: rideRequestData.rideId }
    });

    if (!rideExists) {
      return res.status(400).json({ message: "Carona não encontrada" });
    }

    // Check if ride has available seats (only if status is being set to APPROVED)
    if (rideRequestData.status === "APPROVED") {
      if (rideExists.availableSeats <= 0) {
        return res.status(400).json({ message: "Não há vagas disponíveis nesta carona" });
      }
    }

    // Set default status to PENDING if not provided
    if (!rideRequestData.status) {
      rideRequestData.status = "PENDING";
    }    // Calculate passenger share based on ride's price per member
    if (!rideRequestData.passengerShare && rideExists.pricePerMember) {
      rideRequestData.passengerShare = rideExists.pricePerMember;
    } else if (!rideRequestData.passengerShare && rideExists.totalCost && rideExists.totalSeats) {
      // Fallback calculation if pricePerMember is not available
      rideRequestData.passengerShare = rideExists.totalCost / rideExists.totalSeats;
    }const newRideRequest = await prisma.rideRequest.create({
      data: rideRequestData
    });

    // If the request was approved, decrease available seats
    if (rideRequestData.status === "APPROVED") {
      await prisma.ride.update({
        where: { id: rideRequestData.rideId },
        data: {
          availableSeats: rideExists.availableSeats - 1,
          updatedAt: new Date()
        }
      });
    }

    res.created(newRideRequest);
  } catch (err) {
    console.error("Erro ao criar solicitação de carona:", err);
    next(err);
  }
};

export const updateRideRequest = async (req, res, next) => {
  /*
  #swagger.tags = ["Ride Requests"]
  #swagger.description = 'Update a ride request'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/RideRequestUpdate" }
  }
  #swagger.responses[200] = { 
    description: 'Ride request updated successfully',
    schema: { 
      id: 1,
      startLocation: "Updated Start Location",
      endLocation: "Updated End Location",
      status: "APPROVED",
      passengerShare: 25.50,
      createdAt: "2025-05-18T12:00:00Z",
      updatedAt: "2025-05-18T12:00:00Z",
      rideId: 1,
      passengerId: 1
    } 
  }
  #swagger.responses[404] = { description: 'Ride request not found' }
  */
  try {
    const rideRequestId = Number(req.params.id) || 0;
      // Check if ride request exists
    const rideRequestExists = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: {
        ride: true
      }
    });

    if (!rideRequestExists) {
      return res.status(404).json({ message: "Solicitação de carona não encontrada" });
    }
    
    // Remove read-only fields and nested objects
    const { id, createdAt, updatedAt, rideId, passengerId, ride, passenger, ...updateData } = req.body;
    
    // Handle status changes that affect seat availability
    const oldStatus = rideRequestExists.status;
    const newStatus = updateData.status;
    
    if (oldStatus !== newStatus && newStatus) {
      // If changing from non-approved to approved, check seat availability
      if (oldStatus !== "APPROVED" && newStatus === "APPROVED") {
        if (rideRequestExists.ride.availableSeats <= 0) {
          return res.status(400).json({ message: "Não há vagas disponíveis nesta carona" });
        }
        
        // Decrease available seats
        await prisma.ride.update({
          where: { id: rideRequestExists.rideId },
          data: {
            availableSeats: rideRequestExists.ride.availableSeats - 1,
            updatedAt: new Date()
          }
        });
      }
      // If changing from approved to non-approved, increase available seats
      else if (oldStatus === "APPROVED" && newStatus !== "APPROVED") {
        await prisma.ride.update({
          where: { id: rideRequestExists.rideId },
          data: {
            availableSeats: rideRequestExists.ride.availableSeats + 1,
            updatedAt: new Date()
          }
        });
      }
    }
    
    const updatedRideRequest = await prisma.rideRequest.update({
      where: { id: rideRequestId },
      data: updateData
    });

    const data = res.hateos_item(updatedRideRequest);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const deleteRideRequest = async (req, res, next) => {
  /*
  #swagger.tags = ['Ride Requests']
  #swagger.description = 'Delete a ride request by ID'
  #swagger.responses[204] = { description: 'Ride request deleted successfully' }
  #swagger.responses[404] = { description: 'Ride request not found' }
  */
  try {
    const rideRequestId = Number(req.params.id) || 0;
      // Check if ride request exists
    const rideRequestExists = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: {
        ride: true
      }
    });

    if (!rideRequestExists) {
      return res.status(404).json({ message: "Solicitação de carona não encontrada" });
    }

    // If the ride request was approved, restore the seat when deleting
    if (rideRequestExists.status === "APPROVED") {
      await prisma.ride.update({
        where: { id: rideRequestExists.rideId },
        data: {
          availableSeats: rideRequestExists.ride.availableSeats + 1,
          updatedAt: new Date()
        }
      });
    }

    await prisma.rideRequest.delete({
      where: { id: rideRequestId }
    });

    res.no_content();
  } catch (err) {
    next(err);
  }
};

export const updateRideRequestStatus = async (req, res, next) => {
  /*
  #swagger.tags = ["Ride Requests"]
  #swagger.description = 'Update ride request status (approve/reject/cancel)'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/RideRequestStatusUpdate" }
  }
  #swagger.responses[200] = { 
    description: 'Ride request status updated successfully',
    schema: { 
      id: 1,
      startLocation: "Start Location",
      endLocation: "End Location",
      status: "APPROVED",
      passengerShare: 12.50,
      createdAt: "2025-05-18T12:00:00Z",
      updatedAt: "2025-05-18T12:00:00Z",
      rideId: 1,
      passengerId: 1,
      message: "Status da solicitação atualizado com sucesso"
    } 
  }
  #swagger.responses[404] = { description: 'Ride request not found' }
  #swagger.responses[400] = { description: 'No available seats, invalid status transition, or bad request' }
  */
  try {
    const rideRequestId = Number(req.params.id) || 0;
    const { status } = req.body;
    
    // Validate that status is provided
    if (!status) {
      return res.status(400).json({ message: "Status é obrigatório" });
    }
    
    // Check if ride request exists
    const rideRequestExists = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: {
        ride: {
          select: {
            id: true,
            availableSeats: true,
            totalSeats: true,
            startLocation: true,
            endLocation: true,
            departureTime: true,
            pricePerMember: true
          }
        },
        passenger: {
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
        }
      }
    });

    if (!rideRequestExists) {
      return res.status(404).json({ message: "Solicitação de carona não encontrada" });
    }
    
    const oldStatus = rideRequestExists.status;
    
    // Validate status transition
    if (oldStatus === status) {
      return res.status(400).json({ 
        message: `O status já está definido como ${status}`,
        currentStatus: oldStatus
      });
    }

    // Validate business rules for status transitions
    if (oldStatus === "CANCELLED" || oldStatus === "REJECTED") {
      return res.status(400).json({ 
        message: `Não é possível alterar o status de uma solicitação ${oldStatus.toLowerCase()}`,
        currentStatus: oldStatus
      });
    }

    // Check if ride has already departed (optional business rule)
    const now = new Date();
    if (rideRequestExists.ride.departureTime && new Date(rideRequestExists.ride.departureTime) < now) {
      return res.status(400).json({ 
        message: "Não é possível alterar o status de uma solicitação para carona que já partiu" 
      });
    }
    
    // Handle seat availability for status changes
    let seatAdjustment = 0;
    
    if (oldStatus !== "APPROVED" && status === "APPROVED") {
      // Trying to approve - check seat availability
      if (rideRequestExists.ride.availableSeats <= 0) {
        return res.status(400).json({ 
          message: "Não há vagas disponíveis nesta carona",
          availableSeats: rideRequestExists.ride.availableSeats,
          totalSeats: rideRequestExists.ride.totalSeats
        });
      }
      seatAdjustment = -1; // Decrease available seats
    } else if (oldStatus === "APPROVED" && status !== "APPROVED") {
      // Changing from approved to something else - restore seat
      seatAdjustment = 1; // Increase available seats
    }
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Update the ride request status
      const updatedRideRequest = await prisma.rideRequest.update({
        where: { id: rideRequestId },
        data: {
          status: status,
          updatedAt: new Date()
        },
        include: {
          ride: {
            select: {
              id: true,
              startLocation: true,
              endLocation: true,
              departureTime: true,
              totalSeats: true,
              availableSeats: true
            }
          },
          passenger: {
            select: {
              id: true,
              userId: true
            }
          }
        }
      });

      // Update seat availability if needed
      if (seatAdjustment !== 0) {
        await prisma.ride.update({
          where: { id: rideRequestExists.rideId },
          data: {
            availableSeats: rideRequestExists.ride.availableSeats + seatAdjustment,
            updatedAt: new Date()
          }
        });
        
        // Update the returned data with new seat count
        updatedRideRequest.ride.availableSeats = rideRequestExists.ride.availableSeats + seatAdjustment;
      }

      return updatedRideRequest;
    });

    // Prepare response with additional context
    const responseData = {
      ...result,
      message: "Status da solicitação atualizado com sucesso",
      previousStatus: oldStatus,
      newStatus: status,
      seatUpdate: seatAdjustment !== 0 ? {
        adjustment: seatAdjustment,
        newAvailableSeats: result.ride.availableSeats
      } : null
    };

    const data = res.hateos_item(responseData);
    res.ok(data);
  } catch (err) {
    console.error("Erro ao atualizar status da solicitação de carona:", err);
    next(err);
  }
};
