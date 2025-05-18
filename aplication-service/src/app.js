import express from "express";
import compression from "compression";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./infrastructure/config/swagger.json" with { type: "json" };

import responseHandler from "./infrastructure/http/middlewares/responseHandler.js";
import routes from "./infrastructure/http/routes/routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(responseHandler);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(routes);

export default app;
