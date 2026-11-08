/* frontend/src/components/News/NewsLoadingSkeleton.jsx */
import React from 'react';

export default function NewsLoadingSkeleton({ isDetail = false }) {
  if (isDetail) {
    return (
      <div
        className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto custom-scrollbar animate-[fade-in_0.3s_ease-out]"
        style={{
          paddingTop: 'calc(var(--safe-top, 0px) + 1rem)',
          paddingBottom: 'calc(var(--safe-bottom, 0px) + 3rem)'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
          {/* Back bar */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-28 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
            </div>
          </div>

          {/* Badge & Title */}
          <div className="flex flex-col gap-3">
            <div className="h-5 w-24 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-10 w-4/5 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-5 w-2/3 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
          </div>

          {/* Author metadata */}
          <div className="flex items-center gap-3 py-2 border-y border-black/5 dark:border-white/5">
            <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3.5 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-3 w-44 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
            </div>
          </div>

          {/* Hero Image */}
          <div className="h-64 sm:h-96 w-full rounded-3xl bg-black/10 dark:bg-white/10 animate-pulse" />

          {/* Article content lines */}
          <div className="space-y-4 py-4">
            <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-5/6 animate-pulse" />
            <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-full animate-pulse" />
            <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-4/5 animate-pulse" />
            <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-2/3 animate-pulse" />
            <div className="h-32 bg-black/5 dark:bg-white/5 rounded-2xl w-full my-6 animate-pulse" />
            <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-full animate-pulse" />
            <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full w-3/4 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto custom-scrollbar animate-[fade-in_0.3s_ease-out]"
      style={{
        paddingTop: 'calc(var(--safe-top, 0px) + 1rem)',
        paddingBottom: 'calc(var(--safe-bottom, 0px) + 3rem)'
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="h-8 w-32 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-64 rounded-full bg-black/5 dark:bg-white/5 animate-pulse hidden sm:block" />
        </div>

        {/* Title & subtitle */}
        <div className="flex flex-col gap-3 py-2">
          <div className="h-5 w-44 rounded-full bg-accent/20 animate-pulse" />
          <div className="h-10 sm:h-12 w-3/4 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-1/2 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-hidden pb-2">
          {[80, 110, 95, 120, 90, 100].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded-full bg-black/10 dark:bg-white/10 animate-pulse shrink-0"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="glass p-0 rounded-[28px] overflow-hidden border border-black/5 dark:border-white/10 flex flex-col justify-between"
            >
              <div className="h-48 bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-3.5 w-20 rounded bg-accent/20 animate-pulse" />
                  <div className="h-5 w-full rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="h-3 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
