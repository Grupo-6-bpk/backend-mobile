import { Router } from "express";

import validator from "../../middlewares/validator.js";
import ratingValidator from "./ratingValidator.js";
import ratingPatchValidator from "./ratingPatchValidator.js";

import {
  listRatings,
  getRating,
  createRating,
  updateRating,
  deleteRating,
  getUserRatings,
  getRideRatings,
} from "../../../../presentation/controllers/RatingController.js";

const router = Router();

// Main rating routes
router.get("/", listRatings);
router.get("/:id", getRating);
router.post("/", validator(ratingValidator), createRating);
router.put("/:id", validator(ratingPatchValidator), updateRating);
router.delete("/:id", deleteRating);

// Special routes for getting ratings
router.get("/user/:userId", getUserRatings);
router.get("/ride/:rideId", getRideRatings);

export default router;
