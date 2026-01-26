/* frontend/src/components/InitialLoadingSkeleton.jsx */
import React from 'react';
import Skeleton from './Skeleton';

const InitialLoadingSkeleton = () => {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 pb-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">

            {/* Header Title (Desktop) */}
            <div className="hidden md:block mb-8 mt-10 md:mt-0">
                <Skeleton className="h-10 w-48" />
            </div>

            {/* Stat Cards Grid */}
            <div className="mt-6 sm:mt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/5 border border-glass-border p-6 rounded-2xl flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" /> {/* Icon bg placeholder */}
                        <div className="flex flex-col gap-2 flex-1">
                            <Skeleton className="h-4 w-24" /> {/* Title placeholder */}
                            <Skeleton className="h-6 w-16" /> {/* Value placeholder */}
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumen de Hoy (Nutrition Circles) */}
            <div className="bg-white/5 border border-glass-border p-6 rounded-2xl mb-6">
                <Skeleton className="h-7 w-40 mb-6" /> {/* Section Title */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="w-24 h-24 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column */}
                <div className="flex flex-col gap-6">
                    {/* Routines */}
                    <div className="bg-white/5 border border-glass-border p-6 rounded-2xl flex flex-col gap-4">
                        <Skeleton className="h-7 w-48" />
                        <div className="flex flex-col gap-3">
                            <Skeleton className="h-16 w-full rounded-md" />
                            <Skeleton className="h-16 w-full rounded-md" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-md" />
                    </div>

                    {/* Cardio */}
                    <div className="bg-white/5 border border-glass-border p-6 rounded-2xl flex flex-col gap-4">
                        <Skeleton className="h-7 w-32" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (Weight) */}
                <div className="bg-white/5 border border-glass-border p-6 rounded-2xl flex flex-col gap-4">
                    <Skeleton className="h-7 w-40" />
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-48" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-32 mb-2" />
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-md" />
                        ))}
                    </div>
                    <Skeleton className="h-12 w-full rounded-md mt-2" />
                </div>
            </div>
        </div>
    );
};

export default InitialLoadingSkeleton;