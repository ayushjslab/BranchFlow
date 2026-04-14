import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/project";
import UserGithubToken from "@/models/user-github-token";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/github/callback
 * GitHub redirects here after the user authorizes. We:
 * 1. Exchange the code for an access_token
 * 2. Save the token to UserGithubToken (keyed by userId) — persists across projects
 * 3. Redirect the user back to the workspace
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const projectId = searchParams.get("state"); // We passed projectId as state

    if (!code || !projectId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_error=missing_params`);
    }

    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_error=unauthorized`);
        }

        // Exchange code for access_token
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`,
            }),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.error || !tokenData.access_token) {
            console.error("GitHub token exchange failed:", tokenData);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_error=token_exchange_failed`);
        }

        await connectToDatabase();

        // Upsert: save/update token for this user (one token per user account)
        await UserGithubToken.findOneAndUpdate(
            { userId: session.user.id },
            { accessToken: tokenData.access_token },
            { upsert: true, new: true }
        );

        // Check the project still exists
        const project = await Project.findById(projectId);
        if (!project) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_error=project_not_found`);
        }

        // Redirect back to the workspace page so the user can proceed to sync
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/project/workspace?github_connected=1&projectId=${projectId}`
        );
    } catch (error) {
        console.error("GitHub OAuth callback error:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_error=server_error`);
    }
}
