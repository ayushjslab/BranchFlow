import { Schema, model, models } from "mongoose";

const bugSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "in-progress", "completed", "won't fix", "duplicate"],
        default: "pending"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    reportedBy: {
        type: String, // User ID
        required: true
    },
    fixedBy: {
        type: String, // User ID (Assignee)
        default: null
    },
    dueDate: {
        type: Date,
        required: true
    },
    blobId: {
        type: Schema.Types.ObjectId,
        ref: "Explorer",
        required: true
    },
    position: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Bug = models.Bug || model("Bug", bugSchema);

export default Bug;
