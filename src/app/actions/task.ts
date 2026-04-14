"use server";

import { connectToDatabase } from "@/lib/db";
import Task from "@/models/task";
import Project from "@/models/project";
import Explorer from "@/models/explorer";
import Bug from "@/models/bug";
import Feature from "@/models/feature";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import clientPromise from "@/lib/db";

export async function createTask(data: {
    name: string;
    description: string;
    status: string;
    priority: "low" | "medium" | "high";
    projectId: string;
    assignee: string;
    dueDate: Date;
    blobId: string;
    createdBy: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const task = await Task.create(data);
    return JSON.parse(JSON.stringify(task));
}

export async function createBug(data: {
    name: string;
    description: string;
    priority: "low" | "medium" | "high";
    projectId: string;
    blobId: string;
    status: string;
    reportedBy: string;
    fixedBy?: string;
    dueDate: Date;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const bug = await Bug.create(data);
    return JSON.parse(JSON.stringify(bug));
}

export async function createFeature(data: {
    name: string;
    description: string;
    projectId: string;
    blobId: string;
    addedBy: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const feature = await Feature.create(data);
    return JSON.parse(JSON.stringify(feature));
}

export async function getProjectMembers(projectId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");

    await connectToDatabase();
    const project = await Project.findById(projectId).lean();
    if (!project) throw new Error("Project not found");

    const userIds = project.members.map((m: any) => m.userId);
    const db = (await clientPromise).db();

    const users = await db.collection("user").find({
        $or: [
            { id: { $in: userIds } },
            { _id: { $in: userIds } },
            {
                _id: {
                    $in: userIds.map((id: string) => {
                        try { return new (require("mongodb").ObjectId)(id); } catch { return null; }
                    }).filter(Boolean)
                }
            }
        ]
    }).toArray();

    return JSON.parse(JSON.stringify(users));
}

export async function getTasksByBlob(projectId: string, blobId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const [tasks, bugs, features, currentBlob] = await Promise.all([
        Task.find({ projectId, blobId }).sort({ createdAt: -1 }).lean(),
        Bug.find({ projectId, blobId }).sort({ createdAt: -1 }).lean(),
        Feature.find({ projectId, blobId }).sort({ createdAt: -1 }).lean(),
        Explorer.findById(blobId).lean()
    ]);

    const categories = {
        task: { items: [] as any[], total: tasks.length },
        bug: { items: [] as any[], total: bugs.length },
        feature: { items: [] as any[], total: features.length }
    };

    const allUserIds = new Set([
        ...tasks.map((t: any) => t.assignee),
        ...bugs.map((b: any) => b.reportedBy),
        ...bugs.map((b: any) => b.fixedBy),
        ...features.map((f: any) => f.addedBy),
    ].filter(Boolean));

    const assigneeIds = Array.from(allUserIds);
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

    categories.task.items = tasks.slice(0, 6).map((task: any) => ({
        ...task,
        assigneeDetails: task.assignee ? {
            name: userMap.get(task.assignee)?.name || "Unknown User",
            image: userMap.get(task.assignee)?.image || ""
        } : null
    }));

    categories.bug.items = bugs.slice(0, 6).map((bug: any) => ({
        ...bug,
        assigneeDetails: bug.fixedBy ? {
            name: userMap.get(bug.fixedBy)?.name || "Unknown User",
            image: userMap.get(bug.fixedBy)?.image || ""
        } : null,
        reporterDetails: bug.reportedBy ? {
            name: userMap.get(bug.reportedBy)?.name || "Unknown User",
            image: userMap.get(bug.reportedBy)?.image || ""
        } : null
    }));

    categories.feature.items = features.slice(0, 6).map((feature: any) => ({
        ...feature,
        addedByDetails: feature.addedBy ? {
            name: userMap.get(feature.addedBy)?.name || "Unknown User",
            image: userMap.get(feature.addedBy)?.image || ""
        } : null
    }));

    // Path resolution
    const path: string[] = [];
    if (currentBlob) {
        let current: any = currentBlob;
        path.unshift(current.name);
        while (current.parent) {
            current = await Explorer.findById(current.parent).lean();
            if (current) path.unshift(current.name);
            else break;
        }
    }

    return JSON.parse(JSON.stringify({
        ...categories,
        path
    }));
}
