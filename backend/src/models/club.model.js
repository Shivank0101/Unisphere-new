import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    facultyCoordinator:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    events: [{
        type: mongoose.Schema.Types.ObjectId,   
        ref: "Event"
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
clubSchema.index({ facultyCoordinator: 1 });
clubSchema.index({ members: 1 });

// Virtual for member count
clubSchema.virtual('memberCount').get(function() {
    return this.members ? this.members.length : 0;
});

// Ensure virtuals are included in JSON output
clubSchema.set('toJSON', { virtuals: true });
clubSchema.set('toObject', { virtuals: true });

// Pre-save middleware to ensure arrays are initialized
clubSchema.pre('save', function(next) {
    if (!this.members) this.members = [];
    if (!this.events) this.events = [];
    next();
});

export const Club = mongoose.model("Club", clubSchema);
