import { Router } from "express";

import {
    getNeededDriverValidations,
    getNeededPassengerValidations
} from "../../../../presentation/controllers/validationController.js";

const router = Router();
router.get("/driver", getNeededDriverValidations);
router.get("/passenger", getNeededPassengerValidations);


export default router;