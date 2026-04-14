import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserGithubToken extends Document {
    userId: string;
    accessToken: string;
    createdAt: Date;
    updatedAt: Date;
}

const userGithubTokenSchema = new Schema<IUserGithubToken>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        accessToken: { type: String, required: true },
    },
    { timestamps: true }
);

const UserGithubToken: Model<IUserGithubToken> =
    mongoose.models.UserGithubToken ||
    mongoose.model<IUserGithubToken>("UserGithubToken", userGithubTokenSchema);

export default UserGithubToken;
