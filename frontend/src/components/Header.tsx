import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles, Swords, Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 dark:bg-[#121212]">
      <div className="flex h-16 items-center justify-between w-full px-6">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-mono">
            Prompt Raft
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            onDoubleClick={() => navigate("/admin")}
          >
            Home
          </Link>
          <Link to="/prompt-refine" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Prompt Refiner
          </Link>
          <Link to="/prompts" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Gallery
          </Link>
          <Link to="/arena" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Swords className="w-4 h-4" /> Arena
          </Link>
          <Link to="/create" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Submit
          </Link>
          {isAuthenticated && user && (
            <div className="flex items-center gap-4 bg-muted/40 px-4 py-1.5 rounded-full border border-border/50 hidden md:flex">
              <div title="Daily Streak" className="flex items-center gap-1.5">
                <Flame className={`w-4 h-4 ${user.streak >= 7 ? 'text-orange-500 fill-orange-500 animate-pulse' : user.streak >= 3 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                <span className="text-sm font-bold text-foreground">{user.streak || 0}</span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <div title="Your Level" className="flex items-center gap-1.5">
                <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">LVL</span>
                <span className="text-sm font-bold text-primary">{user.level || 1}</span>
              </div>
            </div>
          )}
          <ThemeToggle />
          {isAuthenticated ? (
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="ocean">
                <Link to="/login">Get Started</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
