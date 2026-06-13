"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { PendingButton } from "@/components/PendingButton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PlanGoalFormProps = {
  defaultGoal: string;
  action: (formData: FormData) => Promise<void>;
};

export function PlanGoalForm({ defaultGoal, action }: PlanGoalFormProps) {
  const hasSavedGoal = defaultGoal.trim().length > 0;
  const [isEditing, setIsEditing] = useState(!hasSavedGoal);

  return (
    <form action={action} className="rounded-lg border p-4">
      <div className="relative">
        <Textarea
          name="goal"
          defaultValue={defaultGoal}
          readOnly={!isEditing}
          placeholder="what are your goals?"
          maxLength={1000}
          className={cn(
            "min-h-24 pr-12 placeholder:text-muted-foreground/60",
            !isEditing && "resize-none bg-muted/30",
          )}
        />
        {hasSavedGoal && !isEditing && (
          <button
            type="button"
            aria-label="Edit goal"
            title="Edit goal"
            onClick={() => setIsEditing(true)}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mt-3 flex justify-end">
          <PendingButton type="submit" pendingText="Saving...">
            Save
          </PendingButton>
        </div>
      )}
    </form>
  );
}
