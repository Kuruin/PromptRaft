import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardEnhanced, CardEnhancedContent, CardEnhancedHeader, CardEnhancedTitle } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/badge";
import { Swords, Trophy, Clock, History, AlertCircle, Coins, Plus } from "lucide-react";

interface Battle {
    _id: string;
    isGlobal?: boolean;
    challengerId?: { _id: string; username: string; level: number };
    opponentId?: { _id: string; username: string; level: number };
    winnerId?: { _id: string; username: string; level: number };
    targetGoal: string;
    maxTokens: number;
    betAmount: number;
    status: 'open' | 'completed';
    aiReasoning?: string;
    createdAt: string;
}

export default function BattleArena() {
    const { user, isAuthenticated } = useAuth();
    const [battles, setBattles] = useState<Battle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create Battle Form State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newGoal, setNewGoal] = useState("");
    const [newMaxTokens, setNewMaxTokens] = useState("50");
    const [newBet, setNewBet] = useState("10");
    const [newPrompt, setNewPrompt] = useState("");

    // Accept Battle Form State
    const [isAcceptOpen, setIsAcceptOpen] = useState(false);
    const [acceptingBattle, setAcceptingBattle] = useState<Battle | null>(null);
    const [opponentPrompt, setOpponentPrompt] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBattles = async () => {
        try {
            const res = await axios.get("http://localhost:3000/api/v1/battles", {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setBattles(res.data.battles || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load battles");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchBattles();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const handleCreateBattle = async () => {
        if (!newGoal || !newPrompt || !newMaxTokens) {
            toast.error("Please fill in all fields");
            return;
        }

        const betAmount = parseInt(newBet);
        if (betAmount < 0 || isNaN(betAmount)) {
            toast.error("Invalid bet amount");
            return;
        }

        if (user && user.xp < betAmount) {
            toast.error("Not enough XP to place this bet");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post("http://localhost:3000/api/v1/battles", {
                targetGoal: newGoal,
                maxTokens: parseInt(newMaxTokens),
                betAmount: betAmount,
                challengerPrompt: newPrompt
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            toast.success("Battle Created!");
            setIsCreateOpen(false);

            // Reset form
            setNewGoal("");
            setNewMaxTokens("50");
            setNewBet("10");
            setNewPrompt("");

            fetchBattles();

            // Since XP is deducted, user might want to refresh profile. But for simplicity, next login/refresh handles it or Context handles it.
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to create battle");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAcceptBattle = async () => {
        if (!acceptingBattle || !opponentPrompt) {
            toast.error("Please enter a prompt");
            return;
        }

        if (user && user.xp < acceptingBattle.betAmount) {
            toast.error("Not enough XP to match this bet");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post(`http://localhost:3000/api/v1/battles/${acceptingBattle._id}/accept`, {
                opponentPrompt
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const { winner, reasoning, potSize } = res.data;

            if (winner === "tie") {
                toast.info("It's a TIE! The AI refunded the bets.", { duration: 5000 });
            } else if (res.data.battle.winnerId === user?._id) {
                toast.success(`YOU WON! Collected ${potSize} XP!`, { duration: 6000, icon: <Trophy className="text-yellow-500 w-5 h-5" /> });
            } else {
                toast.error("You lost this battle... better luck next time!", { duration: 5000 });
            }

            setIsAcceptOpen(false);
            setOpponentPrompt("");
            setAcceptingBattle(null);
            fetchBattles();

        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to process battle submission");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openBattles = battles.filter(b => b.status === "open");
    const completedBattles = battles.filter(b => b.status === "completed");

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                        <Swords className="w-16 h-16 mx-auto opacity-30" />
                        <h2 className="text-2xl font-bold">Login to enter the Battle Arena</h2>
                        <p className="text-muted-foreground">Bet your XP and challenge other AI Engineers to token duels.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 container max-w-6xl mx-auto py-8 px-4 md:px-6">

                {/* Arena Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            <Swords className="w-8 h-8 text-orange-500" />
                            Battle Arena
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl">
                            1v1 Async Duels. Create an open challenge with a specific goal and a strict max-token limit. Put your XP on the line, and let the AI Judge decide the winner.
                        </p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white font-bold tracking-wide">
                                <Plus className="w-5 h-5 mr-2" />
                                CREATE BATTLE
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-background border-border">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-orange-500 flex items-center gap-2">
                                    <Swords className="w-5 h-5" /> Initialize Duel
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target Goal / Task</label>
                                    <Input
                                        placeholder="e.g. Generate a functioning python snake game"
                                        value={newGoal}
                                        onChange={(e) => setNewGoal(e.target.value)}
                                        className="font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground leading-relaxed">The AI Judge will independently verify if your prompt successfully achieves this exact goal.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Max Tokens</label>
                                        <Input
                                            type="number"
                                            value={newMaxTokens}
                                            onChange={(e) => setNewMaxTokens(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
                                            <Coins className="w-4 h-4" /> XP Bet Amount
                                        </label>
                                        <Input
                                            type="number"
                                            value={newBet}
                                            onChange={(e) => setNewBet(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Prompt Submission</label>
                                    <Textarea
                                        placeholder="Write your ultra-optimized prompt here..."
                                        className="h-32 font-mono"
                                        value={newPrompt}
                                        onChange={(e) => setNewPrompt(e.target.value)}
                                    />
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">This is hidden from opponents until judging.</span>
                                        <span className="font-mono text-primary font-bold">{Math.ceil(newPrompt.length / 4)} tokens used</span>
                                    </div>
                                </div>

                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleCreateBattle}
                                    disabled={isSubmitting}
                                    className="bg-red-600 hover:bg-red-700 w-full font-bold h-12"
                                >
                                    {isSubmitting ? "Initiating..." : "PLACE BET & CREATE BATTLE"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <Tabs defaultValue="open" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
                        <TabsTrigger value="open">Open Lobby</TabsTrigger>
                        <TabsTrigger value="history">Battle History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="open" className="space-y-6">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">Loading Arena...</div>
                        ) : openBattles.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-border rounded-xl">
                                <Swords className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-bold mb-2">The Arena is Quiet</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">No open battles currently available. Be the first to throw down a challenge!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {openBattles.map(battle => (
                                    <CardEnhanced key={battle._id} variant="default" className="relative group overflow-hidden">
                                        {/* Background glow decoration */}
                                        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all"></div>

                                        <CardEnhancedHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className={battle.isGlobal ? "text-yellow-500 border-yellow-500/50 bg-yellow-500/10 uppercase tracking-widest text-[10px]" : "text-orange-500 border-orange-500/50 bg-orange-500/10 uppercase tracking-widest text-[10px]"}>
                                                    {battle.isGlobal ? "Global Event" : "Open Duel"}
                                                </Badge>
                                                <div className="flex items-center gap-1.5 text-orange-500 font-black">
                                                    <Coins className="w-4 h-4" />
                                                    <span>{battle.betAmount} XP Pot</span>
                                                </div>
                                            </div>
                                            <CardEnhancedTitle className="text-xl mt-4 leading-tight">
                                                {battle.targetGoal}
                                            </CardEnhancedTitle>
                                        </CardEnhancedHeader>

                                        <CardEnhancedContent>
                                            <div className="flex items-center gap-4 text-sm mt-2 mb-6 text-muted-foreground bg-black/20 p-3 rounded-lg border border-white/5">
                                                <div className="flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4 text-primary" />
                                                    <span className="font-mono">Max: {battle.maxTokens} Tokens</span>
                                                </div>
                                                <div className="flex items-center gap-1 border-l border-border pl-4">
                                                    <Swords className="w-4 h-4" />
                                                    <span>Challenger: <span className="text-foreground font-bold">{battle.challengerId?.username || "Awaiting P1"}</span> {battle.challengerId && `(Lv.${battle.challengerId.level})`}</span>
                                                </div>
                                            </div>

                                            <Dialog open={isAcceptOpen && acceptingBattle?._id === battle._id} onOpenChange={(open) => {
                                                setIsAcceptOpen(open);
                                                if (!open) setAcceptingBattle(null);
                                                else setAcceptingBattle(battle);
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        className={battle.isGlobal ? "w-full bg-yellow-600/10 text-yellow-500 border border-yellow-500/50 hover:bg-yellow-600 hover:text-white group transition-all" : "w-full bg-orange-600/10 text-orange-500 border border-orange-500/50 hover:bg-orange-600 hover:text-white group transition-all"}
                                                        disabled={user?._id === battle.challengerId?._id}
                                                    >
                                                        {user?._id === battle.challengerId?._id ? "Awaiting Opponent..." : (
                                                            <>
                                                                <Swords className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" />
                                                                {battle.isGlobal && !battle.challengerId ? `JOIN AS P1 & BET (${battle.betAmount} XP)` : `ACCEPT & MATCH BET (${battle.betAmount} XP)`}
                                                            </>
                                                        )}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[700px] border-orange-500/30">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-black text-orange-500 flex items-center gap-2">
                                                            <Swords className="w-5 h-5" /> Duel Submission
                                                        </DialogTitle>
                                                    </DialogHeader>

                                                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg my-4 space-y-2">
                                                        <div className="text-xs uppercase text-orange-500 font-bold tracking-wider">The Objective</div>
                                                        <div className="text-lg font-bold">{battle.targetGoal}</div>
                                                        <div className="flex gap-4 mt-2">
                                                            <Badge variant="outline" className="font-mono bg-black/40 text-muted-foreground border-neutral-800">Max Tokens: {battle.maxTokens}</Badge>
                                                            <Badge variant="outline" className="font-mono bg-black/40 text-orange-400 border-neutral-800">You Bet: {battle.betAmount} XP</Badge>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mt-4">
                                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Competing Prompt</label>
                                                        <Textarea
                                                            placeholder="Outsmart the challenger..."
                                                            className="h-40 font-mono text-base"
                                                            value={opponentPrompt}
                                                            onChange={(e) => setOpponentPrompt(e.target.value)}
                                                        />
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground">The AI Judge will evaluate immediately upon submission.</span>
                                                            <span className={`font-mono font-bold ${Math.ceil(opponentPrompt.length / 4) > battle.maxTokens ? 'text-red-500' : 'text-primary'}`}>
                                                                {Math.ceil(opponentPrompt.length / 4)} / {battle.maxTokens} tokens
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-6">
                                                        <Button
                                                            onClick={handleAcceptBattle}
                                                            disabled={isSubmitting || Math.ceil(opponentPrompt.length / 4) > battle.maxTokens}
                                                            className="bg-orange-600 hover:bg-orange-700 w-full font-bold h-12"
                                                        >
                                                            {isSubmitting ? "The AI Judges are deliberating..." : "SUBMIT & EXECUTE DUEL"}
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </CardEnhancedContent>
                                    </CardEnhanced>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">Loading Records...</div>
                        ) : completedBattles.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                No battle history found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {completedBattles.map(battle => {
                                    const iWon = battle.winnerId && battle.winnerId._id === user?._id;
                                    const iParticipated = battle.challengerId?._id === user?._id || battle.opponentId?._id === user?._id;

                                    return (
                                        <CardEnhanced key={battle._id} variant={iWon ? "accent" : "default"} className="opacity-90 hover:opacity-100 transition-opacity">
                                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground font-mono">{new Date(battle.createdAt).toLocaleString()}</span>
                                                        {iParticipated && (
                                                            <Badge variant={iWon ? "default" : "destructive"} className={iWon ? "bg-primary text-black ml-2" : "ml-2"}>
                                                                {iWon ? "+ Won" : "- Defeat"}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="text-xl font-bold">{battle.targetGoal}</h3>
                                                    <div className="text-sm text-muted-foreground font-mono bg-black/20 p-2 rounded inline-block mt-2">
                                                        Constraint: {battle.maxTokens} Tokens
                                                    </div>
                                                </div>

                                                <div className="flex-1 w-full flex items-center justify-between border border-border/50 rounded-lg p-4 bg-background">
                                                    <div className="text-center flex-1">
                                                        <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Challenger</div>
                                                        <div className={`font-bold ${battle.winnerId?._id === battle.challengerId?._id ? 'text-primary' : 'text-foreground'}`}>
                                                            {battle.challengerId?.username}
                                                        </div>
                                                    </div>
                                                    <div className="px-4 text-muted-foreground text-sm font-black italic">VS</div>
                                                    <div className="text-center flex-1">
                                                        <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Opponent</div>
                                                        <div className={`font-bold ${battle.winnerId?._id === battle.opponentId?._id ? 'text-primary' : 'text-foreground'}`}>
                                                            {battle.opponentId?.username || "Unknown"}
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            {battle.aiReasoning && (
                                                <div className="border-t border-border/50 bg-black/10 px-6 py-4 md:px-8">
                                                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                                                        <span className="text-primary font-bold mr-2">JUDGEMENT:</span>
                                                        {battle.aiReasoning}
                                                    </p>
                                                </div>
                                            )}
                                        </CardEnhanced>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

            </main>
        </div>
    );
}
