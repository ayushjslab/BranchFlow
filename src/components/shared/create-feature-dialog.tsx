"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFeature, getProjectMembers } from "@/app/actions/task";
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
    const [addedBy, setAddedBy] = useState("");
    const [assignee, setAssignee] = useState("");
    const [dueDate, setDueDate] = useState("");

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => getProjectMembers(projectId),
        enabled: isOpen,
    });

    const mutation = useMutation({
        mutationFn: createFeature,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId, blobId] });
            toast.success("Feature proposal submitted");
            onClose();
            setName("");
            setDescription("");
            setPriority("medium");
            setAddedBy("");
            setAssignee("");
            setDueDate("");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || !addedBy || !dueDate) {
            toast.error("Please fill in all required fields (Name, Description, Creator, Deadline)");
            return;
        }

        mutation.mutate({
            name,
            description,
            priority,
            addedBy,
            assignee: assignee || undefined,
            dueDate: new Date(dueDate),
            projectId,
            blobId,
            status: "planning"
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card/60 backdrop-blur-3xl border-violet-500/10">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 shadow-lg shadow-violet-500/5">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-0.5 text-left">
                            <DialogTitle className="text-xl font-black tracking-tight text-violet-500">Feature Proposal</DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                                Expand capabilities of <span className="text-violet-500 font-black underline underline-offset-4">{blobName}</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Feature Title</Label>
                        <Input
                            id="name"
                            placeholder="Envision the new capability..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 focus:ring-violet-500/20 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Vision & Specs</Label>
                        <Textarea
                            id="description"
                            placeholder="Detail the requirements and user benefits..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-violet-500/5 border-violet-500/10 rounded-xl min-h-[100px] focus:ring-violet-500/20 transition-all font-medium resize-none text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Strategic Priority</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 hover:bg-violet-500/10 transition-all">
                                    <SelectValue placeholder="Impact" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-violet-500/10">
                                    <SelectItem value="low" className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <Info className="w-3.5 h-3.5" />
                                            <span>Incremental</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medium" className="text-amber-500 focus:text-amber-500 focus:bg-amber-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span>Evolutionary</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="high" className="text-violet-500 focus:text-violet-500 focus:bg-violet-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Revolutionary</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Added By</Label>
                            <Select value={addedBy} onValueChange={setAddedBy} disabled={isLoadingMembers}>
                                <SelectTrigger className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 hover:bg-violet-500/10 transition-all">
                                    <SelectValue placeholder={isLoadingMembers ? "Sync..." : "Visionary"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-violet-500/10">
                                    {members?.map((member: any) => (
                                        <SelectItem key={member.userId || member.id || member._id} value={member.userId || member.id || member._id}>
                                            <div className="flex items-center gap-2 py-0.5">
                                                <Avatar className="h-6 w-6 border border-violet-500/10">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="text-[10px] bg-violet-500/10 font-black">
                                                        {member.name?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-xs font-black tracking-tight">{member.name}</span>
                                                    <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest">{member.role}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Lead (Optional)</Label>
                            <Select value={assignee} onValueChange={setAssignee} disabled={isLoadingMembers}>
                                <SelectTrigger className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 hover:bg-violet-500/10 transition-all">
                                    <SelectValue placeholder={isLoadingMembers ? "Sync..." : "Assigned"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-violet-500/10">
                                    {members?.map((member: any) => (
                                        <SelectItem key={member.userId || member.id || member._id} value={member.userId || member.id || member._id}>
                                            <div className="flex items-center gap-2 py-0.5">
                                                <Avatar className="h-6 w-6 border border-violet-500/10">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="text-[10px] bg-violet-500/10 font-black">
                                                        {member.name?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-xs font-black tracking-tight">{member.name}</span>
                                                    <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest">{member.role}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-xs font-black uppercase tracking-[0.15em] text-violet-500/40 ml-1">Proposed Deadline</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="bg-violet-500/5 border-violet-500/10 rounded-xl h-11 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer scheme-dark"
                        />
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
                                    Optimizing
                                </>
                            ) : (
                                "Initiate Feature"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
