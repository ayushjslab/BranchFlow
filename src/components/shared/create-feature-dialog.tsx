"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFeature, getProjectMembers } from "@/app/actions/task";
import { authClient } from "@/lib/auth-client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, AlertCircle, AlertTriangle, Info, User as UserIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CreateFeatureDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    blobId: string;
    blobName: string;
}

export const CreateFeatureDialog = ({
    isOpen,
    onClose,
    projectId,
    blobId,
    blobName
}: CreateFeatureDialogProps) => {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [dueDate, setDueDate] = useState("");
    const [assignee, setAssignee] = useState("");

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => getProjectMembers(projectId),
        enabled: isOpen,
    });

    const { data: session } = authClient.useSession();
    const currentUserRole = members?.find((m: any) => m.userId === session?.user?.id)?.role;

    const filteredMembers = members?.filter((member: any) => {
        if (currentUserRole === "manager") {
            // Managers can only assign features to members and other managers
            return member.role === "member" || member.role === "manager";
        }
        return true; // Owners can assign to anyone
    });

    const mutation = useMutation({
        mutationFn: createFeature,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["features", projectId, blobId] });
            toast.success("Feature announced successfully");
            onClose();
            setName("");
            setDescription("");
            setPriority("medium");
            setDueDate("");
            setAssignee("");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || !dueDate) {
            toast.error("Please fill in all required fields (Title, Message, Target Date)");
            return;
        }

        mutation.mutate({
            name,
            description,
            priority,
            dueDate: new Date(dueDate),
            assignee: assignee || undefined,
            projectId,
            blobId,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card/60 backdrop-blur-3xl border-violet-500/10">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 shadow-lg shadow-violet-500/5">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 text-left">
                            <DialogTitle className="text-xl font-black tracking-tight text-violet-500">Announce Feature</DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                                New capability in <span className="text-violet-500 font-black underline underline-offset-4">{blobName}</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Feature Title</Label>
                        <Input
                            id="name"
                            placeholder="What was implemented?"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 focus:ring-violet-500/20 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Execution Details</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the new capabilities and how to use them..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-violet-500/5 border-violet-500/10 rounded-xl min-h-[120px] focus:ring-violet-500/20 transition-all font-medium resize-none text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Priority</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 hover:bg-violet-500/10 transition-all">
                                    <SelectValue placeholder="Impact" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-violet-500/10">
                                    <SelectItem value="low" className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <Info className="w-3.5 h-3.5" />
                                            <span>Low</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medium" className="text-amber-500 focus:text-amber-500 focus:bg-amber-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span>Medium</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="high" className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>High</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Target Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer scheme-dark"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Responsible Agent</Label>
                        <Select value={assignee} onValueChange={setAssignee} disabled={isLoadingMembers}>
                            <SelectTrigger className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 hover:bg-violet-500/10 transition-all font-medium">
                                <SelectValue placeholder={isLoadingMembers ? "Sync..." : "Assigned"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-violet-500/10">
                                {filteredMembers?.map((member: any) => (
                                    <SelectItem key={member.userId || member.id || member._id} value={member.userId || member.id || member._id}>
                                        <div className="flex items-center gap-2 py-0.5 text-left">
                                            <Avatar className="h-6 w-6 border border-violet-500/10">
                                                <AvatarImage src={member.image} />
                                                <AvatarFallback className="text-[10px] bg-violet-500/10 font-black">
                                                    {member.name?.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black tracking-tight">{member.name}</span>
                                                <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest">{member.role}</span>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4 flex items-center justify-between sm:justify-between w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest opacity-40 hover:opacity-100 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-xl px-10 h-11 font-black uppercase text-[11px] tracking-widest bg-violet-600 text-white shadow-2xl shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Updating
                                </>
                            ) : (
                                "Announce Feature"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
