import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import routes from "./infrastructure/http/routes/routes.js";
// import swaggerFile from "./infrastructure/config/swagger.json" with { type: "json" };

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(routes);

// Swagger UI
// app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "document-validation-service" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "An unexpected error occurred",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
