import Link from "next/link";
import { Button } from "@/components/ui/button";

export function WelcomeAuthPrompt() {
  return (
    <div className="max-w-lg mx-auto py-24 text-center space-y-4">
      <h1 className="text-3xl font-bold">Welcome to FitFuel AI</h1>
      <p className="text-muted-foreground">
        Track meals, water and weight - then get a weekly plan powered by AI.
      </p>
      <div className="flex gap-2 justify-center">
        <Link href="/auth/login">
          <Button>Login</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="secondary">Create account</Button>
        </Link>
      </div>
    </div>
  );
}
