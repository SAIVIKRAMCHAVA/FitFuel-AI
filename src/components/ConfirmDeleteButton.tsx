"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type ConfirmDeleteButtonProps = {
  label: string;
  message: string;
  className?: string;
};

export function ConfirmDeleteButton({
  label,
  message,
  className,
}: ConfirmDeleteButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded text-red-600 opacity-0 transition hover:bg-red-50 hover:text-red-700 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-60 group-hover/actions:opacity-100 dark:hover:bg-red-950/40",
        className,
      )}
    >
      <Trash2 className={cn("h-4 w-4", pending && "animate-pulse")} />
    </button>
  );
}
