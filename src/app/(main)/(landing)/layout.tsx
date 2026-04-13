import React from 'react'
import Navbar from '@/components/shared/navbar'

const LandingLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 pt-20 md:pt-24 px-4 md:px-6">
                <div className="container mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default LandingLayout
