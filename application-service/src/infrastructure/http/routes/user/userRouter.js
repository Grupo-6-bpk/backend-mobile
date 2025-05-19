import { Router } from "express";

import validator from "../../middlewares/validator.js";
import userValidator from "./userValidator.js";

import {
  listUsers,
  showUser,
  createUser,
  editUser,
  deleteUser,
} from "../../../../presentation/controllers/UserController.js";

const router = Router();
router.get("/", listUsers);
router.get("/:id", showUser);
router.post("/", validator(userValidator), createUser);
router.put("/:id", validator(userValidator), editUser);
router.delete("/:id", deleteUser);

export default router;