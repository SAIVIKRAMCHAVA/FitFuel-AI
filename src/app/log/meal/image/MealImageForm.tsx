"use client";

import { useActionState, useState } from "react";
import type { MealImageFormState } from "./page";

type MealImageFormProps = {
  action: (
    state: MealImageFormState,
    formData: FormData,
  ) => Promise<MealImageFormState>;
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_MB = MAX_IMAGE_BYTES / 1024 / 1024;

export function MealImageForm({ action }: MealImageFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [clientError, setClientError] = useState<string>();

  const error = clientError || state.error;

  return (
    <form
      action={formAction}
      className="space-y-3"
      onSubmit={(event) => {
        const form = event.currentTarget;
        const input = form.elements.namedItem("photo") as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
          event.preventDefault();
          setClientError("Choose a meal photo before analyzing.");
          return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
          event.preventDefault();
          setClientError(`Choose an image smaller than ${MAX_IMAGE_MB} MB.`);
          return;
        }

        setClientError(undefined);
      }}
    >
      <select
        name="mealType"
        className="w-full p-2 border rounded"
        disabled={isPending}
      >
        <option>BREAKFAST</option>
        <option>LUNCH</option>
        <option>DINNER</option>
        <option>SNACK</option>
      </select>
      <input
        type="datetime-local"
        name="at"
        className="w-full p-2 border rounded"
        disabled={isPending}
      />
      <input
        type="file"
        name="photo"
        accept="image/*"
        required
        className="w-full p-2 border rounded"
        disabled={isPending}
      />
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        className="px-4 py-2 rounded bg-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Analyzing..." : "Analyze & Save"}
      </button>
    </form>
  );
}
