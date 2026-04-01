import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Search, Copy, Share2, TrendingUp, Clock, Tag, MessageSquare, ThumbsUp, Sparkles, Plus, ExternalLink, Lock, Settings, X, ImageIcon, Trash2 } from "lucide-react";
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
import { Zap, Bot, Send, Play } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface SharedPrompt {
    _id: string;
    userId: string;
    isPrivate: boolean;
    requiresMedia?: boolean;
    promptType: string;
    category: string;
    imageUrl?: string;
    contributors: { _id: string, username: string }[];
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
    const [showMineOnly, setShowMineOnly] = useState(false);
    const [geminiPromptContent, setGeminiPromptContent] = useState<string | null>(null);
    const [mediaAlertPrompt, setMediaAlertPrompt] = useState<SharedPrompt | null>(null);
    const [pendingAgentUrl, setPendingAgentUrl] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const fetchPrompts = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (sortBy) params.append("sort", sortBy);
            if (selectedTag) params.append("tag", selectedTag);
            if (showMineOnly) params.append("mine", "true");

            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:3000/api/v1/gallery?${params.toString()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
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
    }, [search, sortBy, selectedTag, showMineOnly]);

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

    const copyToClipboard = (text: string, requiresMedia: boolean = false) => {
        navigator.clipboard.writeText(text);
        if (requiresMedia) {
            toast.success("Copied! 📸 Remember to attach media when using this prompt.");
        } else {
            toast.success("Prompt copied to clipboard!");
        }
    };

    const executeRunAgent = (prompt: SharedPrompt, agent: string) => {
        copyToClipboard(prompt.content, prompt.requiresMedia);
        if (agent === "chatgpt") {
            window.open(`https://chatgpt.com/?prompt=${encodeURIComponent(prompt.content)}`, "_blank");
        } else if (agent === "claude") {
            window.open(`https://claude.ai/new?q=${encodeURIComponent(prompt.content)}`, "_blank");
        } else if (agent === "gemini") {
            setGeminiPromptContent(prompt.content);
        }
    };

    const handleRunAgent = (prompt: SharedPrompt, agent: string) => {
        if (prompt.requiresMedia) {
            setMediaAlertPrompt(prompt);
            setPendingAgentUrl(agent);
        } else {
            executeRunAgent(prompt, agent);
        }
    };

    const tryInRefiner = (content: string) => {
        localStorage.setItem("pending_refinement", content);
        navigate("/prompt-refine");
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this prompt?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:3000/api/v1/gallery/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPrompts(prev => prev.filter(p => p._id !== id));
            toast.success("Prompt deleted successfully");
        } catch (err) {
            toast.error("Failed to delete prompt");
        }
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
                            className="pl-11 h-12 bg-card/50 border-border rounded-2xl focus-visible:ring-primary/20 transition-all text-lg"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {isAuthenticated && (
                            <Button
                                variant={showMineOnly ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowMineOnly(!showMineOnly)}
                                className="font-bold border-primary/20 hover:border-primary/50 transition-all rounded-full px-5"
                            >
                                {showMineOnly ? "Showing My Prompts" : "My Prompts"}
                            </Button>
                        )}
                        <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/50">
                            <Button
                                variant={sortBy === 'top' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="font-bold gap-2"
                                onClick={() => setSortBy('top')}
                            >
                                <TrendingUp className="w-4 h-4" /> Top
                            </Button>
                            <Button
                                variant={sortBy === 'new' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="font-bold gap-2"
                                onClick={() => setSortBy('new')}
                            >
                                <Clock className="w-4 h-4" /> Newest
                            </Button>
                        </div>
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
                    <div className="text-center py-32 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/50">
                        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                        <h3 className="text-3xl font-black text-foreground">The Gallery is <span className="text-primary italic">Quiet</span></h3>
                        <p className="text-muted-foreground mt-3 max-w-sm mx-auto text-lg">
                            No prompts matched your search, or the community hasn't shared anything yet.
                        </p>
                        <div className="flex justify-center gap-4 mt-8">
                            <Button
                                className="font-bold px-8 h-12"
                                onClick={() => navigate("/create")}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Share the First Prompt
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {prompts.map(prompt => (
                            <Card
                                key={prompt._id}
                                className="group bg-card border border-border hover:border-primary/40 transition-all duration-500 rounded-xl overflow-hidden flex flex-col h-full hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-[0.98]"
                            >
                                {/* Card header with optional image */}
                                {prompt.imageUrl ? (
                                    <div className="relative h-56 w-full overflow-hidden">
                                        <img
                                            src={prompt.imageUrl}
                                            alt={prompt.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
                                        <Badge className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur-md border-zinc-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg z-10">
                                            {prompt.promptType || 'Image'}
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="h-4 bg-transparent" />
                                )}

                                <CardHeader className={`${prompt.imageUrl ? '-mt-16 relative z-10' : ''} px-6 pb-2`}>
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1 italic">
                                            {prompt.title}
                                        </h3>
                                        <Badge variant="outline" className="text-[9px] uppercase font-black border-border text-muted-foreground bg-muted rounded-lg px-2 py-0.5 whitespace-nowrap">
                                            {prompt.promptType}
                                        </Badge>
                                    </div>

                                    <CardDescription className="line-clamp-2 mt-1 leading-relaxed text-muted-foreground font-medium text-xs">
                                        {prompt.description || "A community-crafted prompt for specialized AI interaction."}
                                    </CardDescription>

                                    {/* Prompt Content Preview (Match Reference) */}
                                    <div className="mt-5 bg-muted/30 border border-border rounded-md p-4 font-mono text-[11px] text-foreground overflow-hidden relative group/code shadow-inner h-28">
                                        <div className="opacity-60 leading-relaxed whitespace-pre-wrap line-clamp-4">
                                            {prompt.content}
                                        </div>
                                        <div className="absolute bottom-4 left-4 text-[10px] text-zinc-700 font-black italic">
                                            ...
                                        </div>
                                    </div>

                                    {/* Category & Tags Row */}
                                    <div className="flex flex-wrap items-center gap-2 mt-4">
                                        {prompt.category && prompt.category !== 'none' && (
                                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border">
                                                {prompt.category}
                                            </Badge>
                                        )}
                                        {prompt.tags?.slice(0, 2).map(t => (
                                            <span key={t} className="text-[9px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-lg border border-border/40 uppercase tracking-tighter">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </CardHeader>

                                <CardFooter className="pt-6 pb-6 mt-auto flex items-center justify-between px-6 border-t border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-[9px] font-black text-white shadow-lg border border-white/10">
                                            {prompt.author?.username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors cursor-pointer">
                                                @{prompt.author?.username || "anonymous"}
                                            </span>
                                            {prompt.contributors && prompt.contributors.length > 0 && (
                                                <span className="text-[10px] font-black text-muted-foreground">
                                                    +{prompt.contributors.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 group/vote cursor-pointer" onClick={() => handleUpvote(prompt._id)}>
                                            <ThumbsUp className={`w-4 h-4 transition-all ${user && prompt.upvotes?.includes(user._id) ? 'text-primary fill-primary' : 'text-muted-foreground group-hover/vote:text-primary'}`} />
                                            <span className={`text-xs font-black ${user && prompt.upvotes?.includes(user._id) ? 'text-primary' : 'text-muted-foreground group-hover/vote:text-primary'}`}>
                                                {prompt.upvotesCount}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(prompt.content, prompt.requiresMedia);
                                            }}
                                            className="text-zinc-600 hover:text-primary transition-all active:scale-90"
                                            title="Copy Prompt"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="text-muted-foreground hover:text-primary transition-all active:scale-90">
                                                    <Play className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] border-border bg-popover/95 backdrop-blur-xl shadow-2xl p-2">
                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 p-3">Run with Agent</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-zinc-800/50" />
                                                <DropdownMenuItem
                                                    className="flex items-center gap-3 p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-xl transition-colors"
                                                    onClick={() => handleRunAgent(prompt, "chatgpt")}
                                                >
                                                    <Zap className="w-4 h-4 text-emerald-500" /> <span className="font-bold text-xs capitalize">ChatGPT</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="flex items-center gap-3 p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-xl transition-colors"
                                                    onClick={() => handleRunAgent(prompt, "claude")}
                                                >
                                                    <Bot className="w-4 h-4 text-orange-400" /> <span className="font-bold text-xs capitalize">Claude</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="flex items-center gap-3 p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-xl transition-colors"
                                                    onClick={() => handleRunAgent(prompt, "gemini")}
                                                >
                                                    <Sparkles className="w-4 h-4 text-blue-400" /> <span className="font-bold text-xs capitalize">Gemini</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {user && (user._id === prompt.userId || (prompt.author && user.username === prompt.author.username)) && (
                                            <button
                                                className="text-muted-foreground hover:text-primary transition-all active:scale-90"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/create?id=${prompt._id}`);
                                                }}
                                                title="Edit Prompt"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        )}
                                        {user && (user._id === prompt.userId || user.isSuperAdmin) && (
                                            <button
                                                className="text-muted-foreground hover:text-red-500 transition-all active:scale-90"
                                                onClick={(e) => handleDelete(e, prompt._id)}
                                                title="Delete Prompt"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Gemini Confirmation Modal */}
            {geminiPromptContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#0f0f0f] border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-white tracking-tight">Prompt Copied</h3>
                                <button
                                    onClick={() => setGeminiPromptContent(null)}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                                The prompt has been copied to your clipboard. Paste it in Gemini after opening.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setGeminiPromptContent(null)}
                                    className="px-5 py-2.5 rounded-xl border border-border text-zinc-300 font-semibold text-sm hover:bg-zinc-800/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        window.open(`https://gemini.google.com/app?q=${encodeURIComponent(geminiPromptContent)}`, "_blank");
                                        setGeminiPromptContent(null);
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-[#0070f3] hover:bg-[#0070f3]/90 text-white font-bold text-sm flex items-center gap-2 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" /> Open Gemini
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Alert Dialog */}
            <Dialog open={!!mediaAlertPrompt && !!pendingAgentUrl} onOpenChange={(open) => {
                if (!open) {
                    setMediaAlertPrompt(null);
                    setPendingAgentUrl(null);
                }
            }}>
                <DialogContent className="sm:max-w-md bg-[#0f0f0f] border-border text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Media Upload Required
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 mt-2">
                            This prompt is designed to interact with a specific document or image. Don't forget to attach your file when you paste the prompt!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-end gap-3 mt-4">
                        <Button
                            variant="outline"
                            className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            onClick={() => {
                                setMediaAlertPrompt(null);
                                setPendingAgentUrl(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                            onClick={() => {
                                if (mediaAlertPrompt && pendingAgentUrl) {
                                    executeRunAgent(mediaAlertPrompt, pendingAgentUrl);
                                }
                                setMediaAlertPrompt(null);
                                setPendingAgentUrl(null);
                            }}
                        >
                            I Understand, Continue
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
