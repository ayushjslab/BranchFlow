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
        members: [{ userId: session.user.id, role: "member" }],
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
            { "members.userId": session.user.id }
        ]
    }).sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(projects));
}

export async function joinProject(joinToken: string, projectId: string) {
    await connectToDatabase();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    const project = await Project.findOne({ _id: projectId, joinToken });

    if (!project) {
        throw new Error("Project not found or invalid join code.");
    }

    if (project.ownerId === session.user.id || project.members.some(m => m.userId === session.user.id)) {
        throw new Error("You are already a member of this project.");
    }

    project.members.push({ userId: session.user.id, role: "member" });
    await project.save();

    revalidatePath("/dashboard");
    revalidatePath("/members/join");

    return JSON.parse(JSON.stringify(project));
}
