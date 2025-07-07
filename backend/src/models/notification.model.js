import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["event", "club", "general", "reminder", "announcement"],
        default: "general"
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // Faculty who sends the notification
    },
    recipients: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date
        }
    }],
    relatedEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    },
    relatedClub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium"
    },
    scheduledFor: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
notificationSchema.index({ sender: 1 });
notificationSchema.index({ "recipients.user": 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ relatedEvent: 1 });
notificationSchema.index({ relatedClub: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ isActive: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
