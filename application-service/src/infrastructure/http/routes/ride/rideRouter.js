import { Router } from "express";

import validator from "../../middlewares/validator.js";
import rideValidator from "./rideValidator.js";
import ridePatchValidator from "./ridePatchValidator.js";

import {
  listRides,
  listAvailableRides,
  getRide,
  createRide,
  updateRide,
  deleteRide,
  getDashboardData,
  getUserRideHistory,
  getCostSharingStats,
} from "../../../../presentation/controllers/RideController.js";

const router = Router();
router.get("/", listRides);
router.get("/available", listAvailableRides);
router.get("/dashboard", getDashboardData);
router.get("/history", getUserRideHistory);
router.get("/stats", getCostSharingStats);
router.get("/:id", getRide);
router.post("/", validator(rideValidator), createRide);
router.put("/:id", validator(ridePatchValidator), updateRide);
router.delete("/:id", deleteRide);

export default router;
