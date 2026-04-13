import { Schema, model, models } from "mongoose";

const taskSchema = new Schema({
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
        enum: ["pending", "in-progress", "completed"],
        default: "pending"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    type: {
        type: String,
        enum: ["task", "bug", "feature"],
        default: "task"
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    assignee: {
        type: String, // User ID
        required: true
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
    createdBy: {
        type: String, // User ID
        required: true
    }
}, { timestamps: true });

const Task = models.Task || model("Task", taskSchema);

export default Task;