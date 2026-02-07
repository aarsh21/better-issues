import { Skeleton } from "@/components/ui/skeleton";

export default function IssueDetailLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_220px]">
            {/* Main content */}
            <div className="space-y-6">
              <div>
                <Skeleton className="h-7 w-80 mb-3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-3 w-12" />
                <div className="flex flex-wrap gap-1.5">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
