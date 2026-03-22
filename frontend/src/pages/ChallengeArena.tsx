import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Swords, Trophy, Target, Zap } from "lucide-react";
import axios from "axios";
import Header from "@/components/Header";

interface Challenge {
    _id: string;
    title: string;
    description: string;
    targetCount: number;
    rewardXp: number;
    isActive: boolean;
}

export default function ChallengeArena() {
    const { isAuthenticated, refreshProfile } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [prompt, setPrompt] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        // Fetch weekly challenges on load
        const fetchChallenges = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/v1/challenges/weekly");
                if (res.data.challenges && res.data.challenges.length > 0) {
                    setChallenges(res.data.challenges);
                    // Pick the active one, or fallback to first
                    const active = res.data.challenges.find((c: Challenge) => c.isActive) || res.data.challenges[0];
                    setActiveChallenge(active);
                }
            } catch (err) {
                toast.error("Failed to load weekly challenges");
            }
        };
        fetchChallenges();
    }, []);

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            toast.error("You must be logged in to participate");
            return;
        }
        if (!activeChallenge) return;
        if (prompt.trim().length === 0) {
            toast.error("Prompt cannot be empty");
            return;
        }

        setIsSubmitting(true);
        setResult(null);

        try {
            const res = await axios.post(`http://localhost:3000/api/v1/challenges/${activeChallenge._id}/submit`, {
                prompt
            });

            setResult(res.data);

            if (res.data.xpAwarded > 0) {
                toast.success(`You earned ${res.data.xpAwarded} XP!`, { icon: <Zap className="w-4 h-4 text-yellow-500" /> });
                refreshProfile(); // Update context user state

                if (res.data.leveledUp) {
                    toast.success(`LEVEL UP! You are now level ${res.data.newLevel}`, {
                        duration: 5000,
                        icon: <Trophy className="w-5 h-5 text-yellow-500" />
                    });
                }
            } else {
                toast.info("No XP awarded this time. Keep trying!");
            }

        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to submit challenge");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!activeChallenge) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center animate-pulse flex flex-col items-center">
                        <Swords className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground text-lg">No active challenges in the Arena right now.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate strictness/token visualization
    const tokenEstimate = Math.ceil(prompt.length / 4);
    let lengthColor = "text-green-500";
    if (tokenEstimate > 20) lengthColor = "text-yellow-500";
    if (tokenEstimate > 40) lengthColor = "text-red-500";

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />

            <main className="flex-1 container max-w-6xl py-12 px-6">
                <div className="mb-8 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Swords className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight">The Arena</h1>
                        <p className="text-muted-foreground text-lg">Weekly Prompt Golf — Achieve the goal using the fewest tokens.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Active Challenge Info */}
                    <div className="flex flex-col gap-6">
                        <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Target className="w-24 h-24" />
                            </div>
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                        <Zap className="w-4 h-4" /> WEEKLY BOUNTY
                                    </span>
                                    <span className="text-xs font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 px-3 py-1 rounded-full">
                                        +{activeChallenge.rewardXp} XP
                                    </span>
                                </div>
                                <CardTitle className="text-3xl font-bold">{activeChallenge.title}</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    {activeChallenge.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-background/50 rounded-lg border border-border mt-4">
                                    <h4 className="text-sm font-semibold mb-2">RULES:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                                        <li>Achieve the goal specifically as requested.</li>
                                        <li>Token efficiency matters! Shorter prompts score higher.</li>
                                        <li>Must circumvent any system prompt constraints naturally.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Results Panel */}
                        {result && (
                            <Card className={`border-2 transition-all duration-500 ${result.score >= 80 ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>AI Evaluator Verdict</span>
                                        <span className={`text-3xl font-black ${result.score >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {result.score}/100
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-medium mb-4">{result.feedback}</p>
                                    {result.xpAwarded > 0 && (
                                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-bold bg-yellow-500/10 p-3 rounded-lg w-fit">
                                            <Trophy className="w-5 h-5" />
                                            Earned {result.xpAwarded} XP
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* User Input Area */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Your Prompt</label>
                            <div className={`text-xs font-bold ${lengthColor} flex items-center gap-1 bg-background px-2 py-1 rounded border border-border`}>
                                Est. Tokens: {tokenEstimate}
                            </div>
                        </div>
                        <Textarea
                            className="flex-1 min-h-[400px] text-lg p-6 resize-none focus-visible:ring-primary font-mono shadow-inner"
                            placeholder="Write your prompt here..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className="mt-4 flex justify-end">
                            <Button
                                size="lg"
                                className="w-full md:w-auto font-bold text-md px-8 h-14 uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                onClick={handleSubmit}
                                disabled={isSubmitting || prompt.trim() === ""}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Evaluating...</>
                                ) : (
                                    <><Swords className="w-5 h-5 mr-2" /> Submit to Arena</>
                                )}
                            </Button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
