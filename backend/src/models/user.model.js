import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoosePaginate from "mongoose-paginate-v2";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["student", "faculty"],
        required: true,
    },
    department: {
        type: String,
    },
    interests: {
        type: [String],
    },
    clubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club"
    }],
    eventsRegistered: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    }],
    refreshToken: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Pre-save middleware to hash password before saving to database
// Only hash the password if it has been modified (or is new)
userSchema.pre("save", async function (next) {
    if(!this.isModified("passwordHash")) return next();

    this.passwordHash = await bcrypt.hash(this.passwordHash, 10)
    next()
})

// Custom method to verify if provided password matches the stored hashed password
// Following mongoose prototype pattern - adds method to userSchema instances
// User instance is an object of the userSchema, so it has access to user properties
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.passwordHash)
}

// Custom method to generate JWT access token for authenticated user sessions
// Called when user logs in or registers successfully
// Takes user id, email, name, and role as payload and signs with secret key and expiry
userSchema.methods.generateAccessToken = function(){
    return jwt.sign( // actual token generation happens here
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET, // env file se access token secret use ho rha 
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY// same with the expiry time
        }
    )
}

// Custom method to generate JWT refresh token for token renewal
// Refresh token is used to generate new access token when access token expires
// Has different (usually less) payload and different secret key for security
// Longer expiry time compared to access token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

// Method to return user object without sensitive information (password)
// Automatically called when user object is converted to JSON
// Ensures password hash is never sent in API responses
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.passwordHash;
    return user;
}; 

// Add pagination plugin
userSchema.plugin(mongoosePaginate);

export const User = mongoose.model("User", userSchema);