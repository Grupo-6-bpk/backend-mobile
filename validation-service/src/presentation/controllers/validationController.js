import prisma from "../../infrastructure/config/prismaClient.js"

export const getNeededDriverValidations = async (req, res, next) => {
    /*
    #swagger.tags: ['Validations']
    #swagger.summary: 'Get needed validations for a user'
    #swagger.description: 'Retrieve the list of validations that a user needs to complete.'
    #swagger.responses[200] = {
        description: 'List of needed validations',
        content: {
        }
    */
    try {
        const page = parseInt(req.query._page) || 1;
        const size = parseInt(req.query._limit) || 10;

        const offset = (page - 1) * size;

        const validations = await prisma.driverValidation.findMany({
            where: {
                is_validated: false,
            },
            skip: offset,
            take: size,
        });

        const totalData = await prisma.driverValidation.count();
        const totalPages = Math.ceil(totalData / size);

        res.status(200).json({
            data: validations,
            meta: {
                totalData,
                totalPages,
                currentPage: page,
                pageSize: size
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getNeededPassengerValidations = async (req, res, next) => {
    /*
    #swagger.tags: ['Validations']
    #swagger.summary: 'Get needed validations for a user'
    #swagger.description: 'Retrieve the list of validations that a user needs to complete.'
    #swagger.responses[200] = {
        description: 'List of needed validations',
        content: {
        }
    */
    try {
        const page = parseInt(req.query._page) || 1;
        const size = parseInt(req.query._limit) || 10;

        const offset = (page - 1) * size;

        const validations = await prisma.passengerValidation.findMany({
            where: {
                is_validated: false,
            },
            skip: offset,
            take: size,
        });

        const totalData = await prisma.passengerValidation.count();
        const totalPages = Math.ceil(totalData / size);

        res.status(200).json({
            data: validations,
            meta: {
                totalData,
                totalPages,
                currentPage: page,
                pageSize: size
            }
        });
    } catch (error) {
        next(error);
    }
}