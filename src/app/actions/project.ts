"use server";

import Project from "@/models/project";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";

export async function createProject(formData: { name: string; description?: string }) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    const { name, description } = formData;

    const project = await Project.create({
        ownerId: session.user.id,
        name,
        description,
        members: [session.user.id],
    });

    revalidatePath("/create-project");
    return JSON.parse(JSON.stringify(project));
}

export async function getProjects() {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    const projects = await Project.find({
        $or: [
            { ownerId: session.user.id },
            { members: session.user.id }
        ]
    }).sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(projects));
}
