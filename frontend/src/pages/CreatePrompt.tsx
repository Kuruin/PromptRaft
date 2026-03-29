import { useState } from "react";
import { Helmet } from "react-helmet";
import {
    Plus,
    BookOpen,
    Search,
    Users,
    Settings,
    ChevronRight,
    Image as ImageIcon,
    Type,
    Code,
    ExternalLink,
    Lock,
    Globe,
    Sparkles,
    CheckCircle2,
    Tag
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { SiGooglecloud } from "react-icons/si";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

export default function CreatePrompt() {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("none");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [contributors, setContributors] = useState("");
    const [promptText, setPromptText] = useState("");
    const [isPromptAgent, setIsPromptAgent] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [requiresMedia, setRequiresMedia] = useState(false);
    const [promptType, setPromptType] = useState("text");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !promptText) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== "");

            await axios.post('http://localhost:3000/api/v1/gallery', {
                title,
                description: description || `A community prompt shared by ${user?.username}`,
                content: promptText,
                tags: tagArray,
                category,
                isPrivate,
                isPromptAgent,
                requiresMedia,
                promptType
            });

            toast.success("Prompt shared to gallery successfully!");
            navigate("/prompts");
        } catch (err) {
            console.error(err);
            toast.error("Failed to share prompt. Make sure you are logged in.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Create Prompt | Prompt Raft</title>
                <meta name="description" content="Design and share professional AI prompts." />
            </Helmet>

            <div className="min-h-screen bg-[#020202] text-zinc-100 flex flex-col font-sans">
                <Header />

                <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <span className="bg-primary/20 p-2 rounded-2xl border border-primary/30">
                                <Plus className="w-5 h-5 text-primary" />
                            </span>
                            Create Prompt
                        </h1>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 gap-2 text-xs font-bold transition-all">
                                    <Code className="w-3.5 h-3.5" /> Prompt Agent
                                </Button>
                                <Switch
                                    checked={isPromptAgent}
                                    onCheckedChange={setIsPromptAgent}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                            <div className="flex items-center gap-3 border-l border-zinc-800 pl-6">
                                <Label className="text-xs font-bold text-zinc-400">Private</Label>
                                <Switch
                                    checked={isPrivate}
                                    onCheckedChange={setIsPrivate}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Banner */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-3 mb-10 flex items-center justify-between group cursor-pointer hover:bg-zinc-900/60 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-zinc-300">Learn how to write effective prompts →</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Section 1: Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-2.5">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    Title <Sparkles className="w-3 h-3 text-primary/40" />
                                </Label>
                                <Input
                                    placeholder="Enter a title for your prompt"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-12 bg-zinc-900/30 border-zinc-800/80 rounded-2xl focus-visible:ring-primary/20 placeholder:text-zinc-600 font-medium"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    Category <Settings className="w-3 h-3 text-primary/40" />
                                </Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="h-12 bg-zinc-900/30 border-zinc-800/80 rounded-2xl focus:ring-primary/20 font-medium capitalize">
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl">
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="coding">Coding</SelectItem>
                                        <SelectItem value="creative">Creative</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="academic">Academic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2.5">
                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                Description <Plus className="w-3 h-3 text-primary/40" />
                            </Label>
                            <Textarea
                                placeholder="Optional description of your prompt"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[100px] bg-zinc-900/30 border-zinc-800/80 rounded-2xl focus-visible:ring-primary/20 placeholder:text-zinc-600 resize-none"
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-2.5">
                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                Tags <Tag className="w-3 h-3 text-primary/40" />
                            </Label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search tags..."
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="pl-10 h-12 bg-zinc-900/30 border-zinc-800/80 rounded-2xl focus-visible:ring-primary/20 placeholder:text-zinc-600"
                                />
                            </div>
                        </div>

                        {/* Contributors */}
                        <div className="space-y-2.5">
                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">
                                Contributors
                            </Label>
                            <p className="text-[11px] text-zinc-500 mt-0.5">Other users who helped write this prompt. Users whose change requests are approved are added automatically.</p>
                            <div className="relative group mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by username..."
                                    value={contributors}
                                    onChange={(e) => setContributors(e.target.value)}
                                    className="pl-10 h-12 bg-zinc-900/30 border-zinc-800/80 rounded-2xl focus-visible:ring-primary/20 placeholder:text-zinc-600"
                                />
                            </div>
                        </div>

                        {/* Advanced Options Accordion */}
                        <Accordion type="single" collapsible className="border-t border-zinc-900">
                            <AccordionItem value="advanced" className="border-none">
                                <AccordionTrigger className="flex items-center gap-3 py-6 hover:no-underline group">
                                    <div className="flex items-center gap-3 text-zinc-300 font-bold group-hover:text-primary transition-colors">
                                        <Settings className="w-4 h-4" /> Advanced Options
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-8 text-zinc-500 italic text-sm">
                                    Additional configuration options will be available soon in the next update.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Prompt Workspace */}
                        <div className="pt-10 border-t border-zinc-900 space-y-8">
                            <h2 className="text-xl font-black text-zinc-100 italic">User Prompt</h2>

                            <div className="flex items-center justify-between">
                                <Select value={promptType} onValueChange={setPromptType}>
                                    <SelectTrigger className="w-[180px] h-10 bg-zinc-900 border-zinc-800 rounded-lg focus:ring-primary/20 font-bold">
                                        <SelectValue placeholder="Text Prompt" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl shadow-2xl">
                                        <SelectItem value="text">Text Prompt</SelectItem>
                                        <SelectItem value="code">Code Template</SelectItem>
                                        <SelectItem value="system">System Instruction</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-3">
                                    <Label className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                                        <Switch
                                            checked={requiresMedia}
                                            onCheckedChange={setRequiresMedia}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                        Requires Media Upload
                                    </Label>
                                </div>
                            </div>

                            <div className="border border-zinc-800/80 rounded-[2.5rem] bg-zinc-900/20 overflow-hidden shadow-2xl">
                                <div className="bg-zinc-900/50 p-4 border-b border-zinc-800/80 flex items-center gap-4">
                                    <button type="button" className="flex items-center gap-2 text-[11px] font-black uppercase text-zinc-400 hover:text-primary transition-colors">
                                        <span className="bg-zinc-800 p-1 rounded-lg text-[10px] text-zinc-500 font-bold tracking-tighter">( * )</span> Inset Variable
                                    </button>
                                    <span className="text-[10px] text-zinc-600 font-medium">Use ${"{name}"} or ${"{name:default}"} syntax</span>
                                </div>
                                <Textarea
                                    className="min-h-[300px] bg-transparent border-none focus-visible:ring-0 p-6 font-mono text-sm leading-relaxed resize-y placeholder:text-zinc-700"
                                    placeholder="Enter your prompt content here ..."
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Row */}
                        <div className="pt-12 text-center pb-20">
                            <div className="flex items-center justify-center gap-4 mb-8">
                                <div className="h-px w-20 bg-zinc-900"></div>
                                <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-2 bg-zinc-900/40 px-3 py-1.5 rounded-full border border-zinc-800/50">
                                    What your prompt will produce? <ChevronRight className="w-3 h-3" />
                                </button>
                                <div className="h-px w-20 bg-zinc-900"></div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full max-w-sm h-14 font-black uppercase tracking-[0.2em] text-sm bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                {isSubmitting ? "Publishing RAFT..." : "Publish to Gallery"}
                            </Button>
                        </div>
                    </form>
                </main>

                <Footer />
            </div>
        </>
    );
}
