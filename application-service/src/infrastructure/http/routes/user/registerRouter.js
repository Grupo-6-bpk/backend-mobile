import { Router } from "express";

import validator from "../../middlewares/validator.js";
import userValidator from "./userValidator.js";

import {
  createUser,
} from "../../../../presentation/controllers/UserController.js";

const router = Router();
router.post("/", validator(userValidator), createUser);

export default router;