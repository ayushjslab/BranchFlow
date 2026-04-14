import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBugComment extends Document {
    bugId: mongoose.Types.ObjectId;
    userId: string;
    content: string; // HTML or Markdown for Rich Text
    mentions: string[]; // List of user IDs tagged
    createdAt: Date;
    updatedAt: Date;
}

const bugCommentSchema = new Schema<IBugComment>(
    {
        bugId: {
            type: Schema.Types.ObjectId,
            ref: "Bug",
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
        },
        mentions: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

const BugComment: Model<IBugComment> =
    mongoose.models.BugComment || mongoose.model<IBugComment>("BugComment", bugCommentSchema);

export default BugComment;
