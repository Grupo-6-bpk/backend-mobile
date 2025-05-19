import { Router } from "express";
import { login } from "../../../../presentation/controllers/UserController.js";
import { generate } from "../../../../presentation/controllers/authController.js";

import validator from "../../middlewares/validator.js";
import authValidator from "./authValidator.js";

const router = Router();

router.post("/", validator(authValidator), login, generate);

export default router;
