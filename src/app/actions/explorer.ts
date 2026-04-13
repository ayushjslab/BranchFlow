"use server";

import { connectToDatabase } from "@/lib/db";
import Explorer from "@/models/explorer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createExplorerItem(data: {
    name: string;
    type: "blob" | "folder";
    projectId: string;
    parent?: string | null;
}) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    try {
        const item = await Explorer.create({
            name: data.name,
            type: data.type,
            projectId: data.projectId,
            parent: data.parent || null,
        });
        return JSON.parse(JSON.stringify(item));
    } catch (error: any) {
        if (error.code === 11000) {
            throw new Error(`An item with name "${data.name}" already exists in this location.`);
        }
        throw new Error(error.message || "Failed to create item.");
    }
}

export async function getExplorerItems(projectId: string, parentId: string | null = null) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    const items = await Explorer.find({ projectId, parent: parentId || null }).sort({ type: 1, name: 1 });
    return JSON.parse(JSON.stringify(items));
}

export async function deleteExplorerItem(id: string) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    // If it's a folder, we might want to delete children too, but for now simple delete
    const item = await Explorer.findById(id);
    if (!item) throw new Error("Item not found");

    if (item.type === "folder") {
        // Recursive deletion (optional but recommended)
        await deleteChildren(id);
    }

    await Explorer.findByIdAndDelete(id);
    return { success: true };
}

async function deleteChildren(parentId: string) {
    const children = await Explorer.find({ parent: parentId });
    for (const child of children) {
        if (child.type === "folder") {
            await deleteChildren(child._id.toString());
        }
        await Explorer.findByIdAndDelete(child._id);
    }
}

export async function renameExplorerItem(id: string, newName: string) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    const item = await Explorer.findByIdAndUpdate(id, { name: newName }, { new: true });
    return JSON.parse(JSON.stringify(item));
}
