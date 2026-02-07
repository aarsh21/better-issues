import { Skeleton } from "@/components/ui/skeleton";

export default function OrgLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-7 w-32" />
      </div>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
