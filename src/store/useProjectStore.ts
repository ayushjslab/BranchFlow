import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectState {
    selectedProject: any | null;
    setSelectedProject: (project: any | null) => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            selectedProject: null,
            setSelectedProject: (project) => set({ selectedProject: project }),
        }),
        {
            name: "project-storage",
        }
    )
);
