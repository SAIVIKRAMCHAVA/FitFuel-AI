// path: src/components/AppNavbar.tsx
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pizza, Droplets, LayoutDashboard, CalendarDays } from "lucide-react";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
  >
    {children}
  </Link>
);

export default function AppNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="container h-14 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <Pizza className="h-5 w-5 text-primary" />
          <span>FitFuel AI</span>
        </Link>

        <nav className={cn("hidden md:flex items-center gap-6")}>
          <NavLink href="/dashboard">
            <LayoutDashboard className="h-4 w-4 inline mr-1" />
            Dashboard
          </NavLink>
          <NavLink href="/log/meal">
            <Pizza className="h-4 w-4 inline mr-1" />
            Log Meal
          </NavLink>
          <NavLink href="/log/water">
            <Droplets className="h-4 w-4 inline mr-1" />
            Water
          </NavLink>
          <NavLink href="/plan">
            <CalendarDays className="h-4 w-4 inline mr-1" />
            Plan
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/auth/login">
            <Button size="sm" variant="secondary">
              Account
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
