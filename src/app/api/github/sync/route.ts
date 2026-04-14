import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/project";
import Explorer from "@/models/explorer";
import UserGithubToken from "@/models/user-github-token";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * POST /api/github/sync
 * Body: { projectId, owner, repo }
 *
 * Reads the user's stored GitHub access token, fetches the full file tree for
 * the given repo, and populates the Explorer collection for this project.
 *
 * Sets githubSync = true after a successful sync (one-time operation per project).
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { projectId, owner, repo } = body;

        if (!projectId || !owner || !repo) {
            return NextResponse.json({ error: "Missing required fields: projectId, owner, repo" }, { status: 400 });
        }

        await connectToDatabase();

        const project = await Project.findById(projectId);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only the project owner can trigger sync
        if (project.ownerId !== session.user.id) {
            return NextResponse.json({ error: "Only the project owner can sync GitHub" }, { status: 403 });
        }

        // Prevent re-sync if already done
        if (project.githubSync) {
            return NextResponse.json({ error: "This project has already been synced. GitHub sync is a one-time operation." }, { status: 400 });
        }

        // Look up the user's stored GitHub token
        const tokenRecord = await UserGithubToken.findOne({ userId: session.user.id });
        if (!tokenRecord) {
            return NextResponse.json({ error: "GitHub not connected. Please authenticate with GitHub first." }, { status: 400 });
        }

        // Fetch the full repo tree from GitHub
        const treeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
            {
                headers: {
                    Authorization: `Bearer ${tokenRecord.accessToken}`,
                    Accept: "application/vnd.github+json",
                },
            }
        );

        if (!treeRes.ok) {
            const errText = await treeRes.text();
            console.error("GitHub API error:", errText);
            return NextResponse.json(
                { error: `GitHub API error: ${treeRes.statusText}` },
                { status: treeRes.status }
            );
        }

        const treeData = await treeRes.json();
        const treeItems: { path: string; type: string }[] = treeData.tree || [];

        // Clear existing explorer items for this project before importing
        await Explorer.deleteMany({ projectId });

        // Build a path → _id map so we can set parent references
        const pathIdMap: Record<string, string> = {};

        // Process folders first (sorted by depth), then blobs
        const folders = treeItems
            .filter((t) => t.type === "tree")
            .sort((a, b) => a.path.split("/").length - b.path.split("/").length);
        const blobs = treeItems.filter((t) => t.type === "blob");

        for (const item of [...folders, ...blobs]) {
            const parts = item.path.split("/");
            const name = parts[parts.length - 1];
            const parentPath = parts.slice(0, -1).join("/");
            const parentId = parentPath ? pathIdMap[parentPath] : null;

            const explorerItem = await Explorer.create({
                name,
                type: item.type === "tree" ? "folder" : "blob",
                projectId,
                parent: parentId || null,
            });

            pathIdMap[item.path] = explorerItem._id.toString();
        }

        // Mark sync as complete (githubSync = true means "already synced — don't allow again")
        await Project.findByIdAndUpdate(projectId, {
            githubOwner: owner,
            githubRepo: repo,
            githubSync: true,
        });

        return NextResponse.json({
            success: true,
            message: `Synced ${treeItems.length} items from ${owner}/${repo}`,
            count: treeItems.length,
        });
    } catch (error: any) {
        console.error("GitHub sync error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
