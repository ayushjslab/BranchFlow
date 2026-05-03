"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBug, getProjectMembers } from "@/app/actions/task";
import { authClient } from "@/lib/auth-client";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
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
import { Loader2, Bug, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CreateBugDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    blobId: string;
    blobName: string;
}

export const CreateBugDialog = ({
    isOpen,
    onClose,
    projectId,
    blobId,
    blobName,
}: CreateBugDialogProps) => {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("high");
    const [fixedBy, setFixedBy] = useState("");
    const [dueDate, setDueDate] = useState("");

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => getProjectMembers(projectId),
        enabled: isOpen,
    });

    const { data: session } = authClient.useSession();
    const currentUserRole = members?.find((m: any) => m.userId === session?.user?.id)?.role;
    const filteredMembers = members?.filter((member: any) => {
        if (currentUserRole === "manager") return member.role === "member" || member.role === "manager";
        return true;
    });

    const mutation = useMutation({
        mutationFn: createBug,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bugs", projectId, blobId] });
            toast.success("Bug report created");
            onClose();
            setName(""); setDescription(""); setPriority("high"); setFixedBy(""); setDueDate("");
        },
        onError: (error: any) => toast.error(error.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || !dueDate) {
            toast.error("Please fill in Name, Description and Deadline");
            return;
        }
        mutation.mutate({ name, description, priority, fixedBy: fixedBy || undefined, dueDate: new Date(dueDate), projectId, blobId, status: "pending" });
    };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
            <DrawerContent style={{ width: '50vw', maxWidth: '50vw' }} className="h-full top-0 bottom-0 right-0 left-auto rounded-none rounded-l-2xl border-l border-border flex flex-col bg-background">
                {/* Header */}
                <DrawerHeader className="border-b border-border px-6 py-5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <Bug className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 text-left">
                            <DrawerTitle className="text-lg font-black tracking-tight text-rose-500">Report Bug</DrawerTitle>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                                Issue in <span className="text-rose-500 font-black">{blobName}</span>
                            </p>
                        </div>
                    </div>
                </DrawerHeader>

                {/* Scrollable form body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bug Title</Label>
                            <Input
                                placeholder="Brief summary of the issue..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="rounded-xl h-11 font-medium bg-secondary/50 border-border focus-visible:ring-rose-500/30"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Steps to Reproduce</Label>
                            <Textarea
                                placeholder="Detail the steps to reproduce or behavior observed..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded-xl min-h-[140px] font-medium resize-none bg-secondary/50 border-border focus-visible:ring-rose-500/30"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Severity</Label>
                                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                    <SelectTrigger className="rounded-xl h-11 bg-secondary/50 border-border">
                                        <SelectValue placeholder="Criticality" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="low" className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10">
                                            <div className="flex items-center gap-2 font-bold text-xs"><Info className="w-3.5 h-3.5" /> Minor</div>
                                        </SelectItem>
                                        <SelectItem value="medium" className="text-amber-500 focus:text-amber-500 focus:bg-amber-500/10">
                                            <div className="flex items-center gap-2 font-bold text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Standard</div>
                                        </SelectItem>
                                        <SelectItem value="high" className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10">
                                            <div className="flex items-center gap-2 font-bold text-xs"><AlertCircle className="w-3.5 h-3.5" /> Critical</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resolution By</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="rounded-xl h-11 bg-secondary/50 border-border cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assigned Fixer <span className="opacity-40">(Optional)</span></Label>
                            <Select value={fixedBy} onValueChange={setFixedBy} disabled={isLoadingMembers}>
                                <SelectTrigger className="rounded-xl h-11 bg-secondary/50 border-border">
                                    <SelectValue placeholder={isLoadingMembers ? "Loading..." : "Select member"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {filteredMembers?.map((member: any) => (
                                        <SelectItem key={member.userId || member.id || member._id} value={member.userId || member.id || member._id}>
                                            <div className="flex items-center gap-2 py-0.5">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="text-[10px] font-black bg-rose-500/10">{member.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-xs font-bold">{member.name}</span>
                                                    <span className="text-[9px] opacity-50 uppercase">{member.role}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Footer */}
                    <DrawerFooter className="border-t border-border px-6 py-4 flex-row justify-between shrink-0">
                        <DrawerClose asChild>
                            <Button type="button" variant="ghost" className="rounded-xl font-bold text-muted-foreground">
                                Cancel
                            </Button>
                        </DrawerClose>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-xl px-8 h-11 font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20"
                        >
                            {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Report Bug"}
                        </Button>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
};
