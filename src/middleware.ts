import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
    // In Better Auth 1.x, we can check for the session cookie directly
    // The default cookie name is "better-auth.session_token"
    const sessionToken = request.cookies.get("better-auth.session_token");

    const isSignInPage = request.nextUrl.pathname === "/signin";
    const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth");

    // If there's no session token and it's not the sign-in page or auth API, redirect to sign-in
    if (!sessionToken && !isSignInPage && !isAuthApi) {
        return NextResponse.redirect(new URL("/signin", request.url));
    }

    // If there's a session token and the user is on the sign-in page, redirect to home
    if (sessionToken && isSignInPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
