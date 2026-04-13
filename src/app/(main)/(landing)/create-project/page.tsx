"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createProject, getProjects } from "@/app/actions/project";
import { useProjectStore } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Briefcase, ChevronRight, Hash, Layers, Users, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Assuming you use Sonner for modern toasts

const CreateProjectPage = () => {
    const queryClient = useQueryClient();
    const { selectedProject, setSelectedProject } = useProjectStore();
    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");

    const { data: projects, isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: () => getProjects(),
    });

    const mutation = useMutation({
        mutationFn: createProject,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setName("");
            setDescription("");
            setSelectedProject(data);
            toast.success("Project launched successfully!");
        },
        onError: () => toast.error("Failed to create project"),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        mutation.mutate({ name, description });
    };

    return (
        <div className="relative min-h-screen">

            <div className="max-w-6xl mx-auto space-y-16 pb-20">
                {/* Hero Header */}
                <header className="relative pt-8 text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mx-auto w-fit rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-md"
                    >
                        <Sparkles className="mr-2 inline-block h-3.5 w-3.5" />
                        Workspace Management
                    </motion.div>
                    
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tighter"
                    >
                        Your <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Digital Empire</span>
                    </motion.h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                        Architecture your workflow by launching a new project or jumping back into an existing workspace.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Modern Action Sidebar */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 space-y-6"
                    >
                        <div className="group relative rounded-3xl border border-primary/10 bg-card/40 p-1 backdrop-blur-2xl transition-all hover:border-primary/20">
                            <div className="p-6 space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Plus className="h-5 w-5 text-primary" />
                                        </div>
                                        Fast Create
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Instantly provision a new project node.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-4">
                                        <Input
                                            placeholder="Project Identifier"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-12 bg-background/50 border-primary/5 focus:border-primary/30 transition-all rounded-xl"
                                        />
                                        <Textarea
                                            placeholder="Brief description..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[100px] bg-background/50 border-primary/5 focus:border-primary/30 rounded-xl resize-none"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={mutation.isPending}
                                        className="w-full h-12 rounded-xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                                    >
                                        {mutation.isPending ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            "Launch Project"
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Project Feed */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-muted">
                                    <Layers className="h-5 w-5 text-foreground" />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">Active Nodes</h2>
                            </div>
                            <div className="flex h-8 items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 text-xs font-semibold text-primary">
                                {projects?.length || 0} Total
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-32 w-full rounded-3xl bg-muted/40 animate-pulse border border-primary/5" />
                                    ))
                                ) : projects?.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-primary/10 rounded-[2rem] bg-muted/5"
                                    >
                                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                            <Briefcase className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">No architecture found. Start creating.</p>
                                    </motion.div>
                                ) : (
                                    projects?.map((project: any, index: number) => (
                                        <motion.div
                                            key={project._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            layout
                                        >
                                            <Card
                                                onClick={() => setSelectedProject(project)}
                                                className={cn(
                                                    "group relative cursor-pointer border-primary/5 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:scale-[1.01] hover:bg-card/50 rounded-3xl overflow-hidden",
                                                    selectedProject?._id === project._id ? "border-primary/40 bg-primary/3 shadow-2xl shadow-primary/5" : ""
                                                )}
                                            >
                                                {selectedProject?._id === project._id && (
                                                    <motion.div layoutId="active-glow" className="absolute inset-0 border-2 border-primary rounded-3xl opacity-20" />
                                                )}
                                                
                                                <CardContent className="p-8 flex items-center gap-6">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-2xl font-bold tracking-tight leading-none group-hover:text-primary transition-colors">
                                                                {project.name}
                                                            </h3>
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-[10px] font-bold uppercase text-muted-foreground">
                                                                <Hash className="h-2.5 w-2.5" />
                                                                {project.joinToken}
                                                            </span>
                                                        </div>
                                                        
                                                        <p className="text-muted-foreground line-clamp-1 text-sm">
                                                            {project.description || "Synthesizing project goals and milestones..."}
                                                        </p>

                                                        <div className="flex items-center gap-6">
                                                            <div className="flex -space-x-2">
                                                                {Array.from({ length: Math.min(project.members.length, 3) }).map((_, i) => (
                                                                    <div key={i} className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                                                                        <Users className="h-3 w-3" />
                                                                    </div>
                                                                ))}
                                                                {project.members.length > 3 && (
                                                                    <div className="h-7 w-7 rounded-full border-2 border-background bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                                                                        +{project.members.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                            <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest">
                                                                Created {new Date(project.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                                        selectedProject?._id === project._id ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
                                                    )}>
                                                        <ChevronRight className={cn(
                                                            "h-6 w-6 transition-transform group-hover:translate-x-1"
                                                        )} />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProjectPage;