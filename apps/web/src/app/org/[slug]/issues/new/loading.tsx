import { Skeleton } from "@/components/ui/skeleton";

export default function NewIssueLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-lg space-y-4">
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
