"use server";

import { connectToDatabase } from "@/lib/db";
import clientPromise from "@/lib/db";
import Task from "@/models/task";
import Project from "@/models/project";
import Explorer from "@/models/explorer";
import Bug from "@/models/bug";
import Feature from "@/models/feature";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { getProjectRole } from "./project";

export async function createTask(data: {
    name: string;
    description: string;
    status: string;
    priority: "low" | "medium" | "high";
    projectId: string;
    assignee: string;
    dueDate: Date;
    blobId: string;
    createdBy?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const role = await getProjectRole(data.projectId, session.user.id);
    if (role === "member") {
        throw new Error("Members cannot create tasks. Only owners and managers are authorized.");
    }

    // Role-based assignment check for managers
    if (role === "manager" && data.assignee) {
        const assigneeRole = await getProjectRole(data.projectId, data.assignee);
        if (assigneeRole === "owner") {
            throw new Error("Managers cannot assign work to the project owner.");
        }
    }

    const task = await Task.create({
        ...data,
        createdBy: session.user.id
    });
    return JSON.parse(JSON.stringify(task));
}

export async function createBug(data: {
    name: string;
    description: string;
    priority: "low" | "medium" | "high";
    projectId: string;
    blobId: string;
    status: string;
    reportedBy?: string;
    fixedBy?: string;
    dueDate: Date;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    // Members CAN create bugs as per user request ("members can report only bugs")
    const role = await getProjectRole(data.projectId, session.user.id);
    if (!role) throw new Error("You are not a member of this project.");

    // Role-based assignment check for managers
    if (role === "manager" && data.fixedBy) {
        const fixedByRole = await getProjectRole(data.projectId, data.fixedBy);
        if (fixedByRole === "owner") {
            throw new Error("Managers cannot assign bug fixes to the project owner.");
        }
    }

    const bug = await Bug.create({
        ...data,
        reportedBy: session.user.id
    });
    return JSON.parse(JSON.stringify(bug));
}

export async function createFeature(data: {
    name: string;
    description: string;
    priority: "low" | "medium" | "high";
    dueDate: Date;
    projectId: string;
    blobId: string;
    addedBy?: string;
    assignee?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const role = await getProjectRole(data.projectId, session.user.id);
    if (role === "member") {
        throw new Error("Members cannot announce features. Only owners and managers are authorized.");
    }

    // Role-based assignment check for managers
    if (role === "manager" && data.assignee) {
        const assigneeRole = await getProjectRole(data.projectId, data.assignee);
        if (assigneeRole === "owner") {
            throw new Error("Managers cannot assign features to the project owner.");
        }
    }

    const feature = await Feature.create({
        ...data,
        addedBy: session.user.id
    });
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

    const memberDetails = project.members.map((m: any) => {
        const uid = typeof m === "string" ? m : m.userId;
        return {
            userId: uid,
            role: project.ownerId === uid ? "owner" : (typeof m === "string" ? "member" : m.role)
        };
    });

    const userIds = memberDetails.map(m => m.userId);
    const db = (await clientPromise).db();

    const users = await db.collection("user").find({
        $or: [
            { _id: { $in: userIds } },
            { id: { $in: userIds } },
            {
                _id: {
                    $in: userIds.map((id: string) => {
                        try { return new mongoose.Types.ObjectId(id); } catch { return null; }
                    }).filter(Boolean)
                }
            }
        ]
    }).toArray();

    const membersWithData = memberDetails.map(member => {
        const userData = users.find(u =>
            u._id.toString() === member.userId ||
            u.id === member.userId ||
            u._id === member.userId
        );

        return {
            userId: member.userId,
            role: member.role,
            name: userData?.name || "Unknown User",
            image: userData?.image || null,
            email: userData?.email || null
        };
    });

    return JSON.parse(JSON.stringify(membersWithData));
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

export async function getPaginatedTasks(params: {
    projectId: string;
    page: number;
    limit: number;
    search?: string;
    status?: string;
    priority?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const { projectId, page, limit, search, status, priority } = params;
    const skip = (page - 1) * limit;

    const query: any = { projectId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const [tasks, total] = await Promise.all([
        Task.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Task.countDocuments(query)
    ]);

    // Hydrate users
    const allUserIds = new Set([
        ...tasks.map((t: any) => t.assignee),
        ...tasks.map((t: any) => t.createdBy),
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

    // Hydrate paths
    const items = await Promise.all(tasks.map(async (task: any) => {
        const path: string[] = [];
        let current: any = await Explorer.findById(task.blobId).lean();
        if (current) {
            path.unshift(current.name);
            while (current.parent) {
                current = await Explorer.findById(current.parent).lean();
                if (current) path.unshift(current.name);
                else break;
            }
        }

        return {
            ...task,
            filePath: path.join(" / "),
            assigneeDetails: task.assignee ? {
                name: userMap.get(task.assignee)?.name || "Unknown User",
                image: userMap.get(task.assignee)?.image || ""
            } : null,
            creatorDetails: task.createdBy ? {
                name: userMap.get(task.createdBy)?.name || "Unknown User",
                image: userMap.get(task.createdBy)?.image || ""
            } : null
        };
    }));

    return JSON.parse(JSON.stringify({
        items,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
    }));
}

export async function getPaginatedBugs(params: {
    projectId: string;
    page: number;
    limit: number;
    search?: string;
    status?: string;
    priority?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const { projectId, page, limit, search, status, priority } = params;
    const skip = (page - 1) * limit;

    const query: any = { projectId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const [bugs, total] = await Promise.all([
        Bug.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Bug.countDocuments(query)
    ]);

    const allUserIds = new Set([
        ...bugs.map((b: any) => b.reportedBy),
        ...bugs.map((b: any) => b.fixedBy),
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

    const items = await Promise.all(bugs.map(async (bug: any) => {
        const path: string[] = [];
        let current: any = await Explorer.findById(bug.blobId).lean();
        if (current) {
            path.unshift(current.name);
            while (current.parent) {
                current = await Explorer.findById(current.parent).lean();
                if (current) path.unshift(current.name);
                else break;
            }
        }

        return {
            ...bug,
            filePath: path.join(" / "),
            assigneeDetails: bug.fixedBy ? {
                name: userMap.get(bug.fixedBy)?.name || "Unknown User",
                image: userMap.get(bug.fixedBy)?.image || ""
            } : null,
            reporterDetails: bug.reportedBy ? {
                name: userMap.get(bug.reportedBy)?.name || "Unknown User",
                image: userMap.get(bug.reportedBy)?.image || ""
            } : null
        };
    }));

    return JSON.parse(JSON.stringify({
        items,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
    }));
}

export async function getPaginatedFeatures(params: {
    projectId: string;
    page: number;
    limit: number;
    search?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const { projectId, page, limit, search } = params;
    const skip = (page - 1) * limit;

    const query: any = { projectId };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const [features, total] = await Promise.all([
        Feature.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Feature.countDocuments(query)
    ]);

    const allUserIds = new Set([
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

    const items = await Promise.all(features.map(async (feature: any) => {
        const path: string[] = [];
        let current: any = await Explorer.findById(feature.blobId).lean();
        if (current) {
            path.unshift(current.name);
            while (current.parent) {
                current = await Explorer.findById(current.parent).lean();
                if (current) path.unshift(current.name);
                else break;
            }
        }

        return {
            ...feature,
            filePath: path.join(" / "),
            addedByDetails: feature.addedBy ? {
                name: userMap.get(feature.addedBy)?.name || "Unknown User",
                image: userMap.get(feature.addedBy)?.image || ""
            } : null
        };
    }));

    return JSON.parse(JSON.stringify({
        items,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
    }));
}

export async function updateWorkItem(params: {
    id: string;
    type: "task" | "bug" | "feature";
    data: any;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const { id, type, data } = params;
    const Model = type === "task" ? Task : type === "bug" ? Bug : Feature;

    // Check ownership
    const item = await Model.findById(id).lean();
    if (!item) throw new Error("Item not found");

    const ownerId = (item as any).createdBy || (item as any).reportedBy || (item as any).addedBy;
    if (ownerId !== session.user.id) throw new Error("Only the creator can edit this item");

    const updated = await Model.findByIdAndUpdate(id, data, { new: true });
    return JSON.parse(JSON.stringify(updated));
}

export async function deleteWorkItem(params: {
    id: string;
    type: "task" | "bug" | "feature";
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const { id, type } = params;
    const Model = type === "task" ? Task : type === "bug" ? Bug : Feature;

    // Check ownership
    const item = await Model.findById(id).lean();
    if (!item) throw new Error("Item not found");

    const ownerId = (item as any).createdBy || (item as any).reportedBy || (item as any).addedBy;
    if (ownerId !== session.user.id) throw new Error("Only the creator can delete this item");
    await Model.findByIdAndDelete(id);
    return { success: true };
}

export async function getMyWorkItems() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    await connectToDatabase();

    const [tasks, bugs, features] = await Promise.all([
        Task.find({ assignee: userId }).sort({ position: 1, createdAt: -1 }).lean(),
        Bug.find({ fixedBy: userId }).sort({ position: 1, createdAt: -1 }).lean(),
        Feature.find({
            $or: [
                { addedBy: userId },
                { assignee: userId }
            ]
        }).sort({ position: 1, createdAt: -1 }).lean()
    ]);

    // Hydrate paths for all items
    const hydrate = async (items: any[]) => {
        return Promise.all(items.map(async (item) => {
            const path: string[] = [];
            let current: any = await Explorer.findById(item.blobId).lean();
            if (current) {
                path.unshift(current.name);
                while (current.parent) {
                    current = await Explorer.findById(current.parent).lean();
                    if (current) path.unshift(current.name);
                    else break;
                }
            }
            return { ...item, filePath: path.join(" / ") };
        }));
    };

    return JSON.parse(JSON.stringify({
        tasks: await hydrate(tasks),
        bugs: await hydrate(bugs),
        features: await hydrate(features)
    }));
}

export async function updateWorkItemStatusAndPosition(data: {
    id: string;
    type: "task" | "bug" | "feature";
    status?: string;
    position: number;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error("Unauthorized");
    await connectToDatabase();

    const Model = data.type === "bug" ? Bug : data.type === "feature" ? Feature : Task;
    const item = await Model.findById(data.id);
    if (!item) throw new Error("Item not found");

    // Check ownership/assignment
    const assigneeField = data.type === "bug" ? "fixedBy" : data.type === "feature" ? "addedBy" : "assignee";
    const isAssigned = item[assigneeField] === session.user.id;
    if (!isAssigned) throw new Error("Unauthorized to move this item");

    const oldStatus = item.status;
    const newStatus = data.status || oldStatus;
    const newPosition = data.position;

    // Update the item itself
    item.status = newStatus;
    item.position = newPosition;
    await item.save();

    // Now re-rank all other items in the destination column to ensure uniqueness and order
    // We fetch all items in the new status for this user
    const query: any = { [assigneeField]: session.user.id, status: newStatus };
    const itemsInCol = await Model.find(query).sort({ position: 1, updatedAt: -1 }).lean();

    // Re-verify positions
    const bulkOps = itemsInCol.map((doc, index) => ({
        updateOne: {
            filter: { _id: doc._id },
            update: { $set: { position: index } }
        }
    }));

    if (bulkOps.length > 0) {
        await Model.bulkWrite(bulkOps as any);
    }

    return { success: true };
}
