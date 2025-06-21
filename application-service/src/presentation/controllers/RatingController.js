import prisma from "../../infrastructure/config/prismaClient.js";

export const listRatings = async (req, res, next) => {
  /*
  #swagger.tags = ["Ratings"]
  #swagger.description = 'List ratings with pagination and filters'
  #swagger.responses[200] = {
    description: 'Ratings listed successfully',
    schema: {
      currentPage: 1,
      totalPages: 3,
      totalItems: 25,
      items: [
        {
          id: 1,
          stars: 5,
          comment: "Excelente motorista, muito pontual!",
          createdAt: "2025-06-20T12:00:00Z",
          updatedAt: "2025-06-20T12:00:00Z",
          rideId: 1,
          reviewerId: 2,
          revieweeId: 1,
          reviewer: {
            id: 2,
            name: "Maria",
            last_name: "Silva"
          },
          reviewee: {
            id: 1,
            name: "João",
            last_name: "Santos"
          },
          ride: {
            id: 1,
            startLocation: "Campus A",
            endLocation: "Shopping Center",
            departureTime: "2025-06-20T14:30:00Z"
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
    
    // Filter by ride if query param exists
    if (req.query.rideId) {
      where.rideId = parseInt(req.query.rideId);
    }
    
    // Filter by reviewer if query param exists
    if (req.query.reviewerId) {
      where.reviewerId = parseInt(req.query.reviewerId);
    }
    
    // Filter by reviewee if query param exists
    if (req.query.revieweeId) {
      where.revieweeId = parseInt(req.query.revieweeId);
    }
    
    // Filter by minimum stars if query param exists
    if (req.query.minStars) {
      where.stars = {
        gte: parseInt(req.query.minStars)
      };
    }

    const ratings = await prisma.rating.findMany({
      where,
      skip: offset,
      take: size,
      orderBy: {
        createdAt: 'desc',
        ...req.order,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            last_name: true,
            avatarUrl: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            last_name: true,
            avatarUrl: true
          }
        },
        ride: {
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            departureTime: true,
            distance: true
          }
        }
      }
    });

    const totalData = await prisma.rating.count({ where });
    const totalPages = Math.ceil(totalData / size);

    const data = res.hateos_list("ratings", ratings, totalPages);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const getRating = async (req, res, next) => {
  /*
  #swagger.tags = ["Ratings"]
  #swagger.description = 'Get a rating by ID'
  #swagger.responses[200] = { 
    description: 'Rating found',
    schema: {
      id: 1,
      stars: 5,
      comment: "Excelente motorista, muito pontual e carro limpo!",
      createdAt: "2025-06-20T12:00:00Z",
      updatedAt: "2025-06-20T12:00:00Z",
      rideId: 1,
      reviewerId: 2,
      revieweeId: 1,
      reviewer: {
        id: 2,
        name: "Maria",
        last_name: "Silva",
        avatarUrl: "https://example.com/avatar2.jpg"
      },
      reviewee: {
        id: 1,
        name: "João",
        last_name: "Santos",
        avatarUrl: "https://example.com/avatar1.jpg"
      },
      ride: {
        id: 1,
        startLocation: "Campus A",
        endLocation: "Shopping Center",
        departureTime: "2025-06-20T14:30:00Z",
        distance: 15.5
      }
    }
  }
  #swagger.responses[404] = { description: 'Rating not found' }
  */
  try {
    const ratingId = Number(req.params.id) || 0;

    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            last_name: true,
            avatarUrl: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            last_name: true,
            avatarUrl: true
          }
        },
        ride: {
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            departureTime: true,
            distance: true,
            totalCost: true,
            driverId: true
          }
        }
      }
    });

    if (!rating) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }

    const data = res.hateos_item(rating);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const createRating = async (req, res, next) => {
  /*
  #swagger.tags = ["Ratings"]
  #swagger.description = 'Create a new rating for a ride'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/RatingCreate" }
  }
  #swagger.responses[201] = { 
    description: 'Rating created successfully',
    schema: { 
      id: 1,
      stars: 5,
      comment: "Excelente motorista!",
      rideId: 1,
      reviewerId: 2,
      revieweeId: 1,
      createdAt: "2025-06-20T12:00:00Z",
      updatedAt: "2025-06-20T12:00:00Z"
    } 
  }
  #swagger.responses[400] = {
    description: "Bad Request - Validation errors"
  }
  #swagger.responses[409] = {
    description: "Conflict - Rating already exists for this ride"
  }
  */
  try {
    const { 
      id, createdAt, updatedAt, 
      reviewer, reviewee, ride, 
      ...ratingData 
    } = req.body;

    // Validate stars range
    if (ratingData.stars < 1 || ratingData.stars > 5) {
      return res.status(400).json({ 
        message: "A avaliação deve ser entre 1 e 5 estrelas" 
      });
    }

    // Check if ride exists and has already departed
    const rideExists = await prisma.ride.findUnique({
      where: { id: ratingData.rideId },
      include: {
        rideRequests: {
          where: {
            passengerId: ratingData.reviewerId,
            status: "APPROVED"
          }
        }
      }
    });

    if (!rideExists) {
      return res.status(400).json({ message: "Carona não encontrada" });
    }

    // Check if ride has already departed
    if (rideExists.departureTime && new Date(rideExists.departureTime) > new Date()) {
      return res.status(400).json({ 
        message: "Só é possível avaliar caronas que já foram realizadas" 
      });
    }

    // Check if reviewer participated in the ride
    const isDriver = rideExists.driverId === ratingData.reviewerId;
    const isPassenger = rideExists.rideRequests.length > 0;

    if (!isDriver && !isPassenger) {
      return res.status(400).json({ 
        message: "Só é possível avaliar caronas das quais você participou" 
      });
    }

    // Determine who is being rated
    if (isDriver) {
      // Driver rating a passenger - need to check if revieweeId is a passenger
      const passengerInRide = await prisma.rideRequest.findFirst({
        where: {
          rideId: rideData.rideId,
          passengerId: ratingData.revieweeId,
          status: "APPROVED"
        }
      });
      
      if (!passengerInRide) {
        return res.status(400).json({ 
          message: "Você só pode avaliar passageiros que participaram desta carona" 
        });
      }
    } else {
      // Passenger rating the driver
      if (ratingData.revieweeId !== rideExists.driverId) {
        return res.status(400).json({ 
          message: "Passageiros só podem avaliar o motorista da carona" 
        });
      }
    }

    // Check if reviewer and reviewee exist
    const reviewerExists = await prisma.user.findUnique({
      where: { id: ratingData.reviewerId }
    });

    if (!reviewerExists) {
      return res.status(400).json({ message: "Usuário avaliador não encontrado" });
    }

    const revieweeExists = await prisma.user.findUnique({
      where: { id: ratingData.revieweeId }
    });

    if (!revieweeExists) {
      return res.status(400).json({ message: "Usuário avaliado não encontrado" });
    }

    // Check if rating already exists for this combination
    const existingRating = await prisma.rating.findUnique({
      where: {
        rideId_reviewerId: {
          rideId: ratingData.rideId,
          reviewerId: ratingData.reviewerId
        }
      }
    });

    if (existingRating) {
      return res.status(409).json({ 
        message: "Você já avaliou esta carona" 
      });
    }

    // Set timestamps
    ratingData.createdAt = new Date();
    ratingData.updatedAt = new Date();

    const newRating = await prisma.rating.create({
      data: ratingData,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        },
        ride: {
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            departureTime: true
          }
        }
      }
    });

    res.created(newRating);
  } catch (err) {
    next(err);
  }
};

export const updateRating = async (req, res, next) => {
  /*
  #swagger.tags = ["Ratings"]
  #swagger.description = 'Update a rating (only allowed within 24 hours of creation)'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/RatingUpdate" }
  }
  #swagger.responses[200] = {
    description: 'Rating updated successfully',
    schema: { 
      id: 1,
      stars: 4,
      comment: "Bom motorista, chegou pontual.",
      rideId: 1,
      reviewerId: 2,
      revieweeId: 1,
      createdAt: "2025-06-20T12:00:00Z",
      updatedAt: "2025-06-20T13:00:00Z"
    } 
  }
  #swagger.responses[404] = { description: 'Rating not found' }
  #swagger.responses[403] = { description: 'Not allowed to edit this rating' }
  */
  try {
    const ratingId = Number(req.params.id) || 0;
    
    // Check if rating exists
    const ratingExists = await prisma.rating.findUnique({
      where: { id: ratingId }
    });

    if (!ratingExists) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }

    // Check if rating is less than 24 hours old
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    if (ratingExists.createdAt < twentyFourHoursAgo) {
      return res.status(403).json({ 
        message: "Avaliações só podem ser editadas nas primeiras 24 horas" 
      });
    }

    // Remove read-only fields
    const { id, createdAt, updatedAt, rideId, reviewerId, revieweeId, ...updateData } = req.body;

    // Validate stars range if provided
    if (updateData.stars && (updateData.stars < 1 || updateData.stars > 5)) {
      return res.status(400).json({ 
        message: "A avaliação deve ser entre 1 e 5 estrelas" 
      });
    }

    // Update the timestamp
    updateData.updatedAt = new Date();

    const updatedRating = await prisma.rating.update({
      where: { id: ratingId },
      data: updateData,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        },
        ride: {
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            departureTime: true
          }
        }
      }
    });

    const data = res.hateos_item(updatedRating);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const deleteRating = async (req, res, next) => {
  /*
  #swagger.tags = ['Ratings']
  #swagger.description = 'Delete a rating (only allowed within 24 hours of creation)'
  #swagger.responses[204] = { description: 'Rating deleted successfully' }
  #swagger.responses[404] = { description: 'Rating not found' }
  #swagger.responses[403] = { description: 'Not allowed to delete this rating' }
  */
  try {
    const ratingId = Number(req.params.id) || 0;
    
    // Check if rating exists
    const ratingExists = await prisma.rating.findUnique({
      where: { id: ratingId }
    });

    if (!ratingExists) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }

    // Check if rating is less than 24 hours old
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    if (ratingExists.createdAt < twentyFourHoursAgo) {
      return res.status(403).json({ 
        message: "Avaliações só podem ser excluídas nas primeiras 24 horas" 
      });
    }

    await prisma.rating.delete({
      where: { id: ratingId }
    });

    res.no_content();
  } catch (err) {
    next(err);
  }
};

export const getUserRatings = async (req, res, next) => {
  /*
  #swagger.tags = ["Ratings"]
  #swagger.description = 'Get ratings for a specific user (as driver and passenger)'
  #swagger.responses[200] = {
    description: 'User ratings retrieved successfully',
    schema: {
      summary: {
        averageRating: 4.8,
        totalRatings: 25,
        ratingsAsDriver: 15,
        ratingsAsPassenger: 10,
        starsDistribution: {
          "5": 20,
          "4": 3,
          "3": 1,
          "2": 1,
          "1": 0
        }
      },
      recentRatings: [
        {
          id: 1,
          stars: 5,
          comment: "Excelente motorista!",
          createdAt: "2025-06-20T12:00:00Z",
          type: "received_as_driver",
          reviewer: {
            name: "Maria Silva"
          },
          ride: {
            startLocation: "Campus A",
            endLocation: "Shopping Center"
          }
        }
      ]
    }
  }
  #swagger.responses[404] = { description: 'User not found' }
  */
  try {
    const userId = parseInt(req.query.userId) || parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ message: "ID do usuário é obrigatório" });
    }

    // Check if user exists
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

    // Get all ratings received by this user
    const ratingsReceived = await prisma.rating.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            last_name: true,
            avatarUrl: true
          }
        },
        ride: {
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            departureTime: true,
            driverId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate summary statistics
    const totalRatings = ratingsReceived.length;
    const averageRating = totalRatings > 0 
      ? ratingsReceived.reduce((sum, rating) => sum + rating.stars, 0) / totalRatings 
      : 0;

    // Count ratings as driver vs passenger
    const ratingsAsDriver = ratingsReceived.filter(rating => 
      rating.ride.driverId === userId
    ).length;
    const ratingsAsPassenger = totalRatings - ratingsAsDriver;

    // Calculate stars distribution
    const starsDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    ratingsReceived.forEach(rating => {
      starsDistribution[rating.stars.toString()]++;
    });

    // Prepare recent ratings with type information
    const recentRatings = ratingsReceived.slice(0, 10).map(rating => ({
      id: rating.id,
      stars: rating.stars,
      comment: rating.comment,
      createdAt: rating.createdAt,
      type: rating.ride.driverId === userId ? "received_as_driver" : "received_as_passenger",
      reviewer: {
        id: rating.reviewer.id,
        name: `${rating.reviewer.name} ${rating.reviewer.last_name}`,
        avatarUrl: rating.reviewer.avatarUrl
      },
      ride: {
        id: rating.ride.id,
        startLocation: rating.ride.startLocation,
        endLocation: rating.ride.endLocation,
        departureTime: rating.ride.departureTime
      }
    }));

    const userRatings = {
      userId,
      summary: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings,
        ratingsAsDriver,
        ratingsAsPassenger,
        starsDistribution
      },
      recentRatings
    };

    const data = res.hateos_item(userRatings);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const getRideRatings = async (req, res, next) => {
  /*
  #swagger.tags = ["Ratings"]
  #swagger.description = 'Get all ratings for a specific ride'
  #swagger.responses[200] = {
    description: 'Ride ratings retrieved successfully',
    schema: {
      rideId: 1,
      ride: {
        startLocation: "Campus A",
        endLocation: "Shopping Center",
        departureTime: "2025-06-20T14:30:00Z",
        driver: {
          name: "João Santos"
        }
      },
      summary: {
        averageRating: 4.7,
        totalRatings: 3
      },
      ratings: [
        {
          id: 1,
          stars: 5,
          comment: "Excelente motorista!",
          createdAt: "2025-06-20T16:00:00Z",
          reviewer: {
            name: "Maria Silva"
          },
          reviewee: {
            name: "João Santos"
          }
        }
      ]
    }
  }
  #swagger.responses[404] = { description: 'Ride not found' }
  */
  try {
    const rideId = Number(req.params.rideId) || 0;

    // Check if ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
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
        }
      }
    });

    if (!ride) {
      return res.status(404).json({ message: "Carona não encontrada" });
    }

    // Get all ratings for this ride
    const ratings = await prisma.rating.findMany({
      where: { rideId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            last_name: true,
            avatarUrl: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            last_name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate summary
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, rating) => sum + rating.stars, 0) / totalRatings 
      : 0;

    const rideRatings = {
      rideId,
      ride: {
        id: ride.id,
        startLocation: ride.startLocation,
        endLocation: ride.endLocation,
        departureTime: ride.departureTime,
        distance: ride.distance,
        driver: {
          id: ride.driver.id,
          name: `${ride.driver.user.name} ${ride.driver.user.last_name}`
        }
      },
      summary: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings
      },
      ratings: ratings.map(rating => ({
        id: rating.id,
        stars: rating.stars,
        comment: rating.comment,
        createdAt: rating.createdAt,
        reviewer: {
          id: rating.reviewer.id,
          name: `${rating.reviewer.name} ${rating.reviewer.last_name}`,
          avatarUrl: rating.reviewer.avatarUrl
        },
        reviewee: {
          id: rating.reviewee.id,
          name: `${rating.reviewee.name} ${rating.reviewee.last_name}`,
          avatarUrl: rating.reviewee.avatarUrl
        }
      }))
    };

    const data = res.hateos_item(rideRatings);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};
