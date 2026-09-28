import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormMessage({ error, success, className }: { error?: string; success?: string; className?: string }) {
  if (!error && !success) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
        error ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-green-600/40 bg-green-600/5 text-green-700 dark:text-green-400",
        className,
      )}
    >
      {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      <span>{error ?? success}</span>
    </div>
  );
}
