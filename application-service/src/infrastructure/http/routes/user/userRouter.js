import { Router } from "express";

import validator from "../../middlewares/validator.js";
import userValidator from "./userValidator.js";
import userRolesValidator from "./userRolesValidator.js";

import {
  listUsers,
  showUser,
  createUser,
  editUser,
  deleteUser,
  updateUserRoles,
  getUserWithRoles,
} from "../../../../presentation/controllers/UserController.js";

const router = Router();
router.get("/", listUsers);
router.get("/:id", showUser);
router.get("/:id/roles", getUserWithRoles);
router.post("/", validator(userValidator), createUser);
router.put("/:id", validator(userValidator), editUser);
router.put("/:id/roles", validator(userRolesValidator), updateUserRoles);
router.delete("/:id", deleteUser);

export default router;