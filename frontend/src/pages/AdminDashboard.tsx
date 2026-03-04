import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { CardEnhanced, CardEnhancedHeader, CardEnhancedTitle, CardEnhancedContent } from '@/components/ui/card-enhanced';
import { ShieldAlert, Plus, Check, Target, Users, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Challenge {
    _id: string;
    title: string;
    description: string;
    targetCount: number;
    rewardXp: number;
    isActive: boolean;
    createdAt: string;
}

export default function AdminDashboard() {
    const { user, isAuthenticated } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('challenges');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attemptsCount, setAttemptsCount] = useState(2);
    const [rewardXp, setRewardXp] = useState(100);

    const fetchChallenges = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/v1/admin/challenges');
            setChallenges(res.data.challenges);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load challenges");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?.isAdmin) {
            fetchChallenges();
        }
    }, [isAuthenticated, user]);

    if (!isAuthenticated || !user?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handleCreateChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/v1/admin/challenges', {
                title, description, targetCount: attemptsCount, rewardXp, isActive: true
            });
            toast.success("Challenge created and activated!");
            setTitle('');
            setDescription('');
            setAttemptsCount(2);
            setRewardXp(100);
            fetchChallenges();
        } catch (e) {
            toast.error("Failed to create challenge");
        }
    };

    const handleSetActive = async (id: string) => {
        try {
            await axios.put(`http://localhost:3000/api/v1/admin/challenges/${id}/active`);
            toast.success("Challenge marked as Today's Hot!");
            fetchChallenges();
        } catch (e) {
            toast.error("Failed to update challenge");
        }
    };

    const handleDeleteChallenge = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this challenge?")) return;
        try {
            await axios.delete(`http://localhost:3000/api/v1/admin/challenges/${id}`);
            toast.success("Challenge deleted");
            fetchChallenges();
        } catch (e) {
            toast.error("Failed to delete challenge");
        }
    };

    const navItems = [
        { id: 'challenges', label: 'Daily Challenges', icon: Target },
        { id: 'users', label: 'Manage Users', icon: Users },
        { id: 'settings', label: 'Platform Settings', icon: Settings },
    ];

    return (
        <div className="h-screen dark:bg-[#1a1a1a] flex flex-col overflow-hidden">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-border bg-neutral-50 dark:bg-neutral-900/50 flex flex-col">
                    <div className="p-6 border-b border-border flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6 text-destructive" />
                        <h2 className="font-bold text-lg">Admin Central</h2>
                    </div>
                    <div className="p-4 flex-1 space-y-2">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === item.id
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-foreground'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {/* Page Header */}
                    <div className="mb-8 border-b border-border pb-6 pt-2">
                        <h1 className="text-3xl font-bold">
                            {navItems.find(n => n.id === activeTab)?.label}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {activeTab === 'challenges' && "Create and manage daily challenges for the learning grid."}
                            {activeTab === 'users' && "View and moderate all registered users on PromptRaft."}
                            {activeTab === 'settings' && "Configure global application settings and theme defaults."}
                        </p>
                    </div>

                    {/* Active Tab Content */}
                    {activeTab === 'challenges' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
                            {/* Create Challenge Form */}
                            <CardEnhanced variant="outline" className="h-[600px] flex flex-col">
                                <CardEnhancedHeader>
                                    <CardEnhancedTitle>Create Daily Challenge</CardEnhancedTitle>
                                </CardEnhancedHeader>
                                <CardEnhancedContent className="flex-1 overflow-y-auto custom-scrollbar">
                                    <form onSubmit={handleCreateChallenge} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-2 border rounded bg-background"
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                placeholder="e.g., Code Refiner"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Description</label>
                                            <textarea
                                                required
                                                className="w-full p-2 border rounded bg-background resize-none h-24 custom-scrollbar"
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="Refine 3 prompts related to software development"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Attempts</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    className="w-full p-2 border rounded bg-background"
                                                    value={attemptsCount}
                                                    onChange={e => setAttemptsCount(Number(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Reward XP</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="50"
                                                    className="w-full p-2 border rounded bg-background"
                                                    value={rewardXp}
                                                    onChange={e => setRewardXp(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full gap-2 mt-4">
                                            <Plus className="w-4 h-4" /> Create & Activate
                                        </Button>
                                    </form>
                                </CardEnhancedContent>
                            </CardEnhanced>

                            {/* Challenges List */}
                            <CardEnhanced variant="custom1" className="h-[600px] flex flex-col">
                                <CardEnhancedHeader>
                                    <CardEnhancedTitle>Manage Challenges</CardEnhancedTitle>
                                </CardEnhancedHeader>
                                <CardEnhancedContent className="flex-1 flex flex-col min-h-0">
                                    {isLoading ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-muted-foreground animate-pulse">Loading challenges...</p>
                                        </div>
                                    ) : challenges.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-muted-foreground">No challenges created yet.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                            {challenges.map(challenge => (
                                                <div key={challenge._id} className={`p-4 border rounded-lg flex flex-col gap-3 transition-colors ${challenge.isActive ? 'border-neutral-800 dark:border-neutral-200 bg-neutral-100 dark:bg-neutral-800/50' : 'border-neutral-200 dark:border-neutral-800'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                                                {challenge.title}
                                                                {challenge.isActive && <span className="bg-red-600 text-white dark:bg-red-500/50 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-bold shadow-sm animate-pulse-slow">🔥 Today's Hot</span>}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                                                        </div>
                                                        <Button variant="custom3" size="icon" className="text-muted-foreground hover:text-black dark:hover:text-white shrink-0 -mt-1 -mr-1" onClick={() => handleDeleteChallenge(challenge._id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800/50">
                                                        <div className="flex gap-4 text-sm font-medium">
                                                            <span className="flex items-center gap-1 text-muted-foreground"><Target className="w-3 h-3" /> {challenge.targetCount} Attempts</span>
                                                            <span className="text-foreground font-bold">✨ {challenge.rewardXp} XP</span>
                                                        </div>
                                                        {!challenge.isActive && (
                                                            <Button variant="outline" size="sm" onClick={() => handleSetActive(challenge._id)} className="border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                                                Set as Today's Hot
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardEnhancedContent>
                            </CardEnhanced>
                        </div>
                    )}

                    {/* Placeholder for Users Tab */}
                    {activeTab === 'users' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                            <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-2xl font-bold">User Management</h3>
                            <p className="text-muted-foreground mt-2 max-w-md">
                                This section will allow you to view registered users, modify their XP/roles, and moderate their prompt projects.
                            </p>
                            <Button variant="outline" className="mt-8">Module Coming Soon</Button>
                        </div>
                    )}

                    {/* Placeholder for Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                            <Settings className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-2xl font-bold">Platform Settings</h3>
                            <p className="text-muted-foreground mt-2 max-w-md">
                                Configure global application variables, theme defaults, and API keys for the backend services.
                            </p>
                            <Button variant="outline" className="mt-8">Module Coming Soon</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
