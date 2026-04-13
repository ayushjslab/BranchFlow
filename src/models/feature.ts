import { Schema, model, models } from "mongoose";

const featureSchema = new Schema({
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
        enum: ["planning", "development", "testing", "deployed"],
        default: "planning"
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
    addedBy: {
        type: String, // User ID (Creator)
        required: true
    },
    assignee: {
        type: String, // User ID
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
    }
}, { timestamps: true });

const Feature = models.Feature || model("Feature", featureSchema);

export default Feature;
