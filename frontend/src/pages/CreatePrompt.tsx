import { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CreatePrompt() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [promptText, setPromptText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !promptText) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            toast.success("Prompt submitted successfully!");
            navigate("/prompt-refine");
        }, 1000);
    };

    return (
        <>
            <Helmet>
                <title>Submit Prompt | Prompt Raft</title>
                <meta name="description" content="Submit a new daily prompt." />
            </Helmet>

            <div className="min-h-screen bg-background flex flex-col">
                <Header />

                <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground flex items-center gap-2">
                            <Plus className="h-6 w-6" />
                            Submit Prompt
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Submit your day-to-day prompts to use them later or share them with others.
                        </p>
                    </div>

                    <Card className="border-border bg-card/50 backdrop-blur-sm rounded-none border-t-2 border-t-foreground shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-xl">Prompt Details</CardTitle>
                            <CardDescription>
                                Provide the details of your prompt below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Title <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Code Review Assistant"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="font-mono bg-background focus-visible:ring-1 rounded-none border-border"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Description / Category</Label>
                                    <Input
                                        id="description"
                                        placeholder="e.g. Programming, Writing, Analysis"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="font-mono bg-background focus-visible:ring-1 rounded-none border-border"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="promptText" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Prompt Content <span className="text-destructive">*</span></Label>
                                    <Textarea
                                        id="promptText"
                                        placeholder="Enter your full prompt here..."
                                        className="min-h-[200px] font-mono whitespace-pre-wrap bg-background focus-visible:ring-1 rounded-none border-border resize-y"
                                        value={promptText}
                                        onChange={(e) => setPromptText(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="font-mono rounded-none uppercase tracking-wider h-10 px-8"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">Submitting...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Submit Prompt</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </main>

                <Footer />
            </div>
        </>
    );
}
