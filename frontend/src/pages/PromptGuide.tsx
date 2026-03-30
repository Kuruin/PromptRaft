import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import {
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Code,
    Variable,
    User,
    Target,
    BookOpen,
    Copy,
    Check,
    ChevronRight,
    Sparkles,
    ArrowLeft,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

interface CodeBlockProps {
    code: string;
}

function CodeBlock({ code }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group mt-3">
            <pre className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-zinc-300">
                <code>{code}</code>
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800"
                title="Copy"
            >
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                    <Copy className="h-3.5 w-3.5 text-zinc-400" />
                )}
            </button>
        </div>
    );
}

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function Section({ icon, title, children, defaultOpen = false }: SectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const sectionRef = useRef<HTMLDivElement>(null);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !isOpen;
        setIsOpen(willOpen);
        if (willOpen) {
            setTimeout(() => {
                sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 50);
        }
    };

    return (
        <div ref={sectionRef} className="border border-zinc-800/60 rounded-3xl overflow-hidden bg-zinc-900/20 backdrop-blur-sm transition-all hover:border-zinc-700/60 shadow-xl">
            <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center gap-3 p-5 text-left hover:bg-zinc-800/30 transition-colors"
            >
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    {icon}
                </div>
                <span className="font-bold text-zinc-100 flex-1">{title}</span>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-zinc-500" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-zinc-500" />
                )}
            </button>
            {isOpen && (
                <div className="px-5 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-zinc-800/50 mb-4" />
                    {children}
                </div>
            )}
        </div>
    );
}

export default function PromptGuide() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-primary/30 selection:text-primary">
            <Helmet>
                <title>Master Prompt Engineering | Prompt Raft</title>
            </Helmet>

            <Header />

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-8 rounded-full text-zinc-500 hover:text-zinc-100 gap-2 transition-all p-0 hover:bg-transparent"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Workspace
                </Button>

                {/* Hero Section */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-black tracking-widest mb-6">
                        <Sparkles className="w-3 h-3" /> Professional Guide
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-6">
                        How to write Great <span className="text-primary italic">Prompts</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed font-medium">
                        Discover tips, examples, and best practices for creating effective AI prompts that deliver precise results.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* General Tips */}
                    <Section
                        icon={<Lightbulb className="h-5 w-5" />}
                        title="General Best Practices"
                        defaultOpen={true}
                    >
                        <ul className="space-y-6 text-zinc-400">
                            <li className="flex gap-4">
                                <span className="text-primary font-black text-xl italic mt-1">01</span>
                                <div>
                                    <strong className="text-zinc-100 text-lg block mb-1 uppercase tracking-tight font-black">Be Specific and Clear</strong>
                                    <p className="leading-relaxed">Vague prompts lead to vague responses. Specify exactly what you want, including format, length, tone, and any constraints.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-primary font-black text-xl italic mt-1">02</span>
                                <div>
                                    <strong className="text-zinc-100 text-lg block mb-1 uppercase tracking-tight font-black">Provide Context</strong>
                                    <p className="leading-relaxed">Give background information that helps the AI understand your needs. Include who, what, why, and for whom.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-primary font-black text-xl italic mt-1">03</span>
                                <div>
                                    <strong className="text-zinc-100 text-lg block mb-1 uppercase tracking-tight font-black">Define the Output Format</strong>
                                    <p className="leading-relaxed">Specify how you want the response structured: bullet points, paragraphs, code blocks, tables, etc.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-primary font-black text-xl italic mt-1">04</span>
                                <div>
                                    <strong className="text-zinc-100 text-lg block mb-1 uppercase tracking-tight font-black">Set Constraints</strong>
                                    <p className="leading-relaxed">Include limitations like word count, reading level, things to avoid, or specific requirements to follow.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-primary font-black text-xl italic mt-1">05</span>
                                <div>
                                    <strong className="text-zinc-100 text-lg block mb-1 uppercase tracking-tight font-black">Include Examples</strong>
                                    <p className="leading-relaxed">Show the AI what good output looks like. Examples help calibrate the response style and quality.</p>
                                </div>
                            </li>
                        </ul>
                    </Section>

                    {/* Role-Playing */}
                    <Section
                        icon={<User className="h-5 w-5" />}
                        title="Role-Playing (Act As)"
                    >
                        <p className="text-zinc-400 mb-6 leading-relaxed">Assigning a specific persona to the AI drastically improves task performance by narrowing its focus to a specific domain knowledge.</p>

                        <div className="space-y-8">
                            <div>
                                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">Basic Pattern</h4>
                                <CodeBlock
                                    code={`Act as a {role}. You are an expert in {expertise}. Your task is to {task}.

When responding:
- Use {tone} tone
- Focus on {focus_area}
- Provide {output_type}`}
                                />
                            </div>

                            <div>
                                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">Expert Role Example</h4>
                                <CodeBlock
                                    code={`Act as a Senior Software Architect with 15+ years of experience in distributed systems.

Your expertise includes:
- Microservices architecture
- Cloud-native applications (AWS, GCP, Azure)
- Performance optimization and scalability
- Security best practices

When reviewing code or architecture:
1. First, identify potential issues and bottlenecks
2. Explain the impact of each issue
3. Provide specific, actionable recommendations
4. Include code examples when relevant
5. Consider trade-offs and alternatives

Maintain a professional but approachable tone. Ask clarifying questions if the requirements are unclear.`}
                                />
                            </div>

                            <div>
                                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">Creative Role Example</h4>
                                <CodeBlock
                                    code={`Act as a creative writing coach specializing in \${genre:science fiction}.

Your personality:
- Encouraging but honest
- Passionate about storytelling
- Detail-oriented on craft

Help writers improve their work by:
1. Analyzing narrative structure
2. Evaluating character development
3. Reviewing dialogue authenticity
4. Suggesting pacing improvements
5. Identifying plot holes or inconsistencies

Always provide specific examples from the text when giving feedback.`}
                                />
                            </div>

                            <div>
                                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">Popular Roles</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/80">
                                        <strong className="text-zinc-100 text-xs uppercase font-black block mb-2">Technical</strong>
                                        <ul className="text-zinc-500 text-xs space-y-1.5 font-bold">
                                            <li>• Senior Developer</li>
                                            <li>• DevOps Engineer</li>
                                            <li>• Data Scientist</li>
                                            <li>• Security Expert</li>
                                        </ul>
                                    </div>
                                    <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/80">
                                        <strong className="text-zinc-100 text-xs uppercase font-black block mb-2">Creative</strong>
                                        <ul className="text-zinc-500 text-xs space-y-1.5 font-bold">
                                            <li>• Copywriter</li>
                                            <li>• Story Editor</li>
                                            <li>• Marketing Strategist</li>
                                            <li>• UX Designer</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Variables */}
                    <Section
                        icon={<Variable className="h-5 w-5" />}
                        title="Dynamic Variables & Syntax"
                    >
                        <p className="text-zinc-400 mb-6 leading-relaxed">Dynamic variables allow you to create reusable templates that can be easily customized for different inputs on Prompt Raft.</p>

                        <div className="space-y-8">
                            <div>
                                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">Syntax & Formatting</h4>
                                <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800/80 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <code className="bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-700 font-mono text-primary text-xs tracking-tighter">{`\${variable_name}`}</code>
                                        <span className="text-zinc-500 text-sm">— Mandatory variable input</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <code className="bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-700 font-mono text-primary text-xs tracking-tighter">{`\${variable_name:default value}`}</code>
                                        <span className="text-zinc-500 text-sm">— Variable with an optional default value</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">Advanced Template Example</h4>
                                <CodeBlock
                                    code={`Act as a \${role:Technical Writer} creating documentation for \${project_name}.

## Context
- Target audience: \${audience:developers}
- Documentation type: \${doc_type:API reference}
- Technical level: \${level:intermediate}

## Requirements
1. Use \${style:clear and concise} writing style
2. Include code examples in \${programming_language:JavaScript}
3. Follow \${standard:Google developer documentation} guidelines

## Content to Document
\${content}

## Output Format
\${format:Markdown with code blocks}`}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Structured Prompts */}
                    <Section
                        icon={<Code className="h-5 w-5" />}
                        title="Structured Prompts (JSON/YAML)"
                    >
                        <p className="text-zinc-400 mb-6 leading-relaxed">Structured formats like JSON or YAML help complex agents parse instructions more precisely, especially for multi-step workflows.</p>

                        <div className="space-y-8">
                            <div>
                                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">JSON Interview Pattern</h4>
                                <CodeBlock
                                    code={`{
  "role": "Technical Interviewer",
  "expertise": ["System Design", "Algorithms", "Behavioral"],
  "context": {
    "position": "\${position:Senior Software Engineer}",
    "company_type": "\${company_type:startup}",
    "interview_round": "\${round:technical}"
  },
  "instructions": {
    "difficulty": "\${difficulty:medium}",
    "duration_minutes": 45,
    "focus_areas": [
      "Problem-solving approach",
      "Code quality"
    ]
  },
  "output_format": {
    "include_hints": true,
    "evaluation_criteria": [
      "Correctness",
      "Efficiency", 
      "Code readability"
    ]
  },
  "question": "\${interview_question}"
}`}
                                />
                            </div>

                            <div>
                                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">YAML Content Strategy</h4>
                                <CodeBlock
                                    code={`role: Content Strategist
persona:
  name: ContentBot
  tone: professional yet friendly
  expertise:
    - SEO optimization
    - Content marketing

task:
  type: \${content_type:blog post}
  topic: "\${topic}"
  
requirements:
  word_count: \${word_count:1000}
  include_sections:
    - Introduction with hook
    - Main content
    - Conclusion with CTA

output:
  format: markdown
  include_meta_description: true`}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Output Optimization */}
                    <Section
                        icon={<Target className="h-5 w-5" />}
                        title="Output Optimization"
                    >
                        <p className="text-zinc-400 mb-6 leading-relaxed">Ensure the AI response is exactly what you need by defining the final structure and content boundaries.</p>

                        <div>
                            <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-[0.2em] mb-3">Format Requirements Template</h4>
                            <CodeBlock
                                code={`## Output Requirements

Format your response as follows:

### Summary (2-3 sentences)
Brief overview of the main points.

### Key Findings
- Bullet point 1
- Bullet point 2

### Detailed Analysis
[Provide in-depth analysis here]

### Next Steps
Action items with owners and deadlines.`}
                            />
                        </div>
                    </Section>
                </div>

                <div className="mt-20 pt-12 border-t border-zinc-900 text-center">
                    <h3 className="text-2xl font-black italic mb-4">Ready to Build?</h3>
                    <Button
                        onClick={() => navigate("/create")}
                        className="rounded-full px-10 h-14 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105"
                    >
                        Start Creating <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
