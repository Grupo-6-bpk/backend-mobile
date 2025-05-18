import { Router } from 'express';

// Import all route files
import userRoutes from './userRoutes.js';

// Import middlewares
import hateoas from '../../presentation/middlewares/hateoas.js';

// Create main router
const routes = Router();

// Apply HATEOAS middleware to all routes
routes.use(hateoas);

// Register all routes 
routes.use('/users', userRoutes);

// Health check endpoint
routes.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "aplication-service" });
});

export default routes;
