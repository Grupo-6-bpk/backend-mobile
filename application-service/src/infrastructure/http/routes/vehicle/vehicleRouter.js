import { Router } from "express";

import validator from "../../middlewares/validator.js";
import vehicleValidator from "./vehicleValidator.js";
import vehiclePatchValidator from "./vehiclePatchValidator.js";

import {
  createVehicle,
  listVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  verifyVehicle
} from "../../../../presentation/controllers/VehicleController.js";

const router = Router();
router.post("/", validator(vehicleValidator), createVehicle);
router.get("/", listVehicles);
router.get("/:id", getVehicle);
router.patch("/:id", validator(vehiclePatchValidator), updateVehicle);
router.delete("/:id", deleteVehicle);
router.post("/:id/verify", verifyVehicle);

export default router;
