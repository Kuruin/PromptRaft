import { CardEnhanced, CardEnhancedContent, CardEnhancedHeader, CardEnhancedTitle, CardEnhancedDescription } from "@/components/ui/card-enhanced";
import { Zap, Target, TrendingUp, Sparkles } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Refinement",
    description: "Our intelligent system analyzes your prompts and suggests improvements based on best practices and proven patterns.",
  },
  {
    icon: Target,
    title: "Precision & Clarity",
    description: "Transform vague requests into specific, actionable prompts that guide AI models to produce exactly what you need.",
  },
  {
    icon: TrendingUp,
    title: "Learn & Improve",
    description: "Access curated templates, examples, and educational resources to continuously enhance your prompt engineering skills.",
  },
  {
    icon: Sparkles,
    title: "Universal Compatibility",
    description: "Optimized prompts work seamlessly across ChatGPT, Claude, Gemini, and other major language models.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30 dark:bg-[#1a1a1a]">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Why Use Prompt Raft?
          </h2>
          <p className="text-lg text-muted-foreground">
            Transform your AI interactions with professional-grade prompt engineering tools and techniques.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <CardEnhanced key={index} variant="glass" className="hover:shadow-elegant transition-all duration-300">
              <CardEnhancedHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardEnhancedTitle>{feature.title}</CardEnhancedTitle>
                <CardEnhancedDescription>{feature.description}</CardEnhancedDescription>
              </CardEnhancedHeader>
            </CardEnhanced>
          ))}
        </div>
      </div>
    </section>
  );
}
