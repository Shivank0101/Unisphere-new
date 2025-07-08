import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Club } from "../models/club.model.js";
import { User } from "../models/user.model.js";
import { Event } from "../models/event.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// 1. View all clubs
const getAllClubs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    // Build filter object
    let filter = {};

    // Search functionality
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get clubs with population and member/event counts
    const clubs = await Club.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "users",
                localField: "facultyCoordinator",
                foreignField: "_id",
                as: "coordinatorDetails"
            }
        },
        {
            $addFields: {
                memberCount: { $size: "$members" },
                eventCount: { $size: "$events" },
                coordinator: { $arrayElemAt: ["$coordinatorDetails", 0] }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                clubType: 1,
                imageUrl: 1,
                memberCount: 1,
                eventCount: 1,
                "coordinator.name": 1,
                "coordinator.email": 1,
                "coordinator.department": 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        { $sort: { memberCount: -1 } }, // Sort by member count
        { $skip: skip },
        { $limit: parseInt(limit) }
    ]);

    // Get total count for pagination
    const totalClubs = await Club.countDocuments(filter);

    const response = {
        clubs: clubs || [],
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalClubs / parseInt(limit)),
            totalClubs,
            hasNext: clubs && skip + clubs.length < totalClubs,
            hasPrev: parseInt(page) > 1
        }
    };

    return res.status(200).json(
        new ApiResponse(200, response, "Clubs retrieved successfully")
    );
});

// 2. View own clubs
const getUserClubs = asyncHandler(async (req, res) => {

    //  console.log("🔍 req.user inside getUserClubs:", req.user); 
    const userId = req.user._id; // From auth middleware

    const user = await User.findById(userId)
        .populate({
            path: 'clubs',
            populate: {
                path: 'facultyCoordinator',
                select: 'name email department'
            }
        });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if user has clubs, if not return empty array
    if (!user.clubs || user.clubs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "User has no clubs")
        );
    }

    // Add member count to each club
    const clubsWithStats = await Promise.all(
        user.clubs.map(async (club) => {
            const fullClub = await Club.findById(club._id);
            
            // Handle case where club might not exist
            if (!fullClub) {
                return {
                    ...club.toObject(),
                    memberCount: 0,
                    eventCount: 0,
                    isCoordinator: club.facultyCoordinator && club.facultyCoordinator._id.equals(userId)
                };
            }
            
            return {
                ...club.toObject(),
                memberCount: fullClub.members ? fullClub.members.length : 0,
                eventCount: fullClub.events ? fullClub.events.length : 0,
                isCoordinator: club.facultyCoordinator && club.facultyCoordinator._id.equals(userId)
            };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, clubsWithStats, "User clubs retrieved successfully")
    );
});

// 3. View single club details
const getClubById = asyncHandler(async (req, res) => {
    const { clubId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
        throw new ApiError(400, "Invalid club ID");
    }

    const club = await Club.findById(clubId)
        .populate('facultyCoordinator', 'name email department')
        .populate('members', 'name email department role')
        .populate({
            path: 'events',
            options: { sort: { startDate: -1 } }, // Latest events first
            populate: {
                path: 'registrations',
                select: '_id'
            }
        });

    if (!club) {
        throw new ApiError(404, "Club not found");
    }

    // Add statistics to club data
    const clubWithStats = {
        ...club.toObject(),
        memberCount: club.members ? club.members.length : 0,
        eventCount: club.events ? club.events.length : 0,
        upcomingEvents: club.events ? club.events.filter(event => new Date(event.startDate) > new Date()).length : 0,
        pastEvents: club.events ? club.events.filter(event => new Date(event.startDate) <= new Date()).length : 0
    };

    return res.status(200).json(
        new ApiResponse(200, clubWithStats, "Club retrieved successfully")
    );
});

// 4. Total club members
 

// 5. Join club
const joinClub = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user._id; // From auth middleware

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
        throw new ApiError(400, "Invalid club ID");
    }

    // Check if club exists
    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found");
    }

    // Check if user is already a member
    if (club.members && club.members.includes(userId)) {
        throw new ApiError(409, "You are already a member of this club");
    }

    // Add member to club
    await Club.findByIdAndUpdate(
        clubId,
        { $push: { members: userId } }
    );

    // Add club to user's clubs array
    await User.findByIdAndUpdate(
        userId,
        { $push: { clubs: clubId } }
    );

    const updatedClub = await Club.findById(clubId)
        .populate('facultyCoordinator', 'name email department');

    return res.status(200).json(
        new ApiResponse(200, updatedClub, "Successfully joined the club")
    );
});

// 6. Leave club
const leaveClub = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user._id; // From auth middleware

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
        throw new ApiError(400, "Invalid club ID");
    }

    // Check if club exists
    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found");
    }

    // Check if user is a member
    if (!club.members || !club.members.includes(userId)) {
        throw new ApiError(404, "You are not a member of this club");
    }

    // Prevent coordinator from leaving their own club
    if (club.facultyCoordinator.equals(userId)) {
        throw new ApiError(400, "Faculty coordinator cannot leave their own club. Transfer coordination first.");
    }

    // Remove member from club
    await Club.findByIdAndUpdate(
        clubId,
        { $pull: { members: userId } }
    );

    // Remove club from user's clubs array
    await User.findByIdAndUpdate(
        userId,
        { $pull: { clubs: clubId } }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Successfully left the club")
    );
});

// 7. Create clubs (Faculty only)
const createClub = asyncHandler(async (req, res) => {
    const { name, description, clubType, imageUrl } = req.body;
    const currentUser = req.user;

    // Debug: Log the received data
    console.log("Received club data:", req.body);
    console.log("Uploaded file:", req.file);

    // Authorization: Only faculty can create clubs
    if (currentUser.role !== "faculty") {
        throw new ApiError(403, "Only faculty can create clubs");
    }

    // Validation - check required fields
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Club name is required");
    }

    if (!clubType || clubType.trim() === "") {
        throw new ApiError(400, "Club type is required");
    }

    // Validate club type
    const validClubTypes = ['cultural', 'dance', 'singing', 'robotics', 'tech', 'sports'];
    if (!validClubTypes.includes(clubType.toLowerCase())) {
        throw new ApiError(400, "Invalid club type. Valid types: cultural, dance, singing, robotics, tech, sports");
    }

    // Check if club name already exists
    const existingClub = await Club.findOne({ name });
    if (existingClub) {
        throw new ApiError(409, "Club with this name already exists");
    }

    // Check club type limits
    const clubTypeLimits = {
        'cultural': 1,
        'dance': 1,
        'singing': 1,
        'robotics': 1,
        'tech': 2,
        'sports': 1
    };

    const existingClubsOfType = await Club.countDocuments({ 
        clubType: clubType.toLowerCase(),
        isActive: true 
    });

    const limit = clubTypeLimits[clubType.toLowerCase()];
    if (existingClubsOfType >= limit) {
        const typeDisplayName = clubType.charAt(0).toUpperCase() + clubType.slice(1);
        throw new ApiError(409, `${typeDisplayName} club already exists. Only ${limit} ${clubType} club${limit > 1 ? 's' : ''} allowed.`);
    }

    // Handle image upload
    let finalImageUrl = imageUrl; // Use provided URL as default
    
    if (req.file) {
        // If a file was uploaded, upload it to Cloudinary
        console.log("Uploading club image to Cloudinary:", req.file.path);
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        
        if (cloudinaryResponse) {
            finalImageUrl = cloudinaryResponse.secure_url;
            console.log("Club image uploaded successfully:", finalImageUrl);
        } else {
            console.log("Failed to upload club image to Cloudinary");
            // Don't fail the entire request, just continue without image
        }
    }

    // Create club with current faculty user as coordinator
    const club = await Club.create({
        name,
        description: description || "",
        clubType: clubType.toLowerCase(),
        imageUrl: finalImageUrl,
        facultyCoordinator: currentUser._id,
        members: [currentUser._id], // Add coordinator as first member
        events: []   // Start with empty events array
    });

    // Add club to user's clubs array
    await User.findByIdAndUpdate(
        currentUser._id,
        { $push: { clubs: club._id } }
    );

    const createdClub = await Club.findById(club._id)
        .populate('facultyCoordinator', 'name email department');

    return res.status(201).json(
        new ApiResponse(200, createdClub, "Club created successfully")
    );
});

// 8. Update own clubs (as coordinator) - Faculty only
const updateClub = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const { name, description, imageUrl } = req.body;
    const currentUser = req.user; // From auth middleware

    // Debug: Log the received data
    console.log("Updating club with data:", req.body);
    console.log("Uploaded file:", req.file);

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
        throw new ApiError(400, "Invalid club ID");
    }

    // Check if club exists
    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found");
    }

    // Authorization: Only faculty coordinator of this club can update club
    if (currentUser.role !== "faculty") {
        throw new ApiError(403, "Only faculty can update clubs");
    }

    if (!club.facultyCoordinator.equals(currentUser._id)) {
        throw new ApiError(403, "Only the faculty coordinator can update this club");
    }

    // If updating name, check for uniqueness
    if (name && name !== club.name) {
        const existingClub = await Club.findOne({ name });
        if (existingClub) {
            throw new ApiError(409, "Club with this name already exists");
        }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Handle image upload or URL
    if (req.file) {
        // If a file was uploaded, upload it to Cloudinary
        console.log("Uploading club image to Cloudinary:", req.file.path);
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        
        if (cloudinaryResponse) {
            updateData.imageUrl = cloudinaryResponse.secure_url;
            console.log("Club image uploaded successfully:", updateData.imageUrl);
        } else {
            console.log("Failed to upload club image to Cloudinary");
        }
    } else if (imageUrl !== undefined) {
        // If URL was provided, use it
        updateData.imageUrl = imageUrl;
    }

    // Update club
    const updatedClub = await Club.findByIdAndUpdate(
        clubId,
        updateData,
        { new: true, runValidators: true }
    ).populate('facultyCoordinator', 'name email department');

    return res.status(200).json(
        new ApiResponse(200, updatedClub, "Club updated successfully")
    );
});

// 9. Remove members from own clubs (Faculty coordinator only)
const removeMemberFromClub = asyncHandler(async (req, res) => {
    const { clubId, userId } = req.params;
    const currentUser = req.user; // From auth middleware

    if (!mongoose.Types.ObjectId.isValid(clubId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid club ID or user ID");
    }

    // Check if club exists
    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found");
    }

    // Authorization: Only faculty coordinator of this club can remove members
    if (currentUser.role !== "faculty") {
        throw new ApiError(403, "Only faculty can remove members from clubs");
    }

    if (!club.facultyCoordinator.equals(currentUser._id)) {
        throw new ApiError(403, "Only the faculty coordinator can remove members from this club");
    }

    // Prevent coordinator from removing themselves
    if (userId === currentUser._id.toString()) {
        throw new ApiError(400, "Faculty coordinator cannot remove themselves from the club");
    }

    // Check if user is a member
    if (!club.members || !club.members.includes(userId)) {
        throw new ApiError(404, "User is not a member of this club");
    }

    // Remove member from club
    await Club.findByIdAndUpdate(
        clubId,
        { $pull: { members: userId } }
    );

    // Remove club from user's clubs array
    await User.findByIdAndUpdate(
        userId,
        { $pull: { clubs: clubId } }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Member removed from club successfully")
    );
});

const deleteClub = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const currentUser = req.user; // From auth middleware

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
        throw new ApiError(400, "Invalid club ID");
    }

    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found");
    }

    // Authorization: Only faculty coordinator can delete their own club
    if (!club.facultyCoordinator.equals(currentUser._id)) {
        throw new ApiError(403, "Only the faculty coordinator can delete their own club");
    }

    // Remove club from all members' clubs arrays
    await User.updateMany(
        { clubs: clubId },
        { $pull: { clubs: clubId } }
    );

    // Note: Consider what to do with events - archive them or transfer ownership
    // For now, we'll keep events but remove club reference
    await Event.updateMany(
        { club: clubId },
        { $unset: { club: 1 } }
    );

    // Delete the club
    await Club.findByIdAndDelete(clubId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Club deleted successfully")
    );
});


export {
    getAllClubs,        // 1. View all clubs
    getUserClubs,       // 2. View own clubs  
    getClubById,        // 3. View single club details
    joinClub,           // 4. Join club
    leaveClub,          // 5. Leave club
    createClub,         // 6. Create clubs (Faculty only)
    updateClub,         // 7. Update own clubs (as coordinator - Faculty only)
    removeMemberFromClub, // 8. Remove members from own clubs (Faculty coordinator only)
    deleteClub          // Delete club (Faculty coordinator only)
};
