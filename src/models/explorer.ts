import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExplorer extends Document {
    name: string;
    type: "blob" | "folder";
    projectId: mongoose.Types.ObjectId;
    parent: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const explorerSchema = new Schema<IExplorer>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["blob", "folder"],
        required: true,
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "Explorer",
        default: null,
    }
}, {
    timestamps: true,
});

// Indexes for performance
explorerSchema.index({ projectId: 1, parent: 1 });
explorerSchema.index({ projectId: 1, name: 1, parent: 1 }, { unique: true });

const Explorer: Model<IExplorer> = mongoose.models.Explorer || mongoose.model<IExplorer>("Explorer", explorerSchema);

export default Explorer;