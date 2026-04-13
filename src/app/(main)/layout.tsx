import React from 'react'
import Navbar from '@/components/shared/navbar'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Navbar />
            {/* Added pt-20 (80px) to clear the fixed navbar height.
                Added px-4/6 to match the navbar's horizontal container spacing.
            */}
            <main className="flex-1 pt-20 md:pt-24 px-4 md:px-6">
                <div className="container mx-auto">
                    {children}
                </div>
            </main>
            
            {/* You might want a modern footer here later */}
        </div>
    )
}

export default MainLayout