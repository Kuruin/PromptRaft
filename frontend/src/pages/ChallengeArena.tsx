import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Swords, Trophy, Target, Zap, Star } from "lucide-react";
import axios from "axios";
import Header from "@/components/Header";

interface Challenge {
    _id: string;
    title: string;
    description: string;
    targetCount: number;
    rewardXp: number;
    deadline?: string;
    isActive: boolean;
}

export default function ChallengeArena() {
    const { isAuthenticated, refreshProfile } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [prompt, setPrompt] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

    const fetchLeaderboard = async (challengeId: string) => {
        setIsLeaderboardLoading(true);
        try {
            const res = await axios.get(`http://localhost:3000/api/v1/challenges/${challengeId}/leaderboard`);
            setLeaderboard(res.data.leaderboard || []);
        } catch (err) {
            console.error("Failed to fetch leaderboard");
        } finally {
            setIsLeaderboardLoading(false);
        }
    };

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
                    fetchLeaderboard(active._id);
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
            fetchLeaderboard(activeChallenge._id); // Refresh rankings

            if (res.data.xpAwarded > 0) {
                if (res.data.streakInfo && res.data.streakInfo.streakBonus > 1.0) {
                    toast.success(`You earned ${res.data.xpAwarded} XP! (${res.data.streakInfo.streakBonus}x Streak Bonus 🔥)`, { icon: <Zap className="w-4 h-4 text-yellow-500" /> });
                } else {
                    toast.success(`You earned ${res.data.xpAwarded} XP!`, { icon: <Zap className="w-4 h-4 text-yellow-500" /> });
                }
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

                {challenges.length > 1 && (
                    <div className="mb-8 flex overflow-x-auto pb-4 gap-3 scrollbar-none">
                        {challenges.map(c => (
                            <button
                                key={c._id}
                                onClick={() => {
                                    setActiveChallenge(c);
                                    fetchLeaderboard(c._id);
                                    setResult(null);
                                    setPrompt('');
                                }}
                                className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all border-2 flex items-center gap-2 outline-none ${activeChallenge?._id === c._id ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-muted/20 hover:border-primary/50 text-muted-foreground hover:bg-background'}`}
                            >
                                {c.isActive && <Star className={`w-4 h-4 ${activeChallenge?._id === c._id ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-500 fill-yellow-500'}`} />}
                                {c.title}
                            </button>
                        ))}
                    </div>
                )}

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
                                {activeChallenge.deadline && (
                                    <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 inline-flex items-center gap-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-red-500">EXPIRES</p>
                                        <p className="text-sm font-bold text-red-400">
                                            {new Date(activeChallenge.deadline).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                )}
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
                                            {result.streakInfo?.streakBonus > 1.0 && (
                                                <span className="ml-2 bg-orange-500/20 text-orange-500 text-xs px-2 py-1 rounded font-black tracking-widest border border-orange-500/20">
                                                    {result.streakInfo.streakBonus}X 🔥
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Leaderboard Panel */}
                        <Card className="border-border shadow-sm bg-background">
                            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Trophy className="w-5 h-5 text-yellow-500" /> Top Engineers
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLeaderboardLoading ? (
                                    <div className="p-6 text-center text-muted-foreground animate-pulse">Loading rankings...</div>
                                ) : leaderboard.length === 0 ? (
                                    <div className="p-6 text-center text-muted-foreground">No submissions yet. Be the first!</div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {leaderboard.map((entry, idx) => (
                                            <div key={entry._id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-black text-lg w-6 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-sm leading-none flex items-center gap-2">
                                                            {entry.userId?.firstName} {entry.userId?.lastName}
                                                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-black tracking-widest">LVL {entry.userId?.level}</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1 text-left">@{entry.userId?.username.split('@')[0]}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-lg text-foreground">{entry.highestScore}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Score</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
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
