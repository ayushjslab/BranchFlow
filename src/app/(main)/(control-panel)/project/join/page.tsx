"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineUserAdd, HiOutlineHashtag, HiOutlineArrowRight } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinProject } from "@/app/actions/project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";

export default function JoinProjectPage() {
    const [code, setCode] = useState("");
    const [projectId, setProjectId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { setSelectedProject } = useProjectStore();

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length < 6) {
            toast.error("Please enter a valid 6-digit join code.");
            return;
        }

        setIsLoading(true);
        try {
            const project = await joinProject(code, projectId || undefined);
            toast.success(`Successfully joined ${project.name}!`);
            setSelectedProject(project);
            router.push("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to join project. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 text-primary mb-6 shadow-xl shadow-primary/5">
                    <HiOutlineUserAdd className="w-12 h-12" />
                </div>
                <h1 className="text-4xl font-black tracking-tight mb-4 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                    Join a Project
                </h1>
                <p className="text-muted-foregrouJirand text-lg max-w-md mx-auto">
                    Collaborate with your team by entering the unique 6-digit project join code.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-2xl border border-primary/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <HiOutlineHashtag className="w-32 h-32 rotate-12" />
                </div>

                <form onSubmit={handleJoin} className="space-y-6 relative z-10">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                            Project ID (Optional Verification)
                        </label>
                        <div className="relative group/input">
                            <Input
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                placeholder="Paste Project ID here"
                                className="h-14 rounded-2xl border-primary/10 bg-primary/5 focus:bg-background transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                            Project Join Code
                        </label>
                        <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground group-focus-within/input:text-primary transition-colors">
                                <HiOutlineHashtag className="w-6 h-6" />
                            </div>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="E.g. 123456"
                                maxLength={6}
                                className="pl-14 h-16 text-2xl font-mono tracking-[0.5em] rounded-2xl border-primary/10 bg-primary/5 focus:bg-background transition-all"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || code.length < 6}
                        className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <div className="h-6 w-6 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <>
                                Join Project
                                <HiOutlineArrowRight className="w-6 h-6" />
                            </>
                        )}
                    </Button>
                </form>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center mt-8 text-sm text-muted-foreground"
            >
                Don&apos;t have a code? Ask your project owner to share the 6-digit join token from their dashboard.
            </motion.p>
        </div>
    );
}
