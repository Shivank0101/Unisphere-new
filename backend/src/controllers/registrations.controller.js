import { Registration } from "../models/registration.model.js";
import { Event } from "../models/event.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import nodemailer from "nodemailer";

// Email setup
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Register for event
const registerForEvent = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { eventId } = req.body;

    if (!eventId) {
        throw new ApiError(400, "Event ID is required");
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Check if user already registered
    const existingRegistration = await Registration.findOne({ 
        user: userId, 
        event: eventId 
    });
    
    if (existingRegistration) {
        throw new ApiError(400, "You are already registered for this event");
    }

    // Check if event has capacity
    if (event.maxCapacity) {
        const currentRegistrations = await Registration.countDocuments({ 
            event: eventId, 
            status: "registered" 
        });
        
        if (currentRegistrations >= event.maxCapacity) {
            throw new ApiError(400, "Event is at full capacity");
        }
    }

    // Create registration
    const registration = await Registration.create({ 
        user: userId, 
        event: eventId,
        status: "registered"
    });

    // Update user's eventsRegistered array
    await User.findByIdAndUpdate(userId, {
        $addToSet: { eventsRegistered: eventId }
    });

    // Update event's registrations array
    await Event.findByIdAndUpdate(eventId, {
        $addToSet: { registrations: registration._id }
    });

    // Get user details for email
    const user = await User.findById(userId);

    // Send confirmation email
    try {
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: user.email,
            subject: `Registration Confirmed: ${event.title}`,
            html: `
                <h2>Registration Confirmed!</h2>
                <p>Hi ${user.name},</p>
                <p>You have successfully registered for <strong>${event.title}</strong>.</p>
                <p><strong>Event Details:</strong></p>
                <ul>
                    <li>Date: ${new Date(event.startDate).toLocaleDateString()}</li>
                    <li>Time: ${new Date(event.startDate).toLocaleTimeString()}</li>
                    <li>Location: ${event.location}</li>
                </ul>
                <p>Thank you!</p>
                <p>UniSphere Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Registration confirmation email sent to:', user.email);
    } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw error - registration should still succeed even if email fails
    }

    // Populate the registration before sending response
    await registration.populate([
        { path: "user", select: "name email" },
        { path: "event", select: "title startDate endDate location" }
    ]);

    return res.status(201).json(
        new ApiResponse(201, registration, "Successfully registered for event and confirmation email sent")
    );
});

// Unregister from event
const unregisterFromEvent = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { eventId } = req.body;

    if (!eventId) {
        throw new ApiError(400, "Event ID is required");
    }

    // Find and delete registration
    const registration = await Registration.findOneAndDelete({ 
        user: userId, 
        event: eventId 
    });

    if (!registration) {
        throw new ApiError(404, "You are not registered for this event");
    }

    // Remove event from user's eventsRegistered array
    await User.findByIdAndUpdate(userId, {
        $pull: { eventsRegistered: eventId }
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Successfully unregistered from event")
    );
});

// View own registrations
const getMyRegistrations = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    // Build filter
    const filter = { user: userId };
    if (status) {
        filter.status = status;
    }

    // Pagination options
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            { 
                path: "event", 
                select: "title description startDate endDate location club",
                populate: { path: "club", select: "name" }
            }
        ],
        sort: { registrationDate: -1 }
    };

<<<<<<< HEAD
    const registrations = await Registration.paginate(filter, options);

    return res.status(200).json(
        new ApiResponse(200, registrations, "Registrations retrieved successfully")
    );
=======
    // const registrations = await Registration.paginate(filter, options);

    // return res.status(200).json(
    //     new ApiResponse(200, registrations, "Registrations retrieved successfully")
    // );

    try {
    const registrations = await Registration.paginate(filter, options);
    return res.status(200).json(
      new ApiResponse(200, registrations, "Registrations retrieved successfully")
    );
  } catch (error) {
    console.error("🔥 getMyRegistrations error:", error);
    throw new ApiError(500, "Internal Server Error in getMyRegistrations");
  }

>>>>>>> bfc9cd6 (Updated frontend code)
});

// Get registrations for a specific event (Faculty only)
const getEventRegistrations = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can view event registrations");
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Build filter
    const filter = { event: eventId };
    if (status) {
        filter.status = status;
    }

    // Pagination options
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            { path: "user", select: "name email department" },
            { path: "event", select: "title startDate endDate" }
        ],
        sort: { registrationDate: -1 }
    };

    const registrations = await Registration.paginate(filter, options);

    return res.status(200).json(
        new ApiResponse(200, registrations, "Event registrations retrieved successfully")
    );
});

// Check if user is registered for an event
const checkRegistrationStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { eventId } = req.params;

    const registration = await Registration.findOne({ 
        user: userId, 
        event: eventId 
    });

    const isRegistered = !!registration;
    const registrationData = registration ? {
        registrationDate: registration.registrationDate,
        status: registration.status
    } : null;

    return res.status(200).json(
        new ApiResponse(200, { 
            isRegistered, 
            registration: registrationData 
        }, "Registration status checked successfully")
    );
});

export {
    registerForEvent, 
    unregisterFromEvent, 
    getMyRegistrations, // student dashboard mai, (shows all the events the student has registered for)
    getEventRegistrations, // faculty dashboard mai, (shows all the registrations for a specific event)
    checkRegistrationStatus
<<<<<<< HEAD
};
=======
};
>>>>>>> bfc9cd6 (Updated frontend code)
