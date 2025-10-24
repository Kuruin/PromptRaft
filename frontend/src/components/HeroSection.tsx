import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-subtle opacity-50" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Master the Art of Prompt Engineering</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-foreground via-primary to-ocean-primary bg-clip-text text-transparent">
            Craft Better Prompts,
            <br />
            Get Better Results
          </h1>

          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Learn proven techniques, avoid common mistakes, and use our AI-powered tool to refine your prompts for ChatGPT, Claude, and other LLMs.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="ocean" className="group">
              <Link to="/prompt-refine">
                Start Refining
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="hover:bg-[#00b4d8]">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
