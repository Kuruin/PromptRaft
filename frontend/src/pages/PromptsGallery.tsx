import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Search, Copy, Share2, TrendingUp, Clock, Tag, MessageSquare, ThumbsUp, Sparkles, Plus, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiOpenai, SiAntdesign, SiGooglecloud } from "react-icons/si"; // We might need to install icons or use lucide substitutes
import { Zap, Bot, Send } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface SharedPrompt {
    _id: string;
    title: string;
    description: string;
    content: string;
    tags: string[];
    upvotes: string[];
    createdAt: string;
    author: {
        username: string;
        firstName: string;
        lastName: string;
        level: number;
    };
    upvotesCount: number;
}

export default function PromptsGallery() {
    const [prompts, setPrompts] = useState<SharedPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"new" | "top">("top");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [hoveredGeminiId, setHoveredGeminiId] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const fetchPrompts = async () => {
        if (!search && !selectedTag) {
            setPrompts([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (sortBy) params.append("sort", sortBy);
            if (selectedTag) params.append("tag", selectedTag);

            const res = await axios.get(`http://localhost:3000/api/v1/gallery?${params.toString()}`);
            setPrompts(res.data.prompts);
        } catch (err) {
            toast.error("Failed to load prompts");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPrompts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, sortBy, selectedTag]);

    const handleUpvote = async (id: string) => {
        if (!isAuthenticated) {
            toast.error("Please login to upvote prompts");
            return;
        }
        try {
            const res = await axios.post(`http://localhost:3000/api/v1/gallery/${id}/upvote`);
            setPrompts(prev => prev.map(p => {
                if (p._id === id) {
                    return {
                        ...p,
                        upvotesCount: res.data.upvotesCount,
                        upvotes: res.data.isUpvoted
                            ? [...p.upvotes, user?._id || ""]
                            : p.upvotes.filter(uid => uid !== user?._id)
                    };
                }
                return p;
            }));
            toast.success(res.data.message);
        } catch (err) {
            toast.error("Failed to upvote");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Prompt copied to clipboard!");
    };

    const tryInRefiner = (content: string) => {
        localStorage.setItem("pending_refinement", content);
        navigate("/prompt-refine");
    };

    const allTags = Array.from(new Set(prompts.flatMap(p => p.tags))).slice(0, 10);

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Helmet>
                <title>Prompts Gallery | Prompt Raft</title>
                <meta name="description" content="Explore and share community-driven AI prompts." />
            </Helmet>

            <Header />

            <main className="flex-grow container mx-auto px-4 py-12 max-w-7xl">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3" /> Community Library
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-foreground lg:text-7xl">
                        Prompts <span className="text-primary italic">Gallery</span>
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                        Discover, vote, and refine the best community-crafted prompts for Gemini and beyond.
                    </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
                    <div className="relative w-full md:w-1/2 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search prompts (e.g. 'coding assistant', 'creative writing')..."
                            className="pl-11 h-12 bg-card/50 border-border rounded-xl focus-visible:ring-primary/20 transition-all text-lg"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50">
                        <Button
                            variant={sortBy === 'top' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="rounded-lg font-bold gap-2"
                            onClick={() => setSortBy('top')}
                        >
                            <TrendingUp className="w-4 h-4" /> Top
                        </Button>
                        <Button
                            variant={sortBy === 'new' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="rounded-lg font-bold gap-2"
                            onClick={() => setSortBy('new')}
                        >
                            <Clock className="w-4 h-4" /> Newest
                        </Button>
                    </div>
                </div>

                {/* Tags Section */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-12">
                        <Badge
                            variant={selectedTag === null ? "default" : "secondary"}
                            className="cursor-pointer px-4 py-1.5 rounded-lg font-bold transition-all hover:scale-105"
                            onClick={() => setSelectedTag(null)}
                        >
                            All Prompts
                        </Badge>
                        {allTags.map(tag => (
                            <Badge
                                key={tag}
                                variant={selectedTag === tag ? "default" : "secondary"}
                                className="cursor-pointer px-4 py-1.5 rounded-lg font-bold transition-all hover:scale-105"
                                onClick={() => setSelectedTag(tag)}
                            >
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Card key={i} className="rounded-2xl border-border bg-card/30 overflow-hidden">
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="text-center py-32 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                        <h3 className="text-3xl font-black text-foreground">Discover <span className="text-primary italic">Prompts</span></h3>
                        <p className="text-muted-foreground mt-3 max-w-sm mx-auto text-lg">
                            Search for a topic or keyword to explore our community-driven prompt library.
                        </p>
                        <div className="flex justify-center gap-4 mt-8">
                            <Button
                                variant="outline"
                                className="font-bold rounded-xl px-8 h-12"
                                onClick={() => setSearch("coding")}
                            >
                                Try "coding"
                            </Button>
                            <Button
                                className="font-bold rounded-xl px-8 h-12"
                                onClick={() => navigate("/create")}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Share Your Own
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {prompts.map(prompt => (
                            <Card key={prompt._id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-border/60 bg-card/40 backdrop-blur-md hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                                {prompt.author?.username?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                                                    @{prompt.author?.username || "anonymous"}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                                                    LVL {prompt.author?.level || 1}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-black border-primary/20 text-primary bg-primary/5">
                                            {sortBy === 'top' && prompt.upvotesCount > 0 ? `${prompt.upvotesCount} Votes` : 'New'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                                        {prompt.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-2 leading-relaxed">
                                        {prompt.description || "A community-crafted prompt for specialized AI interaction."}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 rounded-lg shadow-lg"
                                                onClick={() => copyToClipboard(prompt.content)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <pre className="text-sm bg-muted/40 p-5 rounded-xl border border-border/50 text-muted-foreground font-mono overflow-hidden h-32 relative">
                                            {prompt.content}
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
                                        </pre>
                                    </div>

                                    {prompt.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-4">
                                            {prompt.tags.slice(0, 3).map(t => (
                                                <span key={t} className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/30">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="pt-2 pb-6 border-t border-border/30 mt-auto flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`rounded-xl px-4 font-black transition-all ${user && prompt.upvotes?.includes(user._id) ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'}`}
                                        onClick={() => handleUpvote(prompt._id)}
                                    >
                                        <ThumbsUp className={`w-4 h-4 mr-2 ${user && prompt.upvotes?.includes(user._id) ? 'fill-primary' : ''}`} />
                                        {prompt.upvotesCount}
                                    </Button>

                                    <div className="flex gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl font-bold border-border group-hover:border-primary/30 transition-all gap-2"
                                                >
                                                    <Send className="w-4 h-4 text-primary" /> Try it out
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border bg-card/95 backdrop-blur-xl">
                                                <DropdownMenuLabel className="text-xs uppercase tracking-widest font-black text-muted-foreground p-3">Run with Agent</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="flex items-center gap-3 p-3 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-lg transition-colors"
                                                    onClick={() => {
                                                        copyToClipboard(prompt.content);
                                                        window.open(`https://chatgpt.com/?prompt=${encodeURIComponent(prompt.content)}`, "_blank");
                                                    }}
                                                >
                                                    <Zap className="w-4 h-4 text-green-500" /> ChatGPT
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="flex items-center gap-3 p-3 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-lg transition-colors"
                                                    onClick={() => {
                                                        copyToClipboard(prompt.content);
                                                        window.open(`https://claude.ai/new?q=${encodeURIComponent(prompt.content)}`, "_blank");
                                                    }}
                                                >
                                                    <Bot className="w-4 h-4 text-orange-400" /> Claude
                                                </DropdownMenuItem>
                                                <Popover open={hoveredGeminiId === prompt._id}>
                                                    <PopoverTrigger asChild>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-3 p-3 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-lg transition-colors group/item"
                                                            onMouseEnter={() => setHoveredGeminiId(prompt._id)}
                                                            onMouseLeave={() => setHoveredGeminiId(null)}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                copyToClipboard(prompt.content);
                                                            }}
                                                        >
                                                            <Sparkles className="w-4 h-4 text-blue-400" />
                                                            <div className="flex flex-col">
                                                                <span>Gemini</span>
                                                                <span className="text-[10px] text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity font-bold">Try Gemini (Link)</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        side="right"
                                                        className="w-64 p-4 border border-border bg-card shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200"
                                                        onMouseEnter={() => setHoveredGeminiId(prompt._id)}
                                                        onMouseLeave={() => setHoveredGeminiId(null)}
                                                    >
                                                        <div className="space-y-3 text-left">
                                                            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                                                                <SiGooglecloud className="w-3 h-3" /> Quick Copy
                                                            </div>
                                                            <p className="text-sm text-foreground font-medium leading-relaxed">
                                                                The prompt has been copied to your clipboard. Paste it in Gemini after opening.
                                                            </p>
                                                            <Button
                                                                className="w-full h-10 rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                                onClick={() => window.open(`https://gemini.google.com/app?q=${encodeURIComponent(prompt.content)}`, "_blank")}
                                                            >
                                                                Open Gemini <ExternalLink className="w-4 h-4 ml-2" />
                                                            </Button>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
