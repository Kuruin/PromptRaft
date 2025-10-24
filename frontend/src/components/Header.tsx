import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-mono">
            Prompt Raft
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/prompt-refine" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Prompt Refiner
          </Link>
          <ThemeToggle />
          <Button asChild variant="ocean">
            <Link to="/prompt-refine">Try Now</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
