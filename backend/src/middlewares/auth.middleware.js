//Explanation  ye logout krne k liye custom middleware banaya h


import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {             
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") // looking for the access token in the cookies or in the authorixation header 
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) // cerifying the token using the secret key
    
        const user = await User.findById(decodedToken?._id).select("-passwordHash -refreshToken") // finding the user using the id in the token and excluding the password and refresh token from the result
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user; // adding a user oject to the request object so that we can use it in the user logout contorller
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})

// Middleware to verify if user is faculty
export const verifyFaculty = asyncHandler(async(req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }
    
    // Check if user has faculty role
    if (req.user.role !== "faculty") {
        throw new ApiError(403, "Faculty access required");
    }
    
    next();
});