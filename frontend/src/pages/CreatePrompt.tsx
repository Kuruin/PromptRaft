import { useState, useEffect } from "react";
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
    Tag,
    Loader2,
    X
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
    const [promptText, setPromptText] = useState("");
    const [isPromptAgent, setIsPromptAgent] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [requiresMedia, setRequiresMedia] = useState(false);
    const [promptType, setPromptType] = useState("text");
    const [imageUrl, setImageUrl] = useState("");
    const [structuredFormat, setStructuredFormat] = useState("none");
    const [contributors, setContributors] = useState<{ _id: string, username: string }[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<{ _id: string, username: string }[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Load existing prompt if in edit mode
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        if (id) {
            setIsEditMode(true);
            setEditId(id);
            fetchPrompt(id);
        }
    }, []);

    // User Search Effect
    useEffect(() => {
        const searchUsers = async () => {
            if (userSearchQuery.length < 2) {
                setUserSearchResults([]);
                return;
            }
            setIsSearchingUsers(true);
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`http://localhost:3000/api/v1/user/search?q=${userSearchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserSearchResults(res.data.users);
            } catch (err) {
                console.error("User search failed", err);
            } finally {
                setIsSearchingUsers(false);
            }
        };

        const timer = setTimeout(searchUsers, 300);
        return () => clearTimeout(timer);
    }, [userSearchQuery]);

    const addContributor = (u: { _id: string, username: string }) => {
        if (!contributors.find(c => c._id === u._id)) {
            setContributors([...contributors, u]);
        }
        setUserSearchQuery("");
        setUserSearchResults([]);
    };

    const removeContributor = (id: string) => {
        setContributors(contributors.filter(c => c._id !== id));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image must be less than 10MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchPrompt = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:3000/api/v1/gallery/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const p = res.data.prompt;
            setTitle(p.title);
            setCategory(p.category || "none");
            setDescription(p.description || "");
            setTags(p.tags?.join(', ') || "");
            setPromptText(p.content);
            setIsPromptAgent(p.isPromptAgent || false);
            setIsPrivate(p.isPrivate || false);
            setRequiresMedia(p.requiresMedia || false);
            setPromptType(p.promptType || "text");
            setImageUrl(p.imageUrl || "");
            setStructuredFormat(p.structuredFormat || "none");
            setContributors(p.contributors || []);
        } catch (err) {
            toast.error("Failed to load prompt for editing");
            navigate("/prompts");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !promptText) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== "");
            const payload = {
                title,
                description: description || `A community prompt shared by ${user?.username}`,
                content: promptText,
                tags: tagArray,
                category,
                isPrivate,
                isPromptAgent,
                requiresMedia,
                promptType,
                contributors: contributors.map(c => c._id),
                imageUrl,
                structuredFormat
            };

            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            if (isEditMode && editId) {
                await axios.put(`http://localhost:3000/api/v1/gallery/${editId}`, payload, { headers });
                toast.success("Prompt updated successfully!");
            } else {
                await axios.post('http://localhost:3000/api/v1/gallery', payload, { headers });
                toast.success("Prompt shared to gallery successfully!");
            }
            navigate("/prompts");
        } catch (err) {
            console.error(err);
            toast.error(isEditMode ? "Failed to update prompt." : "Failed to share prompt. Make sure you are logged in.");
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

            <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
                <Header />

                <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <span className="bg-primary/10 dark:bg-primary/20 p-2 rounded-2xl border border-primary/20 dark:border-primary/30">
                                <Plus className="w-5 h-5 text-primary" />
                            </span>
                            Create Prompt
                        </h1>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 pl-6">
                                <Label className="text-xs font-bold text-muted-foreground">Private</Label>
                                <Switch
                                    checked={isPrivate}
                                    onCheckedChange={setIsPrivate}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Banner */}
                    <div
                        onClick={() => navigate("/guide")}
                        className="bg-card border border-border rounded-2xl p-3 mb-10 flex items-center justify-between group cursor-pointer hover:bg-muted/50 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-foreground/80">Learn how to write effective prompts →</span>
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
                                    className="h-12 bg-background/50 border-border rounded-2xl focus-visible:ring-primary/20 placeholder:text-muted-foreground/50 font-medium"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    Category <Settings className="w-3 h-3 text-primary/40" />
                                </Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="h-12 bg-background/50 border-border rounded-2xl focus:ring-primary/20 font-medium capitalize">
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-foreground rounded-2xl shadow-2xl">
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
                                className="min-h-[100px] bg-background/50 border-border rounded-2xl focus-visible:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
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

                        {/* Image Preview URL */}
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em] ml-1">
                                Display Image
                            </Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                    <ImageIcon className="w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                </div>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="bg-background/50 border-border pl-11 h-14 rounded-2xl focus-visible:ring-primary/20 placeholder:text-muted-foreground/50 font-medium file:pt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                {imageUrl && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg overflow-hidden border border-border bg-muted group-hover:w-24 group-hover:h-24 group-hover:-translate-y-12 transition-all duration-300 z-10 shadow-xl group/img">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setImageUrl("");
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-zinc-900/60 backdrop-blur-md rounded-full text-zinc-100 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500"
                                            title="Remove Image"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-600 ml-1 leading-relaxed">
                                Upload a high-resolution landscape image from your device to serve as the prompt card background! Max ~10MB. 🖼️
                            </p>
                        </div>

                        {/* Contributors */}
                        <div className="space-y-2.5">
                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">
                                Contributors
                            </Label>
                            <p className="text-[11px] text-zinc-500 mt-0.5">Collaborators who helped craft this prompt.</p>

                            <div className="relative group mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by username..."
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    className="pl-10 h-12 bg-zinc-900/30 border-zinc-800/80 rounded-2xl focus-visible:ring-primary/20 placeholder:text-zinc-600"
                                />

                                {/* Search Results */}
                                {userSearchQuery.length >= 2 && (userSearchResults.length > 0 || isSearchingUsers) && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl p-2 shadow-2xl z-50 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {isSearchingUsers ? (
                                            <div className="flex items-center gap-2 p-3 text-xs text-zinc-500">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                                            </div>
                                        ) : userSearchResults.length > 0 ? (
                                            userSearchResults.map(u => (
                                                <button
                                                    key={u._id}
                                                    type="button"
                                                    onClick={() => addContributor(u)}
                                                    className="w-full text-left p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                                                >
                                                    <span className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors">@{u.username}</span>
                                                    <Plus className="w-4 h-4 text-zinc-600 group-hover:text-primary" />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-xs text-zinc-500 italic">No users found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Contributors */}
                            {contributors.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {contributors.map(c => (
                                        <Badge
                                            key={c._id}
                                            variant="secondary"
                                            className="bg-muted/50 hover:bg-secondary/80 text-foreground/80 border-border pr-1 group h-8 rounded-full pl-3 font-bold"
                                        >
                                            @{c.username}
                                            <button
                                                type="button"
                                                onClick={() => removeContributor(c._id)}
                                                className="ml-2 p-1 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all"
                                            >
                                                <X className="w-3 h-3 transition-transform group-hover:scale-110" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Advanced Options Accordion */}
                        {/* <Accordion type="single" collapsible className="border-t border-zinc-900">
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
                        </Accordion> */}

                        {/* Prompt Workspace */}
                        <div className="pt-10 border-t border-zinc-900 space-y-8">
                            <h2 className="text-xl font-black text-zinc-100 italic">User Prompt</h2>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Select
                                        value={promptType}
                                        onValueChange={(val) => {
                                            setPromptType(val);
                                            if (val === 'structured') {
                                                setStructuredFormat('json');
                                            } else {
                                                setStructuredFormat('none');
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-[200px] h-11 bg-popover border-border rounded-xl focus:ring-primary/20 font-bold text-foreground">
                                            <SelectValue placeholder="Text Prompt" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-foreground rounded-xl shadow-2xl">
                                            <SelectItem value="text">Text Prompt</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                        <Switch
                                            checked={requiresMedia}
                                            onCheckedChange={setRequiresMedia}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                        Requires Media Upload
                                    </Label>
                                </div>
                            </div>

                            <div className="border border-border rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-900/20 overflow-hidden shadow-2xl">
                                <div className="bg-muted/50 p-4 border-b border-border flex items-center gap-4">
                                    <button type="button" className="flex items-center gap-2 text-[11px] font-black uppercase text-zinc-500 hover:text-primary transition-colors">
                                        <X className="w-4 h-4 text-zinc-500" /> Insert Variable
                                    </button>
                                    <span className="text-[10px] text-zinc-500 font-medium">Use ${"{name}"} or ${"{name:default}"} syntax</span>
                                </div>
                                <Textarea
                                    className="min-h-[350px] bg-transparent border-none focus-visible:ring-0 p-6 font-mono text-sm leading-relaxed resize-y text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                    placeholder={promptType === 'structured' && structuredFormat === 'json' ? '{\n  "name": "My Workflow",\n  "steps": []\n}' : 'Enter your prompt content here ...'}
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
                                <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-400 transition-colors flex items-center gap-2 bg-popover/40 px-3 py-1.5 rounded-full border border-border/50">
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
            </div >
        </>
    );
}
