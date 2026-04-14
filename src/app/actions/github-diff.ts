"use server";

import { connectToDatabase } from "@/lib/db";
import Explorer from "@/models/explorer";
import Project from "@/models/project";
import UserGithubToken from "@/models/user-github-token";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type DiffStatus = "added" | "removed" | "unchanged";

export interface DiffItem {
    path: string;
    type: "blob" | "folder";
    status: DiffStatus;
}

/**
 * getGithubDiff
 * Computes the diff between the saved Explorer items in the DB and the current
 * state of the GitHub repository for a given project.
 *
 * Returns a flat list of DiffItem sorted: folders first, then blobs, alphabetically.
 */
export async function getGithubDiff(projectId: string): Promise<DiffItem[]> {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const project = await Project.findById(projectId).lean();
    if (!project) throw new Error("Project not found");

    const projectOwner = project.ownerId;
    if (projectOwner !== session.user.id) throw new Error("Only the project owner can view the GitHub diff");

    if (!(project as any).githubOwner || !(project as any).githubRepo) {
        throw new Error("This project has not been synced with GitHub yet. Please sync first.");
    }

    const tokenRecord = await UserGithubToken.findOne({ userId: session.user.id }).lean();
    if (!tokenRecord) throw new Error("GitHub not connected. Please authenticate first.");

    // ─── 1. Flatten saved DB tree to paths ───────────────────────────────────
    const allDbItems = await Explorer.find({ projectId }).lean();

    // Build id → name map and id → parentId map
    const idToName: Record<string, string> = {};
    const idToParent: Record<string, string | null> = {};
    const idToType: Record<string, "blob" | "folder"> = {};

    for (const item of allDbItems) {
        const id = item._id.toString();
        idToName[id] = item.name;
        idToParent[id] = item.parent ? item.parent.toString() : null;
        idToType[id] = item.type;
    }

    function buildPath(id: string): string {
        const parts: string[] = [];
        let current: string | null = id;
        while (current) {
            parts.unshift(idToName[current]);
            current = idToParent[current] ?? null;
        }
        return parts.join("/");
    }

    const dbPaths = new Map<string, "blob" | "folder">();
    for (const item of allDbItems) {
        const path = buildPath(item._id.toString());
        dbPaths.set(path, item.type);
    }

    // ─── 2. Fetch GitHub tree ─────────────────────────────────────────────────
    const owner = (project as any).githubOwner as string;
    const repo = (project as any).githubRepo as string;

    const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
        {
            headers: {
                Authorization: `Bearer ${(tokenRecord as any).accessToken}`,
                Accept: "application/vnd.github+json",
            },
        }
    );

    if (!treeRes.ok) {
        throw new Error(`GitHub API error: ${treeRes.statusText}`);
    }

    const treeData = await treeRes.json();
    const githubTree: { path: string; type: string }[] = treeData.tree || [];

    const githubPaths = new Map<string, "blob" | "folder">();
    for (const item of githubTree) {
        githubPaths.set(item.path, item.type === "tree" ? "folder" : "blob");
    }

    // ─── 3. Compute diff ─────────────────────────────────────────────────────
    const allPaths = new Set([...dbPaths.keys(), ...githubPaths.keys()]);
    const result: DiffItem[] = [];

    for (const path of allPaths) {
        const inDb = dbPaths.has(path);
        const inGithub = githubPaths.has(path);
        const type = githubPaths.get(path) ?? dbPaths.get(path) ?? "blob";

        let status: DiffStatus;
        if (inDb && inGithub) status = "unchanged";
        else if (inGithub && !inDb) status = "added"; // new in GitHub, not in our DB
        else status = "removed"; // in our DB but deleted from GitHub

        result.push({ path, type, status });
    }

    // Sort: folders first, then alphabetically within each status group
    result.sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.path.localeCompare(b.path);
    });

    return result;
}
