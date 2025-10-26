import { useState } from "react";
import { CardEnhanced, CardEnhancedContent, CardEnhancedHeader, CardEnhancedTitle, CardEnhancedDescription } from "@/components/ui/card-enhanced";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const templates = [
  {
    category: "Content Creation",
    title: "Blog Post Template",
    template: "Write a [word count] blog post about [topic] for [target audience]. The tone should be [tone]. Include [number] key points: [list points]. Use [format preferences] and include a compelling introduction and conclusion with a call-to-action.",
  },
  {
    category: "Content Creation",
    title: "Social Media Post",
    template: "Create a [platform] post for [brand/topic] targeting [audience]. The post should be [tone/style], include [specific elements like hashtags/emojis], and be optimized for [goal like engagement/clicks]. Keep it under [character limit].",
  },
  {
    category: "Code & Technical",
    title: "Code Explanation",
    template: "Explain this [language] code to someone with [experience level]. Break down what each section does, explain the logic, and highlight any best practices or potential improvements: [paste code]",
  },
  {
    category: "Code & Technical",
    title: "Code Generation",
    template: "Write [language] code that [specific functionality]. Use [frameworks/libraries if applicable]. Include error handling, comments explaining the logic, and follow [coding standards/best practices].",
  },
  {
    category: "Business & Analysis",
    title: "Market Research",
    template: "Conduct a market analysis for [product/service] in [industry/region]. Include: target audience demographics, competitor analysis, market trends, opportunities, and potential challenges. Present findings in [format].",
  },
  {
    category: "Business & Analysis",
    title: "SWOT Analysis",
    template: "Create a comprehensive SWOT analysis for [company/product/idea]. Identify 3-5 items for each category (Strengths, Weaknesses, Opportunities, Threats) specific to [context/market]. Format as a table.",
  },
];

export default function PromptTemplatesSection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Template copied to clipboard",
    });
  };

  return (
    <section id="templates" className="py-20 md:py-32 dark:bg-[#121212]">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready-to-Use Prompt Templates
          </h2>
          <p className="text-lg text-muted-foreground">
            Copy these professional templates and customize them for your specific needs.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <CardEnhanced key={index} variant="default" className="hover:shadow-elegant transition-all duration-300 dark:bg-[#282828]">
              <CardEnhancedHeader>
                <div className="mb-2">
                  <span className="inline-block rounded-full bg-gold-primary/10 px-3 py-1 text-xs font-semibold text-gold-primary">
                    {template.category}
                  </span>
                </div>
                <CardEnhancedTitle className="mb-3">{template.title}</CardEnhancedTitle>
              </CardEnhancedHeader>
              <CardEnhancedContent>
                <div className="mb-4 rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-foreground/80 font-mono leading-relaxed">
                    {template.template}
                  </p>
                </div>
                <Button
                  variant="custom1"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(template.template, index)}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Template
                    </>
                  )}
                </Button>
              </CardEnhancedContent>
            </CardEnhanced>
          ))}
        </div>
      </div>
    </section>
  );
}
