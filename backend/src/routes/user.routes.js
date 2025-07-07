import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser,
    getCurrentUser,
    joinClub,
    leaveClub,
    getMyClubs,
    getAllUsers
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes (no authentication required)
router.route("/register").post(registerUser);  //! Done
router.route("/login").post(loginUser);  //! Done

// Protected routes (authentication required)
router.route("/logout").post(verifyJWT, logoutUser);  //! Done
router.route("/current-user").get(verifyJWT, getCurrentUser);  //! Done

// Faculty routes
router.route("/all").get(verifyJWT, getAllUsers);  // Faculty: Get all users

// Student routes for club management
router.route("/clubs/join/:clubId").post(verifyJWT, joinClub);  // Student: Join club
router.route("/clubs/leave/:clubId").post(verifyJWT, leaveClub);  // Student: Leave club
router.route("/my-clubs").get(verifyJWT, getMyClubs);  // Student: View own clubs

export default router;
