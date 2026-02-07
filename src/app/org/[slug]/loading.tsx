import { Skeleton } from "@/components/ui/skeleton";

export default function OrgSlugLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-16" />
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Issue list */}
      <div className="flex-1">
        <div className="space-y-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b px-4 py-3">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-3 w-10 shrink-0" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
