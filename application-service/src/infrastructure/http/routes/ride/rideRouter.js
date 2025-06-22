import { Router } from "express";

import validator from "../../middlewares/validator.js";
import rideValidator from "./rideValidator.js";
import ridePatchValidator from "./ridePatchValidator.js";
import rideStatusValidator from "./rideStatusValidator.js";

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
  getGroupRides,
  updateRideStatus,
  startRide,
  completeRide,
  cancelRide,
} from "../../../../presentation/controllers/RideController.js";

const router = Router();
router.get("/", listRides);
router.get("/available", listAvailableRides);
router.get("/dashboard", getDashboardData);
router.get("/history", getUserRideHistory);
router.get("/stats", getCostSharingStats);
router.get("/group/:groupId", getGroupRides);
router.get("/:id", getRide);
router.post("/", validator(rideValidator), createRide);
router.put("/:id", validator(ridePatchValidator), updateRide);
router.patch("/:id/status", validator(rideStatusValidator), updateRideStatus);
router.patch("/:id/start", startRide);
router.patch("/:id/complete", completeRide);
router.patch("/:id/cancel", cancelRide);
router.delete("/:id", deleteRide);

export default router;
