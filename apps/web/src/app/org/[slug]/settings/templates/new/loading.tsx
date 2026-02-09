import { Skeleton } from "@/components/ui/skeleton";

export default function NewTemplateLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="grid gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
