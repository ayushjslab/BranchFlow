"use client";

import { FcGoogle } from "react-icons/fc";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

const SignInPage = () => {
    const searchParams = useSearchParams();
    const callbackURL = searchParams.get("callbackURL") || "/";

    const handleSignIn = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL,
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-primary/20 bg-card shadow-2xl shadow-primary/10">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Sign in to access your control panel
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Button
                        variant="outline"
                        className="h-12 w-full border-primary/30 hover:bg-primary/5 hover:text-primary"
                        onClick={handleSignIn}
                    >
                        <FcGoogle className="mr-2 h-5 w-5" />
                        Continue with Google
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                    <p>
                        By continuing, you agree to our{" "}
                        <span className="cursor-pointer font-medium text-primary hover:underline">
                            Terms of Service
                        </span>
                    </p>
                </CardFooter>
            </Card>
            {/* Dynamic Background Elements */}
            <div className="fixed -left-20 -top-20 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
            <div className="fixed -bottom-20 -right-20 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
        </div>
    );
};

export default SignInPage;