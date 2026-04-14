"use server";

import { connectToDatabase } from "@/lib/db";
import clientPromise from "@/lib/db";
import BugComment from "@/models/bug-comment";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

/**
 * Fetch all comments for a bug, joined with user details.
 */
export async function getBugComments(bugId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const comments = await BugComment.find({ bugId })
        .sort({ createdAt: 1 })
        .lean();

    const userIds = Array.from(new Set(comments.map((c: any) => c.userId)));
    const db = (await clientPromise).db();

    const users = await db.collection("user").find({
        $or: [
            { id: { $in: userIds } },
            { _id: { $in: userIds } },
            {
                _id: {
                    $in: userIds.map((id: string) => {
                        try { return new mongoose.Types.ObjectId(id); } catch { return null; }
                    }).filter(Boolean)
                }
            }
        ]
    }).toArray();

    const userMap = new Map();
    users.forEach((u: any) => {
        if (u.id) userMap.set(u.id, u);
        if (u._id) userMap.set(u._id.toString(), u);
    });

    const richComments = comments.map(comment => {
        const userData = userMap.get(comment.userId);
        return {
            ...comment,
            _id: comment._id.toString(),
            bugId: comment.bugId.toString(),
            user: {
                name: userData?.name || "Unknown User",
                image: userData?.image || null,
            }
        };
    });

    return JSON.parse(JSON.stringify(richComments));
}

/**
 * Send a new bug comment.
 */
export async function sendBugComment(data: {
    bugId: string;
    content: string;
    mentions?: string[];
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const comment = await BugComment.create({
        ...data,
        userId: session.user.id
    });

    return JSON.parse(JSON.stringify(comment));
}

/**
 * Delete a comment.
 */
export async function deleteBugComment(commentId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const comment = await BugComment.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.userId !== session.user.id) {
        throw new Error("You can only delete your own comments.");
    }

    await BugComment.findByIdAndDelete(commentId);
    return { success: true };
}
