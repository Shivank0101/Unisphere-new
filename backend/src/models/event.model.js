import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        required: true,
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    registrations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Registration"
    }],
    maxCapacity: {
        type: Number,
        default: null, // null means unlimited
    },
    eventType: {
        type: String,
        enum: ["workshop", "seminar", "competition", "meeting", "social", "other"],
        default: "other"
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    imageUrl: {
        type: String,
    },
    tags: [{
        type: String,
    }],
    qrSession: {
        token: {
            type: String,
        },
        expiresAt: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    }
}, {
    timestamps: true
});

// Index for better query performance
eventSchema.index({ club: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ isActive: 1 });

// Virtual for registration count
eventSchema.virtual('registrationCount').get(function() {
   return Array.isArray(this.registrations) ? this.registrations.length : 0;
});

// Virtual to check if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
    return new Date(this.startDate) > new Date();
});

// Virtual to check if event is past
eventSchema.virtual('isPast').get(function() {
    return new Date(this.endDate) < new Date();
});

// Virtual to check if event is ongoing
eventSchema.virtual('isOngoing').get(function() {
    const now = new Date();
    return new Date(this.startDate) <= now && new Date(this.endDate) >= now;
});

// Ensure virtuals are included in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export const Event = mongoose.model("Event", eventSchema);