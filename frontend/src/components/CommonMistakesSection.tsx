import { CardEnhanced, CardEnhancedContent, CardEnhancedHeader, CardEnhancedTitle } from "@/components/ui/card-enhanced";
import { XCircle } from "lucide-react";

const mistakes = [
  {
    title: "Being Too Vague",
    bad: "Write something about marketing",
    good: "Write a 300-word Instagram caption for a sustainable fashion brand launching a new eco-friendly denim line, targeting millennials interested in ethical fashion",
  },
  {
    title: "Asking Multiple Questions at Once",
    bad: "Explain AI, machine learning, deep learning, and neural networks and how they relate",
    good: "Explain artificial intelligence and its relationship to machine learning. Use simple terms suitable for beginners.",
  },
  {
    title: "No Context or Audience",
    bad: "How do I invest money?",
    good: "As a 25-year-old with $5,000 savings and a stable income, what are beginner-friendly investment options? Explain in simple terms.",
  },
  {
    title: "Forgetting Output Format",
    bad: "Tell me about healthy breakfast options",
    good: "Create a table with 5 healthy breakfast options, including calories, prep time, and key nutrients for each",
  },
];

export default function CommonMistakesSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Common Mistakes to Avoid
          </h2>
          <p className="text-lg text-muted-foreground">
            Learn from these examples and see how small changes can dramatically improve your results.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2">
          {mistakes.map((mistake, index) => (
            <CardEnhanced key={index} variant="glass" className="hover:shadow-elegant transition-all duration-300">
              <CardEnhancedHeader>
                <div className="mb-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardEnhancedTitle className="mb-4">{mistake.title}</CardEnhancedTitle>
              </CardEnhancedHeader>
              <CardEnhancedContent className="space-y-4">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-xs font-semibold text-destructive mb-2">❌ Bad Example:</p>
                  <p className="text-sm text-foreground/80">{mistake.bad}</p>
                </div>
                <div className="rounded-lg border border-ocean-primary/20 bg-ocean-primary/5 p-4">
                  <p className="text-xs font-semibold text-ocean-primary mb-2">✅ Good Example:</p>
                  <p className="text-sm text-foreground/80">{mistake.good}</p>
                </div>
              </CardEnhancedContent>
            </CardEnhanced>
          ))}
        </div>
      </div>
    </section>
  );
}
