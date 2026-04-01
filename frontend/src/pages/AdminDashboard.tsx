import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { CardEnhanced, CardEnhancedHeader, CardEnhancedTitle, CardEnhancedContent } from '@/components/ui/card-enhanced';
import { ShieldAlert, Plus, Check, Target, Users, Settings, Trash2, Ban, Swords } from 'lucide-react';
import { toast } from 'sonner';

interface Challenge {
    _id: string;
    title: string;
    description: string;
    targetCount: number;
    rewardXp: number;
    type?: 'daily' | 'weekly';
    deadline?: string;
    isActive: boolean;
    createdAt: string;
}

interface UserData {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    xp: number;
    level: number;
    streak: number;
    lastLoginDate: string;
    isAdmin: boolean;
    isBlocked?: boolean;
    createdAt: string;
}

export default function AdminDashboard() {
    const { user, isAuthenticated } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dailyChallenges');

    // Users state
    const [usersList, setUsersList] = useState<UserData[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Settings state
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attemptsCount, setAttemptsCount] = useState(3);
    const [rewardXp, setRewardXp] = useState(100);
    const [durationDays, setDurationDays] = useState(7);
    const [durationHours, setDurationHours] = useState(0);
    const [durationMinutes, setDurationMinutes] = useState(0);

    // Global Battles state
    const [gbTargetGoal, setGbTargetGoal] = useState("");
    const [gbMaxTokens, setGbMaxTokens] = useState(50);
    const [gbBetAmount, setGbBetAmount] = useState(10);

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

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const res = await axios.get('http://localhost:3000/api/v1/admin/users');
            setUsersList(res.data.users);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load users");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users' && usersList.length === 0) {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchSettings = async () => {
        setIsLoadingSettings(true);
        try {
            const res = await axios.get('http://localhost:3000/api/v1/admin/settings', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setIsMaintenanceMode(res.data.settings.isMaintenanceMode);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load settings");
        } finally {
            setIsLoadingSettings(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'settings') {
            fetchSettings();
        }
    }, [activeTab]);

    if (!isAuthenticated || !user?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handleCreateChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const challengeType = activeTab === 'weeklyChallenges' ? 'weekly' : 'daily';
            await axios.post('http://localhost:3000/api/v1/admin/challenges', {
                title, description, targetCount: attemptsCount, rewardXp, isActive: true, type: challengeType, durationDays, durationHours, durationMinutes
            });
            toast.success("Challenge created and activated!");
            setTitle('');
            setDescription('');
            setAttemptsCount(3);
            setRewardXp(100);
            setDurationDays(7);
            setDurationHours(0);
            setDurationMinutes(0);
            fetchChallenges();
        } catch (e) {
            toast.error("Failed to create challenge");
        }
    };

    const handleCreateGlobalBattle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/v1/battles/global', {
                targetGoal: gbTargetGoal,
                maxTokens: gbMaxTokens,
                betAmount: gbBetAmount
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success("Global Battle Created!");
            setGbTargetGoal('');
            setGbMaxTokens(50);
            setGbBetAmount(10);
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to create battle");
        }
    };

    const handleSetActive = async (id: string) => {
        try {
            await axios.put(`http://localhost:3000/api/v1/admin/challenges/${id}/active`);
            toast.success("Challenge marked as active!");
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

    const handleToggleBlock = async (id: string, currentStatus: boolean | undefined) => {
        try {
            const res = await axios.put(`http://localhost:3000/api/v1/admin/users/${id}/block`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } // Though technically admin fetch interceptors might handle it, just to be safe if it doesn't
            });
            toast.success(res.data.message);
            setUsersList(usersList.map(u =>
                u._id === id ? { ...u, isBlocked: !currentStatus } : u
            ));
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to update user block status");
        }
    };

    const handleToggleMaintenance = async () => {
        if (!window.confirm(`Are you sure you want to ${isMaintenanceMode ? 'disable' : 'enable'} maintenance mode?`)) return;
        try {
            const res = await axios.put('http://localhost:3000/api/v1/admin/settings/maintenance', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setIsMaintenanceMode(res.data.settings.isMaintenanceMode);
            toast.success(res.data.message);
        } catch (e) {
            console.error(e);
            toast.error("Failed to update maintenance mode");
        }
    };

    const navItems = [
        { id: 'dailyChallenges', label: 'Daily Challenges', icon: Target },
        { id: 'weeklyChallenges', label: 'Weekly Challenges', icon: Target },
        { id: 'globalBattles', label: 'Global Battles', icon: Swords },
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
                            {activeTab === 'dailyChallenges' && "Create and manage daily challenges for the Bento Grid."}
                            {activeTab === 'weeklyChallenges' && "Create and manage weekly challenges for the Arena."}
                            {activeTab === 'globalBattles' && "Initialize official 2-player battles open to the entire platform."}
                            {activeTab === 'users' && "View and moderate all registered users on PromptRaft."}
                            {activeTab === 'settings' && "Configure global application settings and theme defaults."}
                        </p>
                    </div>

                    {/* Active Tab Content */}
                    {(activeTab === 'dailyChallenges' || activeTab === 'weeklyChallenges') && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
                            {/* Create Challenge Form */}
                            <CardEnhanced variant="outline" className="h-[600px] flex flex-col">
                                <CardEnhancedHeader>
                                    <CardEnhancedTitle>Create {activeTab === 'weeklyChallenges' ? 'Weekly' : 'Daily'} Challenge</CardEnhancedTitle>
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
                                            {activeTab === 'dailyChallenges' && (
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
                                            )}
                                            {activeTab === 'weeklyChallenges' && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-center">Days</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            max="30"
                                                            className="w-full p-2 border rounded bg-background text-center text-sm"
                                                            value={durationDays}
                                                            onChange={e => setDurationDays(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-center">Hours</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            max="23"
                                                            className="w-full p-2 border rounded bg-background text-center text-sm"
                                                            value={durationHours}
                                                            onChange={e => setDurationHours(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-center">Mins</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            max="59"
                                                            className="w-full p-2 border rounded bg-background text-center text-sm"
                                                            value={durationMinutes}
                                                            onChange={e => setDurationMinutes(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            )}
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
                                    ) : challenges.filter(c => activeTab === 'weeklyChallenges' ? c.type === 'weekly' : (c.type === 'daily' || !c.type)).length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-muted-foreground">No challenges created yet.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                            {challenges.filter(c => activeTab === 'weeklyChallenges' ? c.type === 'weekly' : (c.type === 'daily' || !c.type)).map(challenge => (
                                                <div key={challenge._id} className={`p-4 border rounded-lg flex flex-col gap-3 transition-colors ${challenge.isActive ? 'border-neutral-800 dark:border-neutral-200 bg-neutral-100 dark:bg-neutral-800/50' : 'border-neutral-200 dark:border-neutral-800'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                                                {challenge.title}
                                                                {challenge.isActive && <span className="bg-red-600 text-white dark:bg-red-500/50 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-bold shadow-sm animate-pulse-slow">🔥 {activeTab === 'weeklyChallenges' ? 'Active Weekly' : 'Today\'s Hot'}</span>}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                                                        </div>
                                                        <Button variant="custom3" size="icon" className="text-muted-foreground hover:text-black dark:hover:text-white shrink-0 -mt-1 -mr-1" onClick={() => handleDeleteChallenge(challenge._id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800/50">
                                                        <div className="flex gap-4 text-sm font-medium">
                                                            {challenge.type === 'daily' && (
                                                                <span className="flex items-center gap-1 text-muted-foreground"><Target className="w-3 h-3" /> {challenge.targetCount} Attempts</span>
                                                            )}
                                                            {challenge.type === 'weekly' && challenge.deadline && (
                                                                <span className="flex items-center gap-1 text-red-500 font-bold tracking-wide">
                                                                    ⏱ {(() => {
                                                                        const diffMs = new Date(challenge.deadline).getTime() - Date.now();
                                                                        if (diffMs <= 0) return 'Expired';
                                                                        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                                                        const hrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                                        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                                                        return `${days}d ${hrs}h ${mins}m Left`;
                                                                    })()}
                                                                </span>
                                                            )}
                                                            <span className="text-foreground font-bold">✨ {challenge.rewardXp} XP</span>
                                                        </div>
                                                        {!challenge.isActive && (
                                                            <Button variant="outline" size="sm" onClick={() => handleSetActive(challenge._id)} className="border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                                                Set as {activeTab === 'weeklyChallenges' ? 'Active Weekly' : 'Today\'s Hot'}
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

                    {/* Global Battles Tab */}
                    {activeTab === 'globalBattles' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
                            <CardEnhanced variant="outline" className="h-[600px] flex flex-col">
                                <CardEnhancedHeader>
                                    <div className="flex items-center gap-2">
                                        <Swords className="w-5 h-5 text-orange-500" />
                                        <CardEnhancedTitle>Create Global Battle</CardEnhancedTitle>
                                    </div>
                                </CardEnhancedHeader>
                                <CardEnhancedContent className="flex-1 overflow-y-auto custom-scrollbar">
                                    <form onSubmit={handleCreateGlobalBattle} className="space-y-4">
                                        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg mb-4 text-sm text-foreground">
                                            A Global Battle is an empty template. Player 1 joins and locks in their prompt, then Player 2 joins to execute the duel.
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Target Goal</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-2 border rounded bg-background"
                                                value={gbTargetGoal}
                                                onChange={e => setGbTargetGoal(e.target.value)}
                                                placeholder="e.g., Code a functional Snake game in Python"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Max Tokens</label>
                                                <input
                                                    type="number"
                                                    required min="1"
                                                    className="w-full p-2 border rounded bg-background"
                                                    value={gbMaxTokens}
                                                    onChange={e => setGbMaxTokens(Number(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Entry Fee (XP)</label>
                                                <input
                                                    type="number"
                                                    required min="0"
                                                    className="w-full p-2 border rounded bg-background"
                                                    value={gbBetAmount}
                                                    onChange={e => setGbBetAmount(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full gap-2 mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                                            <Plus className="w-4 h-4" /> Broadcast Global Battle
                                        </Button>
                                    </form>
                                </CardEnhancedContent>
                            </CardEnhanced>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="h-full flex flex-col">
                            <CardEnhanced variant="custom1" className="flex-1 flex flex-col min-h-0">
                                <CardEnhancedHeader>
                                    <div className="flex items-center justify-between">
                                        <CardEnhancedTitle>Registered Users</CardEnhancedTitle>
                                        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoadingUsers}>
                                            {isLoadingUsers ? 'Refreshing...' : 'Refresh'}
                                        </Button>
                                    </div>
                                </CardEnhancedHeader>
                                <CardEnhancedContent className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                    {isLoadingUsers && usersList.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                                            <p className="text-muted-foreground animate-pulse">Loading users...</p>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 border-b border-border z-10">
                                                    <tr>
                                                        <th className="p-4 font-medium text-sm text-muted-foreground">User</th>
                                                        <th className="p-4 font-medium text-sm text-muted-foreground">Level / XP</th>
                                                        <th className="p-4 font-medium text-sm text-muted-foreground">Streak</th>
                                                        <th className="p-4 font-medium text-sm text-muted-foreground">Joined</th>
                                                        <th className="p-4 font-medium text-sm text-muted-foreground">Role</th>
                                                        <th className="p-4 font-medium text-sm text-muted-foreground text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {usersList.map((u) => (
                                                        <tr key={u._id} className="border-b border-border hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                            <td className="p-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-foreground">{u.firstName} {u.lastName}</span>
                                                                    <span className="text-sm text-muted-foreground">@{u.username.split('@')[0]}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-wide">Lvl {u.level}</span>
                                                                    <span className="text-sm text-muted-foreground">{u.xp} XP</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="flex items-center gap-1 text-sm"><span className="text-orange-500">🔥</span> {u.streak}</span>
                                                            </td>
                                                            <td className="p-4 text-sm text-muted-foreground">
                                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="p-4">
                                                                {u.isAdmin ? (
                                                                    <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max">
                                                                        <ShieldAlert className="w-3 h-3" /> Admin
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-1 rounded text-xs font-medium w-max">
                                                                        {u.isBlocked ? (
                                                                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><Ban className="w-3 h-3" /> Blocked</span>
                                                                        ) : 'User'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                {!u.isAdmin && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                                                                        className={u.isBlocked ? "text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20" : "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"}
                                                                    >
                                                                        {u.isBlocked ? 'Unblock' : 'Block'}
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {usersList.length === 0 && !isLoadingUsers && (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    No users found.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardEnhancedContent>
                            </CardEnhanced>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="h-full flex flex-col gap-6">
                            <CardEnhanced variant="outline" className="h-full max-h-[600px] flex flex-col">
                                <CardEnhancedHeader>
                                    <div className="flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        <CardEnhancedTitle>Platform Configuration</CardEnhancedTitle>
                                    </div>
                                </CardEnhancedHeader>
                                <CardEnhancedContent className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                                    {/* Maintenance Control */}
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-800/20">
                                        <div>
                                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                                Maintenance Mode
                                                {isMaintenanceMode && <span className="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 text-xs px-2 py-0.5 rounded font-bold animate-pulse-slow">ACTIVE</span>}
                                            </h3>
                                            <p className="text-muted-foreground text-sm max-w-lg">
                                                When enabled, standard users will be unable to log in, sign up, or use the platform. They will be met with a maintenance screen. Admins are unaffected and can continue to access the dashboard.
                                            </p>
                                        </div>
                                        <Button
                                            variant={isMaintenanceMode ? "custom3" : "default"}
                                            onClick={handleToggleMaintenance}
                                            disabled={isLoadingSettings}
                                            className={isMaintenanceMode ? "text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200 dark:border-red-900/50 dark:hover:bg-red-900/20 w-full md:w-auto" : "w-full md:w-auto mt-2 md:mt-0"}
                                        >
                                            {isLoadingSettings ? "Loading..." : isMaintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                                        </Button>
                                    </div>

                                </CardEnhancedContent>
                            </CardEnhanced>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
