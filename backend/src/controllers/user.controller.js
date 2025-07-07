import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Club } from "../models/club.model.js";
import jwt from "jsonwebtoken"; 
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Helper function to generate access and refresh tokens
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

// Register new user controller
const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend
    // Validation - not empty
    // Check if user already exists: email
    // Create user object - create entry in db
    // Generate access and refresh tokens
    // Remove password field from response
    // Return response

    const { name, email, password, role, department, interests } = req.body
    
    // Validation - check if required fields are present
    if (
        [name, email, password, role].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Name, email, password, and role are required")
    }

    // Validate role enum
    if (!["student", "faculty"].includes(role)) {
        throw new ApiError(400, "Role must be student or faculty")
    }

    // Check if user already exists
    const existedUser = await User.findOne({ email })
    
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists")
    }

    // Create user object and save to database
    const user = await User.create({
        name,
        email,
        passwordHash: password, // This will be automatically hashed by the pre-save middleware
        role,
        department: department || "",
        interests: interests || []
    })

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // Get created user without sensitive information
    const createdUser = await User.findById(user._id).select(
        "-passwordHash -refreshToken"
    )
    
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // Set cookie options
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: createdUser,
                    accessToken,
                    refreshToken
                },
                "User registered successfully"
            )
        )
})

// Login user controller
const loginUser = asyncHandler(async (req, res) => {
    // Get email and password from request body
    // Validation - not empty
    // Find user by email
    // Check if password is correct
    // Generate access and refresh tokens
    // Send cookies and response

    const { email, password } = req.body

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required")
    }

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // Check if password is correct
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // Get user without sensitive information
    const loggedInUser = await User.findById(user._id).select("-passwordHash -refreshToken")

    // Cookie options
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

// Logout user controller
const logoutUser = asyncHandler(async (req, res) => {
    // Clear refresh token from database
    // Clear cookies
    // Send response

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // This removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})

// Get current user controller
const getCurrentUser = asyncHandler(async (req, res) => {
    // User is already available from auth middleware (req.user)
    // Just return the user data without sensitive information
    
    const currentUser = await User.findById(req.user._id)
        .select("-passwordHash -refreshToken")
        .populate('clubs', 'name category')
        .populate('eventsRegistered', 'title startDate location');

    if (!currentUser) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                currentUser,
                "Current user retrieved successfully"
            )
        );
});

// Student: Join a club
const joinClub = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user._id;

    // Only students can join clubs
    if (req.user.role !== "student") {
        throw new ApiError(403, "Only students can join clubs");
    }

    // Check if club exists and is active
    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found");
    }

    if (!club.isActive) {
        throw new ApiError(400, "Club is not currently active");
    }

    // Check if user is already a member
    if (club.members.includes(userId)) {
        throw new ApiError(409, "You are already a member of this club");
    }

    // Add user to club members
    await Club.findByIdAndUpdate(
        clubId,
        { $addToSet: { members: userId } },
        { new: true }
    );

    // Add club to user's clubs array
    await User.findByIdAndUpdate(
        userId,
        { $addToSet: { clubs: clubId } },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Successfully joined the club"));
});

// Student: Leave a club
const leaveClub = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user._id;

    // Only students can leave clubs
    if (req.user.role !== "student") {
        throw new ApiError(403, "Only students can leave clubs");
    }

    // Check if club exists
    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found");
    }

    // Check if user is a member
    if (!club.members.includes(userId)) {
        throw new ApiError(400, "You are not a member of this club");
    }

    // Remove user from club members
    await Club.findByIdAndUpdate(
        clubId,
        { $pull: { members: userId } },
        { new: true }
    );

    // Remove club from user's clubs array
    await User.findByIdAndUpdate(
        userId,
        { $pull: { clubs: clubId } },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Successfully left the club"));
});

// Student: Get own clubs
const getMyClubs = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId)
        .populate({
            path: 'clubs',
            select: 'name description memberCount facultyCoordinator isActive',
            populate: {
                path: 'facultyCoordinator',
                select: 'name email department'
            }
        });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Ensure user.clubs exists and is an array
    const userClubs = user.clubs || [];

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userClubs,
                "User clubs retrieved successfully"
            )
        );
});

// Get all users (faculty only)
const getAllUsers = asyncHandler(async (req, res) => {
    // Check if user is faculty
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Only faculty can view all users");
    }

    const { role, department, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        select: 'name email role department createdAt',
        sort: { name: 1 }
    };

    const users = await User.paginate(filter, options);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                users,
                "Users retrieved successfully"
            )
        );
});

// Export all controllers
export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    joinClub,
    leaveClub,
    getMyClubs,
    getAllUsers
}

