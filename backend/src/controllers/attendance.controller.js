import { Attendance } from "../models/attendance.model.js";
import { Event } from "../models/event.model.js";
import { User } from "../models/user.model.js";
import { Registration } from "../models/registration.model.js";
import { Club } from "../models/club.model.js";
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

    // Calculate attended events (present + late)
    const attendedEvents = presentCount + lateCount;

    // Calculate attendance percentage based on registered events
    const attendancePercentage = totalRegisteredEvents > 0 
        ? ((attendedEvents / totalRegisteredEvents) * 100).toFixed(2)
        : 0;

    // Calculate present percentage based on attendance records
    const presentPercentage = totalAttendanceMarked > 0 
        ? ((presentCount / totalAttendanceMarked) * 100).toFixed(2)
        : 0;

    const result = {
        totalRegisteredEvents,
        totalAttendanceMarked,
        attendedEvents, // Add this field to show actual attended events
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
    const { attendanceData, userId, status, notes } = req.body; // Support both array and single record
    const facultyId = req.user._id;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can mark attendance for others");
    }

    // Check if event exists and get club information
    const eventWithClub = await Event.findById(eventId).populate('club');
    if (!eventWithClub) {
        throw new ApiError(404, "Event not found");
    }

    // Check if the faculty user is the coordinator of the club that owns this event
    if (eventWithClub.club.facultyCoordinator.toString() !== facultyId.toString()) {
        throw new ApiError(403, "Only the faculty coordinator of this club can mark attendance for this event");
    }

    // Handle single attendance record
    if (userId && !attendanceData) {
        try {
            // Check if user is registered for the event
            const registration = await Registration.findOne({ user: userId, event: eventId });
            if (!registration) {
                throw new ApiError(400, "User is not registered for this event");
            }

            // Check if attendance already exists
            let attendance = await Attendance.findOne({ user: userId, event: eventId });

            if (attendance) {
                // Update existing attendance
                attendance.status = status || "present";
                attendance.notes = notes;
                attendance.markedBy = facultyId;
                attendance.updatedAt = new Date();
                await attendance.save();
            } else {
                // Create new attendance record
                attendance = await Attendance.create({
                    user: userId,
                    event: eventId,
                    markedBy: facultyId,
                    status: status || "present",
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
                { path: "user", select: "name email department" },
                { path: "event", select: "title" },
                { path: "markedBy", select: "name" }
            ]);

            return res.status(200).json(
                new ApiResponse(200, attendance, "Attendance marked successfully")
            );
        } catch (error) {
            throw new ApiError(400, error.message);
        }
    }

    // Handle multiple attendance records (original logic)
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
                attendance.updatedAt = new Date();
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

// 2. Edit single student attendance (New function - Only for club coordinators)
const editStudentAttendance = asyncHandler(async (req, res) => {
    const { eventId, userId } = req.params;
    const { status, notes } = req.body;
    const facultyId = req.user._id;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can edit attendance");
    }

    // Validate status
    const validStatuses = ["present", "absent", "late"];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid attendance status. Must be: present, absent, or late");
    }

    // Check if event exists and get club information
    const eventDetails = await Event.findById(eventId).populate('club');
    if (!eventDetails) {
        throw new ApiError(404, "Event not found");
    }

    // Check if the faculty user is the coordinator of the club that owns this event
    if (eventDetails.club.facultyCoordinator.toString() !== facultyId.toString()) {
        throw new ApiError(403, "Only the faculty coordinator of this club can edit attendance for this event");
    }

    // Check if user is registered for the event
    const registration = await Registration.findOne({ user: userId, event: eventId });
    if (!registration) {
        throw new ApiError(400, "User is not registered for this event");
    }

    // Check if student exists
    const student = await User.findById(userId);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    // Find or create attendance record
    let attendance = await Attendance.findOne({ user: userId, event: eventId });

    if (attendance) {
        // Update existing attendance
        attendance.status = status;
        attendance.notes = notes || attendance.notes;
        attendance.markedBy = facultyId;
        attendance.updatedAt = new Date();
        await attendance.save();
    } else {
        // Create new attendance record
        attendance = await Attendance.create({
            user: userId,
            event: eventId,
            markedBy: facultyId,
            status,
            notes: notes || `Marked as ${status} by faculty coordinator`
        });
    }

    // Update registration status based on attendance
    let registrationStatus = "registered";
    if (status === "present") {
        registrationStatus = "attended";
    }

    await Registration.findOneAndUpdate(
        { user: userId, event: eventId },
        { status: registrationStatus }
    );

    await attendance.populate([
        { path: "user", select: "name email department" },
        { path: "event", select: "title startDate endDate" },
        { path: "markedBy", select: "name" }
    ]);

    return res.status(200).json(
        new ApiResponse(200, attendance, `Student attendance updated to ${status} successfully`)
    );
});

// 3. View others' attendance
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

// 4. View event attendance
const getEventAttendance = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can view event attendance");
    }

    // Check if event exists and get club information
    const event = await Event.findById(eventId).populate('club');
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Check if the faculty user is the coordinator of the club that owns this event
    if (event.club.facultyCoordinator.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the faculty coordinator of this club can view attendance for this event");
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

// 5. View all attendance reports
const getAllAttendanceReports = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, eventId, userId, status, startDate, endDate } = req.query;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can view all attendance reports");
    }

    let filter = {};
    if (eventId) filter.event = eventId;
    if (userId) filter.user = userId;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Faculty can view ALL attendance records, but editing is restricted to their clubs
    // No filter restriction here - they can see all records

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            { path: "user", select: "name email department" },
            { path: "event", select: "title startDate endDate location club", 
              populate: { path: "club", select: "name facultyCoordinator" } },
            { path: "markedBy", select: "name role" }
        ],
        sort: { createdAt: -1 }
    };

    const attendance = await Attendance.paginate(filter, options);

    // Add a flag to each record indicating if the faculty can edit it
    // Also filter out records with missing users or events (orphaned records)
    const attendanceWithEditPermission = attendance.docs
        .filter(record => record.user && record.event && record.event.club) // Filter out orphaned records
        .map(record => {
            const recordObj = record.toObject();
            recordObj.canEdit = record.event?.club?.facultyCoordinator?.toString() === req.user._id.toString();
            return recordObj;
        });

    const result = {
        ...attendance,
        docs: attendanceWithEditPermission,
        totalDocs: attendanceWithEditPermission.length,
        totalPages: Math.ceil(attendanceWithEditPermission.length / parseInt(limit))
    };

    return res.status(200).json(
        new ApiResponse(200, result, "All attendance reports retrieved successfully")
    );
});

// QR Code Attendance Functions

// Generate QR code for event attendance
const generateEventQRCode = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    console.log("🔄 Generating QR code for event:", eventId);
    console.log("👤 User role:", req.user.role);

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can generate QR codes");
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    console.log("✅ Event found:", event.title);

    try {
        // Generate a secure token for this QR code session
        const qrToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

        console.log("🔑 Generated token:", qrToken.substring(0, 10) + "...");

        // Create QR data
        const qrData = {
            eventId,
            token: qrToken,
            expiresAt: expiresAt.toISOString(),
            type: 'attendance'
        };

        console.log("📄 QR Data:", qrData);

        // Generate QR code
        console.log("🎨 Generating QR code...");
        const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        console.log("✅ QR code generated successfully");

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

        console.log("💾 QR session stored successfully");

        return res.status(200).json(
            new ApiResponse(200, { qrCodeUrl, expiresAt }, "QR code generated successfully")
        );
    } catch (error) {
        console.error("❌ QR Generation Error:", error);
        throw new ApiError(500, `QR code generation failed: ${error.message}`);
    }
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

// Get attendance for a specific club event (Club coordinator only)
const getClubEventAttendance = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const facultyId = req.user._id;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can view club event attendance");
    }

    // Check if event exists and get club information
    const event = await Event.findById(eventId).populate('club');
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Check if the faculty user is the coordinator of the club that owns this event
    if (event.club.facultyCoordinator.toString() !== facultyId.toString()) {
        throw new ApiError(403, "Only the faculty coordinator of this club can view attendance for this event");
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
        new ApiResponse(200, result, "Club event attendance retrieved successfully")
    );
});

// Cleanup orphaned attendance records
const cleanupOrphanedAttendance = asyncHandler(async (req, res) => {
    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can cleanup attendance records");
    }

    try {
        // Find all attendance records
        const allAttendance = await Attendance.find({}).populate(['user', 'event']);
        
        // Identify orphaned records (where user or event doesn't exist)
        const orphanedRecords = allAttendance.filter(record => !record.user || !record.event);
        
        if (orphanedRecords.length > 0) {
            // Delete orphaned records
            const orphanedIds = orphanedRecords.map(record => record._id);
            await Attendance.deleteMany({ _id: { $in: orphanedIds } });
            
            console.log(`🧹 Cleaned up ${orphanedRecords.length} orphaned attendance records`);
            
            return res.status(200).json(
                new ApiResponse(200, { cleanedCount: orphanedRecords.length }, `Successfully cleaned up ${orphanedRecords.length} orphaned attendance records`)
            );
        } else {
            return res.status(200).json(
                new ApiResponse(200, { cleanedCount: 0 }, "No orphaned attendance records found")
            );
        }
    } catch (error) {
        console.error('❌ Error cleaning up orphaned records:', error);
        throw new ApiError(500, "Failed to cleanup orphaned attendance records");
    }
});

export {
    // Student functions
    getOwnAttendance,
    
    // Faculty functions
    markAttendanceForOthers,
    editStudentAttendance,
    getClubEventAttendance,
    getOthersAttendance,
    getEventAttendance,
    getAllAttendanceReports,
    
    // QR Code functions
    generateEventQRCode,
    markAttendanceByQR,
    
    // Summary function
    getAttendanceSummary,

    // Cleanup function
    cleanupOrphanedAttendance
};