import { Router } from "express";

import validator from "../../middlewares/validator.js";
import rideRequestValidator from "./rideRequestValidator.js";
import rideRequestStatusValidator from "./rideRequestStatusValidator.js";

import {
  listRideRequests,
  getRideRequest,
  createRideRequest,
  updateRideRequest,
  updateRideRequestStatus,
  deleteRideRequest,
} from "../../../../presentation/controllers/RideRequestController.js";

const router = Router();
router.get("/", listRideRequests);
router.get("/:id", getRideRequest);
router.post("/", validator(rideRequestValidator), createRideRequest);
router.patch("/:id/status", validator(rideRequestStatusValidator), updateRideRequestStatus);
router.put("/:id", validator(rideRequestValidator), updateRideRequest);
router.delete("/:id", deleteRideRequest);

export default router;
