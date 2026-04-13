"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createProject, getProjects } from "@/app/actions/project";
import { useProjectStore } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Briefcase, ChevronRight, Hash, Layers, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
        },
        onError: (error) => {
            console.error("Failed to create project:", error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        mutation.mutate({ name, description });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Hero Section */}
            <section className="text-center space-y-4 py-8">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-bold tracking-tight"
                >
                    Manage Your <span className="text-primary italic">Projects</span>
                </motion.h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Create a new workspace or select an existing one to continue your workflow.
                </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Create Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="border-primary/10 bg-card/50 backdrop-blur-md sticky top-24">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                New Project
                            </CardTitle>
                            <CardDescription>Launch a fresh workspace in seconds.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Project Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-12 border-primary/10 focus-visible:ring-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Description (Optional)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="h-12 border-primary/10 focus-visible:ring-primary/30"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                >
                                    {mutation.isPending ? "Creating..." : "Create Project"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Project List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Layers className="h-6 w-6 text-primary" />
                            Existing Projects
                        </h2>
                        <span className="text-sm text-muted-foreground font-medium bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                            {projects?.length || 0} Projects
                        </span>
                    </div>

                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-32 w-full rounded-2xl bg-muted/50 animate-pulse" />
                                ))
                            ) : projects?.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-primary/10 rounded-3xl">
                                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No projects found. Create your first one!</p>
                                </div>
                            ) : (
                                projects?.map((project: any, index: number) => (
                                    <motion.div
                                        key={project._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedProject(project)}
                                    >
                                        <Card
                                            className={cn(
                                                "group cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 overflow-hidden",
                                                selectedProject?._id === project._id ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-primary/10"
                                            )}
                                        >
                                            <CardContent className="p-0 flex flex-col sm:flex-row">
                                                <div className="flex-1 p-6 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-xl font-bold">{project.name}</h3>
                                                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                            <Hash className="h-3 w-3" />
                                                            {project.joinToken}
                                                        </div>
                                                    </div>
                                                    <p className="text-muted-foreground line-clamp-1">{project.description || "No description provided."}</p>
                                                    <div className="flex items-center gap-4 text-xs pt-2">
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <User className="h-3 w-3" />
                                                            {project.members.length} Members
                                                        </span>
                                                        <span className="text-muted-foreground/50 italic">
                                                            Created {new Date(project.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-12 bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                    <ChevronRight className={cn(
                                                        "h-5 w-5 transition-transform group-hover:translate-x-1",
                                                        selectedProject?._id === project._id ? "text-primary" : "text-muted-foreground"
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
    );
};

export default CreateProjectPage;