import { Router } from "express";
import validationRouter from './validation/validationRouter.js';


const routes = Router();
routes.use('/api/validations', validationRouter);


export default routes;