import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
    ownerId: string;
    name: string;
    description?: string;
    joinToken: string;
    members: { userId: string; role: "manager" | "member" }[];
    createdAt: Date;
    updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
    {
        ownerId: { type: String, required: true, index: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        joinToken: {
            type: String,
            required: true,
            unique: true,
            default: () => Math.floor(100000 + Math.random() * 900000).toString(),
        },
        members: { type: [{ userId: String, role: String }], default: [] },
    },
    { timestamps: true }
);

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

export default Project;
