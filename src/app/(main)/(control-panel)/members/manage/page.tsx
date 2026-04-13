"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectMembers } from "@/app/actions/task";
import { updateMemberRole, removeMember } from "@/app/actions/project";
import { useProjectStore } from "@/store/useProjectStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, MoreVertical, Shield, User as UserIcon, Trash2, ArrowUpDown } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const ManageMembers = () => {
    const { selectedProject } = useProjectStore();
    const queryClient = useQueryClient();
    const { data: session } = authClient.useSession();

    const projectId = selectedProject?._id;
    const isOwner = selectedProject?.ownerId === session?.user?.id;

    const { data: members, isLoading } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => getProjectMembers(projectId!),
        enabled: !!projectId,
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: "manager" | "member" }) =>
            updateMemberRole(projectId!, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
            toast.success("Role updated successfully");
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) => removeMember(projectId!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
            toast.success("Member removed and tasks cleaned up");
        },
    });

    if (!selectedProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <div className="p-4 rounded-full bg-primary/5">
                    <UserIcon className="w-12 h-12 text-primary opacity-20" />
                </div>
                <h2 className="text-xl font-black opacity-50">No Project Selected</h2>
                <p className="text-sm text-muted-foreground">Select a project to manage its members.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8 h-full overflow-y-auto custom-scrollbar">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        Team management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage roles and access for <span className="text-primary font-bold">{selectedProject.name}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-primary/5 border-primary/10 font-bold uppercase tracking-wider text-[10px]">
                        {members?.length || 0} Total Members
                    </Badge>
                </div>
            </header>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                        <p className="text-sm font-bold opacity-30 uppercase tracking-widest">Loading Team...</p>
                    </div>
                ) : (
                    <div className="rounded-[2.5rem] border border-primary/10 bg-card/20 backdrop-blur-xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-primary/5 bg-primary/2">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">User</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Role</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">ID</th>
                                    {isOwner && <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest opacity-40">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                                {members?.map((member: any) => (
                                    <tr key={member.userId} className="group hover:bg-primary/2 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 ring-2 ring-background ring-offset-2 ring-offset-primary/10">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                        {member.name?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{member.name}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{member.userId === session?.user?.id ? "(You)" : ""}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-xs">
                                            <Badge className={cn(
                                                "px-3 py-1 rounded-full font-black uppercase tracking-tighter text-[9px] ring-1",
                                                member.role === "owner"
                                                    ? "bg-yellow-500/10 text-yellow-500 ring-yellow-500/20"
                                                    : member.role === "manager"
                                                        ? "bg-blue-500/10 text-blue-500 ring-blue-500/20"
                                                        : "bg-primary/10 text-primary ring-primary/20"
                                            )}>
                                                {member.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <code className="text-[10px] font-mono opacity-30 select-all">{member.userId}</code>
                                        </td>
                                        {isOwner && (
                                            <td className="px-6 py-5 text-right">
                                                {member.userId !== session?.user?.id && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-50 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl border-primary/10 bg-card/80 backdrop-blur-xl">
                                                            <DropdownMenuItem
                                                                onClick={() => updateRoleMutation.mutate({
                                                                    userId: member.userId,
                                                                    role: member.role === "manager" ? "member" : "manager"
                                                                })}
                                                                className="flex items-center gap-2 cursor-pointer font-bold"
                                                            >
                                                                <ArrowUpDown className="w-4 h-4" />
                                                                {member.role === "manager" ? "Demote to Member" : "Promote to Manager"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    if (confirm("Are you sure you want to remove this member? This will clear their task assignments.")) {
                                                                        removeMemberMutation.mutate(member.userId);
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer font-bold"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Remove Member
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageMembers;

// Helper function if not globally available
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}