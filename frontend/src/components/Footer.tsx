import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-ocean-primary to-gold-primary bg-clip-text text-transparent">
                Idea Sailors
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Master the art of prompt engineering and unlock the full potential of AI language models.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/prompt-refine" className="hover:text-foreground transition-colors">
                  Prompt Refiner
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#best-practices" className="hover:text-foreground transition-colors">
                  Best Practices
                </a>
              </li>
              <li>
                <a href="#common-mistakes" className="hover:text-foreground transition-colors">
                  Common Mistakes
                </a>
              </li>
              <li>
                <a href="#templates" className="hover:text-foreground transition-colors">
                  Templates
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/40">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Idea Sailors. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
