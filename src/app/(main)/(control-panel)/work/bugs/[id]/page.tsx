"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getBugById, getProjectMembers } from "@/app/actions/task";
import { getBugComments, sendBugComment, deleteBugComment } from "@/app/actions/bug-discussion";
import { authClient } from "@/lib/auth-client";
import {
    Send,
    Trash2,
    AtSign,
    Hash,
    MoreHorizontal,
    MessageSquare,
    Bug as BugIcon,
    Calendar,
    User,
    ChevronLeft,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const BugDiscussionPage = () => {
    const params = useParams();
    const router = useRouter();
    const bugId = params.id as string;
    const [message, setMessage] = useState("");
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const queryClient = useQueryClient();
    const { data: session } = authClient.useSession();

    /* ===== Queries ===== */
    const { data: bug, isLoading: isBugLoading } = useQuery({
        queryKey: ["bug", bugId],
        queryFn: () => getBugById(bugId),
    });

    const { data: comments, isLoading: isCommentsLoading } = useQuery({
        queryKey: ["bug-comments", bugId],
        queryFn: () => getBugComments(bugId),
        refetchInterval: 3000, // Poll every 3 seconds for Slack-like real-time feel
    });

    const { data: members } = useQuery({
        queryKey: ["bug-project-members", bug?.projectId],
        queryFn: () => getProjectMembers(bug.projectId),
        enabled: !!bug?.projectId,
    });

    /* ===== Mutations ===== */
    const sendMutation = useMutation({
        mutationFn: sendBugComment,
        onSuccess: () => {
            setMessage("");
            queryClient.invalidateQueries({ queryKey: ["bug-comments", bugId] });
            scrollToBottom();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBugComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bug-comments", bugId] });
            toast.success("Comment deleted");
        },
    });

    /* ===== Handlers ===== */
    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim()) return;

        // Simple mention detection
        const mentions = members
            ?.filter((m: any) => message.includes(`@${m.name}`))
            .map((m: any) => m.userId) || [];

        sendMutation.mutate({ bugId, content: message, mentions });
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setMessage(val);

        const lastChar = val[val.length - 1];
        const lastWord = val.split(/\s/).pop() || "";

        if (lastWord.startsWith("@")) {
            setIsMentionOpen(true);
            setMentionFilter(lastWord.slice(1).toLowerCase());
        } else {
            setIsMentionOpen(false);
        }
    };

    const insertMention = (member: any) => {
        const words = message.split(/\s/);
        words.pop(); // Remove the @mention part
        const newVal = words.join(" ") + (words.length > 0 ? " " : "") + `@${member.name} `;
        setMessage(newVal);
        setIsMentionOpen(false);
        inputRef.current?.focus();
    };

    if (isBugLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading discussion...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <BugIcon className="w-4 h-4 text-rose-500" />
                            <h1 className="text-lg font-bold tracking-tight">{bug?.name}</h1>
                            <div className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                bug?.priority === "high" ? "bg-rose-500/10 text-rose-500" :
                                    bug?.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
                                        "bg-sky-500/10 text-sky-500"
                            )}>
                                {bug?.priority}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[400px]">
                            {bug?.description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 pr-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Status</span>
                        <span className="text-xs font-bold capitalize">{bug?.status}</span>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Due Date</span>
                        <span className="text-xs font-bold">
                            {bug?.dueDate ? format(new Date(bug.dueDate), "MMM d, yyyy") : "No date"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Discussion Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
                {comments?.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 py-20">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-black uppercase tracking-widest">No Discussion Yet</p>
                            <p className="text-sm">Start the conversation about this bug below.</p>
                        </div>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {comments?.map((comment: any, index: number) => {
                        const isMe = comment.userId === session?.user?.id;
                        const prevComment = comments[index - 1];
                        const showAvatar = !prevComment || prevComment.userId !== comment.userId ||
                            (new Date(comment.createdAt).getTime() - new Date(prevComment.createdAt).getTime() > 300000);

                        return (
                            <motion.div
                                key={comment._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "group flex gap-3",
                                    !showAvatar && "mt-[-16px] pl-[44px]"
                                )}
                            >
                                {showAvatar && (
                                    <Avatar className="w-8 h-8 shrink-0 mt-1 ring-2 ring-background ring-offset-2 ring-offset-border/20">
                                        <AvatarImage src={comment.user.image} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                            {comment.user.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                <div className="flex-1 min-w-0">
                                    {showAvatar && (
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-bold hover:underline cursor-pointer">
                                                {comment.user.name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/50 font-medium">
                                                {format(new Date(comment.createdAt), "h:mm a")}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2 group/msg">
                                        <div className={cn(
                                            "relative text-sm p-3 rounded-2xl bg-card border shadow-sm max-w-[85%] wrap-break-word leading-relaxed",
                                            isMe && "bg-primary/5 border-primary/10"
                                        )}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: comment.content.replace(
                                                        /@(\w+)/g,
                                                        '<span class="text-primary font-bold hover:underline cursor-pointer">@$1</span>'
                                                    )
                                                }}
                                            />
                                        </div>

                                        <div className="opacity-0 group-hover/msg:opacity-100 flex items-center gap-1 transition-opacity pt-1">
                                            {isMe && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                                    onClick={() => deleteMutation.mutate(comment._id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-6 pt-0 mt-auto">
                <div className="relative bg-background border rounded-3xl shadow-xl p-2 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                    {/* Mention Dropdown */}
                    <AnimatePresence>
                        {isMentionOpen && members && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-4 w-64 bg-card border rounded-2xl shadow-2xl overflow-hidden z-50 py-2"
                            >
                                <div className="px-3 py-2 border-b mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Mention someone</p>
                                </div>
                                {members
                                    .filter((m: any) => m.name.toLowerCase().includes(mentionFilter))
                                    .map((member: any) => (
                                        <button
                                            key={member.userId}
                                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors text-left group"
                                            onClick={() => insertMention(member)}
                                        >
                                            <Avatar className="w-6 h-6 shrink-0 ring-1 ring-border group-hover:ring-primary/30">
                                                <AvatarImage src={member.image} />
                                                <AvatarFallback className="text-[8px] font-bold uppercase">{member.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs font-bold truncate">{member.name}</p>
                                                <p className="text-[9px] text-muted-foreground truncate uppercase tracking-[0.05em]">{member.role}</p>
                                            </div>
                                        </button>
                                    ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-end gap-2 px-2 py-1">
                        <div className="flex items-center gap-1 pb-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                                <AtSign className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                                <Hash className="w-4 h-4" />
                            </Button>
                        </div>

                        <textarea
                            ref={inputRef}
                            value={message}
                            onChange={handleInput}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !isMentionOpen) {
                                    e.preventDefault();
                                    handleSend();
                                }
                                if (e.key === "Escape") setIsMentionOpen(false);
                            }}
                            placeholder="Message #discussion"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-48 scrollbar-none outline-none"
                            rows={1}
                        />

                        <Button
                            size="icon"
                            disabled={!message.trim() || sendMutation.isPending}
                            onClick={() => handleSend()}
                            className={cn(
                                "w-10 h-10 rounded-2xl shadow-lg transition-all active:scale-95",
                                message.trim() ? "bg-primary shadow-primary/20" : "bg-muted text-muted-foreground"
                            )}
                        >
                            {sendMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 ml-0.5" />
                            )}
                        </Button>
                    </div>

                    <div className="px-4 py-1 flex items-center justify-between border-t mt-1 opacity-50">
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-medium flex items-center gap-1 italic">
                                <b>Shift + Enter</b> to add a new line
                            </span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                            Discussion Mode
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugDiscussionPage;