import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const registrationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["registered", "cancelled", "attended", "no-show"],
        default: "registered",
    },
    notes: {
        type: String,
    }
}, {
    timestamps: true
});

// Compound index to ensure user can only register once per event
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

// Index for better query performance
registrationSchema.index({ event: 1 });
registrationSchema.index({ user: 1 });
registrationSchema.index({ status: 1 });

// Add pagination plugin
registrationSchema.plugin(mongoosePaginate);

<<<<<<< HEAD
export const Registration = mongoose.model("Registration", registrationSchema);
=======
export const Registration = mongoose.model("Registration", registrationSchema);
>>>>>>> bfc9cd6 (Updated frontend code)
