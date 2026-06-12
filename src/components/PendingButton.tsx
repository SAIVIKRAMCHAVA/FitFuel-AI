"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type PendingButtonProps = ButtonProps & {
  pendingText?: string;
};

export function PendingButton({
  children,
  disabled,
  pendingText = "Loading...",
  ...props
}: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
