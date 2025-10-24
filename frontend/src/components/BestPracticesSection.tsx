import { CardEnhanced, CardEnhancedContent, CardEnhancedHeader, CardEnhancedTitle } from "@/components/ui/card-enhanced";
import { CheckCircle2 } from "lucide-react";

const practices = [
  {
    title: "Be Specific and Clear",
    description: "Instead of 'Write about dogs,' try 'Write a 500-word article about golden retriever training techniques for puppies aged 8-12 weeks.'",
  },
  {
    title: "Provide Context",
    description: "Give background information and specify your audience. Example: 'Explain quantum computing to a high school student with basic physics knowledge.'",
  },
  {
    title: "Define the Format",
    description: "Specify exactly how you want the output structured: bullet points, paragraphs, tables, code blocks, step-by-step guides, etc.",
  },
  {
    title: "Set Constraints",
    description: "Include word limits, tone requirements, or specific elements to include or avoid. This helps focus the AI's response.",
  },
  {
    title: "Use Examples",
    description: "Show the AI what you want by providing examples of desired outputs or similar successful prompts.",
  },
  {
    title: "Iterate and Refine",
    description: "Start with a basic prompt, review the output, and progressively refine your request based on what works and what doesn't.",
  },
];

export default function BestPracticesSection() {
  return (
    <section id="best-practices" className="py-20 md:py-32" >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            <a href="https://www.youtube.com/watch?v=iRTK-jsfleg" className="hover:underline hover:text-[38px] hover:text-[#5e503f]">
              Best Practices
            </a>
          </h2>
          <p className="text-lg text-muted-foreground">
            Follow these proven techniques to write effective prompts that consistently deliver great results.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {practices.map((practice, index) => (
            <CardEnhanced key={index} variant="ocean" className="hover:shadow-elegant transition-all duration-300">
              <CardEnhancedHeader>
                <div className="mb-4">
                  <CheckCircle2 className="h-8 w-8 text-ocean-primary" />
                </div>
                <CardEnhancedTitle className="mb-3">{practice.title}</CardEnhancedTitle>
              </CardEnhancedHeader>
              <CardEnhancedContent>
                <p className="text-sm text-muted-foreground">{practice.description}</p>
              </CardEnhancedContent>
            </CardEnhanced>
          ))}
        </div>
      </div>
    </section>
  );
}
