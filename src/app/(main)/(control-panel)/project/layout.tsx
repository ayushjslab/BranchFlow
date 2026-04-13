import React from 'react'

const ProjectLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col h-full w-full">{children}</div>
    )
}

export default ProjectLayout