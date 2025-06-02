import { Router } from "express";

import validator from "../../middlewares/validator.js";
import userPatchValidator from "./userPatchValidator.js";
import userRolesValidator from "./userRolesValidator.js";

import {
  listUsers,
  getUser,
  editUser,
  deleteUser,
  updateUserRoles,
  searchUsers,
} from "../../../../presentation/controllers/UserController.js";

const router = Router();
router.get("/", listUsers);
router.get('/search', searchUsers);
router.get("/:id", getUser);
router.put("/:id", validator(userPatchValidator), editUser);
router.patch("/:id/roles", validator(userRolesValidator), updateUserRoles);
router.delete("/:id", deleteUser);

export default router;