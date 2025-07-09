import { Router } from "express";
import {
    getOwnAttendance,
    markAttendanceForOthers,
    editStudentAttendance,
    getClubEventAttendance,
    getOthersAttendance,
    getEventAttendance,
    getAllAttendanceReports,
    cleanupOrphanedAttendance,
    generateEventQRCode,
    markAttendanceByQR,
    getAttendanceSummary,
    debugAttendanceData
} from "../controllers/attendance.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Student routes
router.route("/my-attendance").get(getOwnAttendance); // View own attendance

// Faculty routes
router.route("/mark-others/:eventId").post(markAttendanceForOthers); // Mark attendance for others
router.route("/mark-for-others").post(markAttendanceForOthers); // Alternative endpoint for single record
router.route("/edit/:eventId/:userId").put(editStudentAttendance); // Edit single student attendance (Club coordinator only)
router.route("/club-event/:eventId").get(getClubEventAttendance); // View event attendance (Club coordinator only)
router.route("/user/:userId").get(getOthersAttendance); // View others' attendance
router.route("/event/:eventId").get(getEventAttendance); // View event attendance
router.route("/reports").get(getAllAttendanceReports); // View all attendance reports

// QR Code routes
router.route("/qr/generate/:eventId").post(generateEventQRCode); // Generate QR code (faculty only)
router.route("/qr/mark").post(markAttendanceByQR); // Mark attendance using QR code

// Summary routes
router.route("/summary/:userId?").get(getAttendanceSummary); // Get attendance summary

// Debug routes (temporary)
router.route("/debug").get(debugAttendanceData); // Debug attendance data

// Cleanup routes
router.route("/cleanup").post(cleanupOrphanedAttendance); // Cleanup orphaned attendance records (faculty only)

export default router;