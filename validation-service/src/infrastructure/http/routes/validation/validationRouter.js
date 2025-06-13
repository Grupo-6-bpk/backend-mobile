import { Router } from "express";

import {
    getNeededDriverValidations,
    getNeededPassengerValidations,
    acceptDriverValidation,
    acceptPassengerValidation,
    rejectDriverValidation,
    rejectPassengerValidation
} from "../../../../presentation/controllers/validationController.js";

const router = Router();
router.get("/driver", getNeededDriverValidations);
router.get("/passenger", getNeededPassengerValidations);
router.put("/driver/:id/accept", acceptDriverValidation);
router.put("/passenger/:id/accept", acceptPassengerValidation);
router.put("/driver/:id/reject", rejectDriverValidation);
router.put("/passenger/:id/reject", rejectPassengerValidation);


export default router;