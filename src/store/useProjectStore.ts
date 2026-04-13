import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectState {
    selectedProject: any | null;
    setSelectedProject: (project: any | null) => void;
    reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            selectedProject: null,
            setSelectedProject: (project) => set({ selectedProject: project }),
            reset: () => set({ selectedProject: null }),
        }),
        {
            name: "project-storage",
        }
    )
);
