import { Router } from 'express';

import hateoas from '../middlewares/hateoas.js';
import handler from '../middlewares/responseHandler.js';
import order from "../middlewares/order.js";

import InternalServerError from "./helper/500.js"
import NotFound from "./helper/404.js";

import { verify } from "../../../presentation/controllers/authController.js";

import Group from './group/groupRouter.js';
import userRouter from './user/userRouter.js';
import registerRouter from './user/registerRouter.js';
import AuthRouter from './auth/authRouter.js';
import vehicleRouter from './vehicle/vehicleRouter.js';
import grouprouter from './group/groupRouter.js';

const routes = Router();
routes.use(hateoas);
routes.use(handler);
routes.use(order);

routes.use('/login', AuthRouter);
routes.use('/api/groups', grouprouter);
routes.use('/register', registerRouter);

routes.use('/api/users', verify, userRouter);
routes.use('/api/vehicles', verify, vehicleRouter);

routes.use(InternalServerError);
routes.use(NotFound);

export default routes;
