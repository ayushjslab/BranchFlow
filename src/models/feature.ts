import { Schema, model, models } from "mongoose";

const featureSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String, // This acts as the "message" or details of the new feature
        required: true
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    addedBy: {
        type: String, // User ID (Who added the feature)
        required: true
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    dueDate: {
        type: Date,
        required: true
    },
    assignee: {
        type: String, // User ID (Who is responsible for implementing)
        default: null
    },
    blobId: {
        type: Schema.Types.ObjectId,
        ref: "Explorer",
        required: true
    },
    status: {
        type: String,
        enum: ["proposed", "planned", "released"],
        default: "proposed"
    },
    position: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Feature = models.Feature || model("Feature", featureSchema);

export default Feature;
