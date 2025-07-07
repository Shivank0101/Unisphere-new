import { Router } from "express";
import {
    registerForEvent,
    unregisterFromEvent,
    getMyRegistrations,
    getEventRegistrations,
    checkRegistrationStatus
} from "../controllers/registrations.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Student routes
router.route("/register").post(registerForEvent);           // Register for event
router.route("/unregister").post(unregisterFromEvent);      // Unregister from event
router.route("/my-registrations").get(getMyRegistrations);  // View own registrations
router.route("/status/:eventId").get(checkRegistrationStatus); // Check if registered for specific event

// Faculty routes
router.route("/event/:eventId").get(getEventRegistrations); // View all registrations for an event (faculty only)

export default router;