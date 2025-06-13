import prisma from "../../infrastructure/config/prismaClient.js"
import { RabbitMQService } from "../../infrastructure/messaging/RabbitMQService.js";

const rabbitMQ = new RabbitMQService("user.validation.events");

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

export const acceptDriverValidation = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (prismaTransaction) => {
            const userId = await prismaTransaction.driverValidation.findUnique({
                where: { id: parseInt(id) },
                select: { user_id: true }
            });

            if (!userId) {
                throw new Error('Validation not found');
            }

            await prismaTransaction.driverValidation.update({
                where: { id: parseInt(id) },
                data: { is_validated: true }
            });

            await rabbitMQ.publishMessage({
                userId: userId.user_id,
                message: 'Driver validation accepted',
                status: 'accepted',
            }, 'user.validation.events.driver.validation.accepted');
        });

        res.status(200).json({ message: 'Driver validation accepted successfully' });
    } catch (error) {
        next(error);
    }
}

export const acceptPassengerValidation = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (prismaTransaction) => {
            const userId = await prismaTransaction.passengerValidation.findUnique({
                where: { id: parseInt(id) },
                select: { user_id: true }
            });

            if (!userId) {
                throw new Error('Validation not found');
            }

            await prismaTransaction.passengerValidation.update({
                where: { id: parseInt(id) },
                data: { is_validated: true }
            });

            await rabbitMQ.publishMessage({
                userId: userId.user_id,
                message: 'Passenger validation accepted',
                status: 'accepted',
            }, 'user.validation.events.passenger.validation.accepted');
        });

        res.status(200).json({ message: 'Passenger validation accepted successfully' });
    } catch (error) {
        next(error);
    }
}

export const rejectDriverValidation = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (prismaTransaction) => {
            const userId = await prismaTransaction.driverValidation.findUnique({
                where: { id: parseInt(id) },
                select: { user_id: true }
            });

            if (!userId) {
                throw new Error('Validation not found');
            }

            await prismaTransaction.driverValidation.update({
                where: { id: parseInt(id) },
                data: { is_validated: false }
            });

            await rabbitMQ.publishMessage({
                userId: userId.user_id,
                message: 'Driver validation rejected',
                status: 'rejected',
            }, 'user.validation.events.driver.validation.rejected');
        });

        res.status(200).json({ message: 'Driver validation rejected successfully' });
    } catch (error) {
        next(error);
    }
}

export const rejectPassengerValidation = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (prismaTransaction) => {
            const userId = await prismaTransaction.passengerValidation.findUnique({
                where: { id: parseInt(id) },
                select: { user_id: true }
            });

            if (!userId) {
                throw new Error('Validation not found');
            }

            await prismaTransaction.passengerValidation.update({
                where: { id: parseInt(id) },
                data: { is_validated: false }
            });

            await rabbitMQ.publishMessage({
                userId: userId.user_id,
                message: 'Passenger validation rejected',
                status: 'rejected',
            }, 'user.validation.events.passenger.validation.rejected');
        });

        res.status(200).json({ message: 'Passenger validation rejected successfully' });
    } catch (error) {
        next(error);
    }
};