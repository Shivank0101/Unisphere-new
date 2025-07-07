import { Attendance } from "../models/attendance.model.js";
import { Event } from "../models/event.model.js";
import { User } from "../models/user.model.js";
import { Registration } from "../models/registration.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import QRCode from "qrcode";
import crypto from "crypto";
import mongoose from "mongoose";

// Student Functions

// Note: Manual attendance removed - QR code attendance only

// 2. View own attendance - Returns percentage summary
const getOwnAttendance = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get total events the user is registered for
    const totalRegisteredEvents = await Registration.countDocuments({ user: userId });

    // Get total attendance records for the user
    const totalAttendanceMarked = await Attendance.countDocuments({ user: userId });

    // Get attendance breakdown by status
    const attendanceBreakdown = await Attendance.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    // Calculate percentages
    const presentCount = attendanceBreakdown.find(item => item._id === "present")?.count || 0;
    const absentCount = attendanceBreakdown.find(item => item._id === "absent")?.count || 0;
    const lateCount = attendanceBreakdown.find(item => item._id === "late")?.count || 0;

    const attendancePercentage = totalRegisteredEvents > 0 
        ? ((totalAttendanceMarked / totalRegisteredEvents) * 100).toFixed(2)
        : 0;

    const presentPercentage = totalAttendanceMarked > 0 
        ? ((presentCount / totalAttendanceMarked) * 100).toFixed(2)
        : 0;

    const result = {
        totalRegisteredEvents,
        totalAttendanceMarked,
        attendancePercentage: parseFloat(attendancePercentage),
        presentPercentage: parseFloat(presentPercentage),
        breakdown: {
            present: presentCount,
            absent: absentCount,
            late: lateCount
        }
    };

    return res.status(200).json(
        new ApiResponse(200, result, "Attendance percentage retrieved successfully")
    );
});
// Faculty Functions
// 1. Mark attendance for others
const markAttendanceForOthers = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { attendanceData } = req.body; // Array of { userId, status, notes }
    const facultyId = req.user._id;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can mark attendance for others");
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    const results = [];
    const errors = [];

    for (const data of attendanceData) {
        try {
            const { userId, status = "present", notes } = data;

            // Check if user is registered for the event
            const registration = await Registration.findOne({ user: userId, event: eventId });
            if (!registration) {
                errors.push(`User ${userId} is not registered for this event`);
                continue;
            }

            // Check if attendance already exists
            let attendance = await Attendance.findOne({ user: userId, event: eventId });

            if (attendance) {
                // Update existing attendance
                attendance.status = status;
                attendance.notes = notes;
                attendance.markedBy = facultyId;
                await attendance.save();
            } else {
                // Create new attendance record
                attendance = await Attendance.create({
                    user: userId,
                    event: eventId,
                    markedBy: facultyId,
                    status,
                    notes
                });
            }

            // Update registration status to "attended" if attendance is marked as present
            if (status === "present") {
                await Registration.findOneAndUpdate(
                    { user: userId, event: eventId },
                    { status: "attended" }
                );
            }

            await attendance.populate([
                { path: "user", select: "name email" },
                { path: "event", select: "title" }
            ]);

            results.push(attendance);
        } catch (error) {
            errors.push(`Error marking attendance for user ${data.userId}: ${error.message}`);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, { results, errors }, "Attendance marking completed")
    );
});

// 2. View others' attendance
const getOthersAttendance = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10, eventId } = req.query;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can view others' attendance");
    }

    const filter = { user: userId };
    if (eventId) {
        filter.event = eventId;
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            { path: "user", select: "name email department" },
            { path: "event", select: "title startDate endDate location" },
            { path: "markedBy", select: "name" }
        ],
        sort: { createdAt: -1 }
    };

    const attendance = await Attendance.paginate(filter, options);

    return res.status(200).json(
        new ApiResponse(200, attendance, "User attendance records retrieved successfully")
    );
});

// 3. View event attendance
const getEventAttendance = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can view event attendance");
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    const filter = { event: eventId };
    if (status) {
        filter.status = status;
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            { path: "user", select: "name email department" },
            { path: "markedBy", select: "name" }
        ],
        sort: { createdAt: -1 }
    };

    const attendance = await Attendance.paginate(filter, options);

    // Get attendance statistics
    const stats = await Attendance.aggregate([
        { $match: { event: new mongoose.Types.ObjectId(eventId) } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    // Get total registered users for this event
    const totalRegistered = await Registration.countDocuments({ event: eventId });

    const result = {
        attendance,
        statistics: {
            totalRegistered,
            attendanceStats: stats,
            attendanceRate: attendance.totalDocs > 0 ? (attendance.totalDocs / totalRegistered * 100).toFixed(2) : 0
        }
    };

    return res.status(200).json(
        new ApiResponse(200, result, "Event attendance retrieved successfully")
    );
});

// 4. View all attendance reports
const getAllAttendanceReports = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, eventId, userId, status, startDate, endDate } = req.query;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can view all attendance reports");
    }

    const filter = {};
    if (eventId) filter.event = eventId;
    if (userId) filter.user = userId;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            { path: "user", select: "name email department" },
            { path: "event", select: "title startDate endDate location club", 
              populate: { path: "club", select: "name" } },
            { path: "markedBy", select: "name role" }
        ],
        sort: { createdAt: -1 }
    };

    const attendance = await Attendance.paginate(filter, options);

    return res.status(200).json(
        new ApiResponse(200, attendance, "All attendance reports retrieved successfully")
    );
});

// QR Code Attendance Functions

// Generate QR code for event attendance
const generateEventQRCode = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can generate QR codes");
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Generate a secure token for this QR code session
    const qrToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Create QR data
    const qrData = {
        eventId,
        token: qrToken,
        expiresAt: expiresAt.toISOString(),
        type: 'attendance'
    };

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    // Store QR session in memory or database (for production, use Redis)
    // For now, we'll store it temporarily in the event model
    await Event.findByIdAndUpdate(eventId, {
        $set: {
            'qrSession': {
                token: qrToken,
                expiresAt,
                createdBy: req.user._id
            }
        }
    });

    return res.status(200).json(
        new ApiResponse(200, { qrCodeUrl, expiresAt }, "QR code generated successfully")
    );
});

// Mark attendance using QR code
const markAttendanceByQR = asyncHandler(async (req, res) => {
    const { qrData } = req.body;
    const userId = req.user._id;

    let parsedQRData;
    try {
        parsedQRData = JSON.parse(qrData);
    } catch (error) {
        throw new ApiError(400, "Invalid QR code data");
    }

    const { eventId, token, expiresAt, type } = parsedQRData;

    if (type !== 'attendance') {
        throw new ApiError(400, "Invalid QR code type");
    }

    // Check if QR code has expired
    if (new Date() > new Date(expiresAt)) {
        throw new ApiError(400, "QR code has expired");
    }

    // Check if event exists and validate token
    const event = await Event.findById(eventId);
    if (!event || !event.qrSession || event.qrSession.token !== token) {
        throw new ApiError(400, "Invalid or expired QR code");
    }

    // Check if user is registered for the event
    const registration = await Registration.findOne({ user: userId, event: eventId });
    if (!registration) {
        throw new ApiError(400, "You are not registered for this event");
    }

    // Check if attendance is already marked
    const existingAttendance = await Attendance.findOne({ user: userId, event: eventId });
    if (existingAttendance) {
        throw new ApiError(400, "Attendance already marked for this event");
    }

    // Create attendance record
    const attendance = await Attendance.create({
        user: userId,
        event: eventId,
        markedBy: userId,
        status: "present",
        notes: "Marked via QR code"
    });

    // Update registration status to "attended"
    await Registration.findOneAndUpdate(
        { user: userId, event: eventId },
        { status: "attended" }
    );

    await attendance.populate([
        { path: "user", select: "name email" },
        { path: "event", select: "title" }
    ]);

    return res.status(201).json(
        new ApiResponse(201, attendance, "Attendance marked successfully via QR code")
    );
});

// Get attendance summary for a user
const getAttendanceSummary = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const targetUserId = userId || req.user._id;

    // If getting summary for another user, check if requester is faculty
    if (userId && userId !== req.user._id.toString() && req.user.role !== "faculty") {
        throw new ApiError(403, "You can only view your own attendance summary");
    }

    const summary = await Attendance.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(targetUserId) } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    const totalEvents = await Registration.countDocuments({ user: targetUserId });
    const totalAttendance = summary.reduce((acc, curr) => acc + curr.count, 0);

    const result = {
        totalEventsRegistered: totalEvents,
        totalAttendanceMarked: totalAttendance,
        attendanceByStatus: summary,
        attendanceRate: totalEvents > 0 ? (totalAttendance / totalEvents * 100).toFixed(2) : 0
    };

    return res.status(200).json(
        new ApiResponse(200, result, "Attendance summary retrieved successfully")
    );
});

export {
    // Student functions
    getOwnAttendance,
    
    // Faculty functions
    markAttendanceForOthers,
    getOthersAttendance,
    getEventAttendance,
    getAllAttendanceReports,
    
    // QR Code functions
    generateEventQRCode,
    markAttendanceByQR,
    
    // Summary function
    getAttendanceSummary
};