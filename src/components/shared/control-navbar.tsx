"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/app/actions/project";
import { useProjectStore } from "@/store/useProjectStore";
import { authClient } from "@/lib/auth-client";
import { ModeToggle } from "./mode-toggle";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    HiOutlineBell,
    HiOutlineChevronDown,
    HiOutlineMenuAlt2,
    HiOutlineCube,
    HiOutlinePlus
} from "react-icons/hi";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ControlNavbarProps {
    onMenuClick: () => void;
}

export const ControlNavbar = ({ onMenuClick }: ControlNavbarProps) => {
    const router = useRouter();
    const { selectedProject, setSelectedProject, reset: resetProjectStore } = useProjectStore();
    const { data: session } = authClient.useSession();

    const { data: projects } = useQuery({
        queryKey: ["projects"],
        queryFn: () => getProjects(),
    });

    const handleSignOut = async () => {
        await authClient.signOut();
        resetProjectStore();
        router.push("/signin");
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-primary/10 bg-background/50 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        title="Open Menu"
                        className="lg:hidden h-10 w-10 text-muted-foreground"
                    >
                        <HiOutlineMenuAlt2 className="h-6 w-6" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                title="Select Active Project"
                                className="h-10 px-4 rounded-xl border border-primary/5 bg-muted/30 hover:bg-primary/5 flex items-center gap-2 group transition-all"
                            >
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                    <HiOutlineCube className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-sm font-black truncate max-w-[120px]">
                                        {selectedProject?.name || "Select Project"}
                                    </span>
                                </div>
                                <HiOutlineChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 border-primary/10 bg-card/95 backdrop-blur-xl shadow-2xl">
                            <DropdownMenuLabel className="px-3 pb-2 pt-1 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                Your Projects
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">{projects?.length || 0}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-primary/5 mx-2" />
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar my-1">
                                {projects?.map((project: any) => (
                                    <DropdownMenuItem
                                        key={project._id}
                                        onClick={() => setSelectedProject(project)}
                                        className={cn(
                                            "rounded-xl px-3 py-3 cursor-pointer flex items-center justify-between transition-all mt-1",
                                            selectedProject?._id === project._id ? "bg-primary/10 text-primary font-bold" : "hover:bg-primary/5"
                                        )}
                                    >
                                        <span className="truncate">{project.name}</span>
                                        <span className="text-[10px] font-mono opacity-50">#{project.joinToken}</span>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                            <DropdownMenuSeparator className="bg-primary/5 mx-2" />
                            <DropdownMenuItem
                                onClick={() => router.push("/create-project")}
                                className="mt-1 rounded-xl px-3 py-3 cursor-pointer bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-transform"
                            >
                                <HiOutlinePlus />
                                Create New
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-4">
                    <ModeToggle />

                    <Button
                        variant="ghost"
                        size="icon"
                        title="Notifications"
                        className="relative h-10 w-10 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <HiOutlineBell className="h-6 w-6" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                title="User Profile"
                                className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary/20"
                            >
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {session?.user?.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-primary/10 bg-card/95 backdrop-blur-xl shadow-2xl">
                            <div className="flex items-center gap-3 p-3">
                                <Avatar className="h-10 w-10 shadow-lg">
                                    <AvatarImage src={session?.user?.image || ""} />
                                    <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black truncate">{session?.user?.name}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</span>
                                </div>
                            </div>
                            <DropdownMenuSeparator className="bg-primary/5 mx-2" />
                            <DropdownMenuItem onClick={() => router.push("/profile")} className="rounded-xl px-3 py-2.5 cursor-pointer mt-1">
                                Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/dashboard")} className="rounded-xl px-3 py-2.5 cursor-pointer mt-0.5">
                                Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-primary/5 mx-2" />
                            <DropdownMenuItem
                                onClick={handleSignOut}
                                className="rounded-xl px-3 py-2.5 cursor-pointer mt-0.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};
