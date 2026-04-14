import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/github/auth?projectId=xxx
 * Redirects the user to GitHub OAuth to get a repo-scoped access token.
 * The projectId is passed via the OAuth `state` parameter and retrieved in the callback.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`,
        scope: "repo",
        state: projectId,
    });

    return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
