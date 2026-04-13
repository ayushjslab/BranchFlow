"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlineClipboardCopy,
    HiOutlineCheck,
    HiOutlineLockClosed,
    HiOutlineExclamation,
    HiOutlineShare,
    HiOutlineHashtag,
    HiOutlineLink
} from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/useProjectStore";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function InvitePage() {
    const { selectedProject } = useProjectStore();
    const { data: session } = authClient.useSession();
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    if (!selectedProject) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                    <HiOutlineExclamation className="w-12 h-12" />
                </div>
                <h1 className="text-2xl font-black mb-2">No Project Selected</h1>
                <p className="text-muted-foreground">Please select a project from the navbar to manage invitations.</p>
            </div>
        );
    }

    const isOwner = session?.user?.id === selectedProject.ownerId;
    const inviteLink = typeof window !== "undefined"
        ? `${window.location.origin}/${selectedProject._id}/join-project`
        : "";

    const copyToClipboard = async (text: string, type: "code" | "link") => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === "code") {
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
            } else {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            }
            toast.success(`${type === "code" ? "Join code" : "Invite link"} copied to clipboard!`);
        } catch (err) {
            toast.error("Failed to copy to clipboard.");
        }
    };

    if (!isOwner) {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-12 rounded-[2.5rem] bg-card/50 border border-primary/10 backdrop-blur-xl"
                >
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-orange-500/10 text-orange-500 mb-6">
                        <HiOutlineLockClosed className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-black mb-4">Owner Access Only</h1>
                    <p className="text-muted-foreground text-lg mb-8">
                        Only project owners can manage and share invite codes. Please contact the project owner if you need to invite team members.
                    </p>
                    <Button variant="outline" className="rounded-xl px-8" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                    <HiOutlineShare className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black tracking-tight mb-4 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                    Invite Team Members
                </h1>
                <p className="text-muted-foreground text-lg">
                    Share these credentials to bring your team into <span className="text-primary font-bold">{selectedProject.name}</span>.
                </p>
            </motion.div>

            <div className="grid gap-8">
                {/* Join Code Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="group relative overflow-hidden bg-card/50 backdrop-blur-2xl border border-primary/10 rounded-[2.5rem] p-8 shadow-2xl transition-all hover:shadow-primary/5"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary">
                                <HiOutlineHashtag className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Join Code</span>
                            </div>
                            <h2 className="text-4xl font-mono font-black tracking-widest">
                                {selectedProject.joinToken}
                            </h2>
                        </div>
                        <Button
                            onClick={() => copyToClipboard(selectedProject.joinToken, "code")}
                            className={cn(
                                "h-14 px-8 rounded-2xl font-black transition-all active:scale-[0.98]",
                                copiedCode ? "bg-green-500 hover:bg-green-600" : "bg-primary"
                            )}
                        >
                            {copiedCode ? (
                                <HiOutlineCheck className="w-6 h-6" />
                            ) : (
                                <HiOutlineClipboardCopy className="w-6 h-6 shrink-0 mr-2" />
                            )}
                            {copiedCode ? "Copied!" : "Copy Code"}
                        </Button>
                    </div>
                </motion.div>

                {/* Invite Link Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="group relative overflow-hidden bg-card/50 backdrop-blur-2xl border border-primary/10 rounded-[2.5rem] p-8 shadow-2xl transition-all hover:shadow-primary/5"
                >
                    <div className="space-y-6 relative z-10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary">
                                <HiOutlineLink className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Direct Link</span>
                            </div>
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 font-mono text-sm break-all">
                                {inviteLink}
                            </div>
                        </div>
                        <Button
                            onClick={() => copyToClipboard(inviteLink, "link")}
                            variant="secondary"
                            className={cn(
                                "w-full h-14 rounded-2xl font-black transition-all active:scale-[0.98]",
                                copiedLink ? "bg-green-500/10 text-green-500 border-green-500/20" : ""
                            )}
                        >
                            {copiedLink ? (
                                <HiOutlineCheck className="w-6 h-6 mr-2" />
                            ) : (
                                <HiOutlineClipboardCopy className="w-6 h-6 mr-2" />
                            )}
                            {copiedLink ? "Link Copied!" : "Copy Invite Link"}
                        </Button>
                    </div>
                </motion.div>

                {/* Security Note */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-4 p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-orange-600 dark:text-orange-400"
                >
                    <HiOutlineExclamation className="w-6 h-6 shrink-0" />
                    <div className="space-y-1">
                        <p className="font-bold text-sm uppercase tracking-wider">Security Note</p>
                        <p className="text-sm opacity-80 leading-relaxed font-semibold">
                            IMPORTANT: Keep this code and link secure. Share it only with trusted team members you want to grant access to <span className="underline decoration-2">{selectedProject.name}</span>. Don&apos;t share it publicly.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}