"use server";

import { connectToDatabase } from "@/lib/db";
import Task from "@/models/task";
import Project from "@/models/project";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import clientPromise from "@/lib/db";

export async function createTask(data: {
    name: string;
    description: string;
    priority: "low" | "medium" | "high";
    type: "task" | "bug" | "feature";
    assignee: string;
    dueDate: Date;
    projectId: string;
    blobId: string;
}) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    // Check permissions (Owner/Manager)
    const project = await Project.findById(data.projectId);
    if (!project) throw new Error("Project not found");

    const member = (project.members as any).find((m: any) => m.userId === session.user.id);
    const userRole = project.ownerId === session.user.id ? "owner" : (member ? member.role : null);

    if (userRole !== "owner" && userRole !== "manager") {
        throw new Error("Only owners and managers can create tasks.");
    }

    try {
        const task = await Task.create({
            ...data,
            createdBy: session.user.id,
        });
        return JSON.parse(JSON.stringify(task));
    } catch (error: any) {
        throw new Error(error.message || "Failed to create task.");
    }
}


export async function getProjectMembers(projectId: string) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    const userIds = project.members.map((m: any) => typeof m === "string" ? m : m.userId);

    // Always include the owner
    if (project.ownerId && !userIds.includes(project.ownerId)) {
        userIds.push(project.ownerId);
    }

    const db = (await clientPromise).db();

    // Better-auth might use 'id' or '_id'. Let's check both or use an $or query.
    // Also, handle the case where userId might need to be an ObjectId.
    const users = await db.collection("user").find({
        $or: [
            { id: { $in: userIds } },
            { _id: { $in: userIds } },
            // Handle if they are stored as ObjectIds in MongoDB
            {
                _id: {
                    $in: userIds.map(id => {
                        try { return new (require("mongodb").ObjectId)(id); } catch { return null; }
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

    const normalizedMembers = userIds.map((uid: string) => {
        const user = userMap.get(uid);
        const member = (project.members as any).find((m: any) =>
            (typeof m === "string" ? m : m.userId) === uid
        );

        return {
            userId: uid,
            name: user?.name || "Unknown User",
            image: user?.image || "",
            role: uid === project.ownerId ? "owner" : (member?.role || "member")
        };
    });

    return JSON.parse(JSON.stringify(normalizedMembers));
}

export async function getTasksByBlob(projectId: string, blobId: string) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error("Unauthorized");

    const tasks = await Task.find({ projectId, blobId })
        .sort({ createdAt: -1 })
        .lean();

    // Categorize and limit to 6 recent ones per category
    const categories = {
        task: { items: [] as any[], total: 0 },
        bug: { items: [] as any[], total: 0 },
        feature: { items: [] as any[], total: 0 }
    };

    // Fetch user details for all assignees
    const assigneeIds = tasks.map((t: any) => t.assignee).filter(Boolean);
    const db = (await clientPromise).db();

    const users = await db.collection("user").find({
        $or: [
            { id: { $in: assigneeIds } },
            { _id: { $in: assigneeIds } },
            {
                _id: {
                    $in: assigneeIds.map((id: string) => {
                        try { return new (require("mongodb").ObjectId)(id); } catch { return null; }
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

    tasks.forEach((task: any) => {
        const type = (task.type || "task") as keyof typeof categories;
        const enrichedTask = {
            ...task,
            assigneeDetails: task.assignee ? {
                name: userMap.get(task.assignee)?.name || "Unknown User",
                image: userMap.get(task.assignee)?.image || ""
            } : null
        };

        if (categories[type]) {
            categories[type].total++;
            if (categories[type].items.length < 6) {
                categories[type].items.push(enrichedTask);
            }
        }
    });

    return JSON.parse(JSON.stringify(categories));
}
