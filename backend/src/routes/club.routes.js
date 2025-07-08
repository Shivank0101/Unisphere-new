import { Router } from "express";
import {
    getAllClubs,        // 1. View all clubs
    getUserClubs,       // 2. View own clubs  
    getClubById,        // 3. View single club details
    joinClub,           // 4. Join club
    leaveClub,          // 5. Leave club
    createClub,         // 6. Create clubs (Faculty only)
    updateClub,         // 7. Update own clubs (as coordinator - Faculty only)
    removeMemberFromClub, // 8. Remove members from own clubs (Faculty coordinator only)
    deleteClub          // Delete club (Faculty coordinator only)
} from "../controllers/club.controller.js";
import { verifyJWT, verifyFaculty } from "../middlewares/auth.middleware.js";

const router = Router();

// 1. View all clubs - Public route
router.route("/").get(getAllClubs);

// 3. View single club details - Public route  
router.route("/:clubId").get(getClubById);

// Protected routes - require authentication
// 2. View own clubs
router.route("/my-clubs").get(verifyJWT, getUserClubs);

// 5. Join club
router.route("/:clubId/join").post(verifyJWT, joinClub);

// 6. Leave club
router.route("/:clubId/leave").post(verifyJWT, leaveClub);

// Faculty-only routes
// 7. Create clubs (Faculty only)
router.route("/").post(verifyJWT, verifyFaculty, createClub);

// 8. Update own clubs (as coordinator - Faculty only)
router.route("/:clubId").put(verifyJWT, verifyFaculty, updateClub);

// 9. Remove members from own clubs (Faculty coordinator only)
router.route("/:clubId/remove-member/:userId").delete(verifyJWT, verifyFaculty, removeMemberFromClub);

// Delete club (Faculty coordinator only)
router.route("/:clubId").delete(verifyJWT, verifyFaculty, deleteClub);

export default router;
