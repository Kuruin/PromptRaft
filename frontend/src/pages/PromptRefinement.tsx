import { useEffect, useState, useRef } from "react";
// Removed unused imports since they are handled in the child component now
import { Lock, Unlock, RotateCcw, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardEnhanced, CardEnhancedContent, CardEnhancedDescription, CardEnhancedHeader, CardEnhancedTitle } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Copy, RefreshCw, Sparkles, Trophy, Target, BookOpen, Save, History as HistoryIcon, Layout, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import axios from 'axios';
import { Minimize2, Maximize2 } from "lucide-react";
import CircularProgressBar from "@/components/Circular-bar";
import { useAuth } from "@/context/AuthContext";
import { PromptSidebar } from "@/components/PromptSidebar";
import { DraggableBentoGrid } from "@/components/DraggableBentoGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useLongPress } from "@/hooks/useLongPress";
import { Undo2, Redo2 } from "lucide-react";

interface PromptVersion {
  _id: string;
  versionNumber: number;
  content: string;
  refinedContent?: string;
  aiFeedback: string;
  aiScore: number;
  createdAt: string;
}

interface PromptProject {
  _id: string;
  title: string;
  updatedAt: string;
}

const PromptRefinement = () => {
  const { user, isAuthenticated, refreshProfile } = useAuth();

  // Project State
  const [prompts, setPrompts] = useState<PromptProject[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Editor State
  const {
    state: originalPrompt,
    set: setOriginalPrompt,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetUndoHistory
  } = useUndoRedo("");

  const undoLongPress = useLongPress(() => {
    if (canUndo) undo();
  }, { threshold: 300, intervalMs: 50 });

  const redoLongPress = useLongPress(() => {
    if (canRedo) redo();
  }, { threshold: 300, intervalMs: 50 });

  const [refinedPrompt, setRefinedPrompt] = useState("");

  // Metadata State
  const [userFeedback, setUserFeedback] = useState("");
  const [refinedFeedback, setRefinedFeedback] = useState("");
  const [userPercentage, setUserPercentage] = useState(0);
  const [backendPercentage, setBackendPercentage] = useState(0);

  const selectedPromptIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedPromptIdRef.current = selectedPromptId;
  }, [selectedPromptId]);

  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isInputFullScreen, setIsInputFullScreen] = useState(false);
  const [isOutputFullScreen, setIsOutputFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState("refine");

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const streak = user?.streak || 0;
  const nextLevelXP = level * 200;
  const xpProgress = (xp / nextLevelXP) * 100;

  useEffect(() => {
    if (isAuthenticated) {
      fetchPrompts();
    }
  }, [isAuthenticated]);

  const fetchPrompts = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/v1/prompts");
      setPrompts(res.data.prompts);
    } catch (e) {
      console.error("Failed to fetch prompts");
    }
  };

  const handleNewProjectWrapper = async () => {
    // Auto-save logic if user is leaving an unsaved "New Chat" with content
    if (!selectedPromptId && originalPrompt.trim() !== "") {
      await handleSaveVersion();
    }
    handleNewProject();
  };

  const handleNewProject = () => {
    setSelectedPromptId(null);
    setVersions([]);
    setActiveVersion(null);
    resetUndoHistory("");
    setRefinedPrompt("");
    setUserFeedback("");
    setRefinedFeedback("");
    setUserPercentage(0);
    setBackendPercentage(0);
  };

  const handleSelectProjectWrapper = async (id: string) => {
    // Only auto-save if we are moving from a New Chat (no selectedPromptId) 
    // to an existing project AND we have typed something.
    if (!selectedPromptId && originalPrompt.trim() !== "") {
      await handleSaveVersion();
    }
    await handleSelectProject(id);
  };

  const handleSelectProject = async (id: string) => {
    try {
      setSelectedPromptId(id);
      const res = await axios.get(`http://localhost:3000/api/v1/prompts/${id}`);
      const projectVersions = res.data.versions;
      setVersions(projectVersions);

      if (projectVersions.length > 0) {
        // Load the latest version
        const latest = projectVersions[0]; // Sorted by desc in backend
        setActiveVersion(latest);
        resetUndoHistory(latest.content);
        setRefinedPrompt(latest.refinedContent || ""); // Load refined content or empty
        setUserFeedback(latest.aiFeedback || "");
        // Note: aiFeedback in DB is currently generic or specific, might need parsing or UI adjust
        // We will assume UI wants strict separation if available. But for now, just load content.
        setRefinedFeedback("");
      }
    } catch (e) {
      toast.error("Failed to load project");
    }
  };

  // Lock to prevent race conditions
  const saveLock = useRef(false);

  const handleSaveVersion = async () => {
    if (!originalPrompt.trim()) return;
    if (saveLock.current) return;

    saveLock.current = true;
    setIsSaving(true);

    try {
      if (!selectedPromptId) {
        // Create New Project
        const title = originalPrompt.slice(0, 30) + (originalPrompt.length > 30 ? "..." : "");
        const res = await axios.post("http://localhost:3000/api/v1/prompts", {
          title,
          initialContent: originalPrompt,
          initialRefinedContent: refinedPrompt // Save the response too!
        });

        toast.success("Project created!");
        await fetchPrompts();
        await handleSelectProject(res.data.promptId);
      } else {
        // Check for duplicates (Frontend Check)
        if (activeVersion &&
          activeVersion.content === originalPrompt &&
          (activeVersion.refinedContent || "") === refinedPrompt) {
          toast.info("No changes to save.");
          setIsSaving(false);
          saveLock.current = false;
          return;
        }

        // Save as new version
        const res = await axios.post(`http://localhost:3000/api/v1/prompts/${selectedPromptId}/version`, {
          content: originalPrompt,
          refinedContent: refinedPrompt, // Save current output too!
          aiFeedback: "Manual Save",
          aiScore: 0
        });

        if (res.data.msg === "Version already exists") {
          toast.info("Version already exists (saved).");
        } else {
          toast.success("Version saved!");
        }
        await handleSelectProject(selectedPromptId);
      }
    } catch (e) {
      toast.error("Failed to save");
      console.error(e);
    } finally {
      setIsSaving(false);
      // Small delay to prevent double-clicks
      setTimeout(() => { saveLock.current = false; }, 500);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedPromptId) return;
    if (confirm("Are you sure you want to delete this ENTIRE project? This cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:3000/api/v1/prompts/${selectedPromptId}`);
        toast.success("Project deleted");
        await fetchPrompts();
        handleNewProject();
      } catch (e) {
        toast.error("Failed to delete project");
      }
    }
  };

  const handleRenameProject = async (id: string, newTitle: string) => {
    try {
      await axios.put(`http://localhost:3000/api/v1/prompts/${id}/rename`, { title: newTitle }, {
        withCredentials: true
      });
      toast.success("Project renamed successfully!");
      await fetchPrompts();
    } catch (e) {
      toast.error("Failed to rename project");
      console.error(e);
    }
  };

  const handleRefinePrompt = async () => {
    if (!originalPrompt.trim()) {
      toast.error("Please enter a prompt to refine!");
      return;
    }

    setIsRefining(true);

    let currentId = selectedPromptId;

    try {
      // 0. Auto-Create Project if it's a "New Chat"
      if (!currentId) {
        const title = originalPrompt.slice(0, 30) + (originalPrompt.length > 30 ? "..." : "");
        const res = await axios.post("http://localhost:3000/api/v1/prompts", {
          title,
          initialContent: originalPrompt,
          initialRefinedContent: ""
        });
        currentId = res.data.promptId;

        // Optimistically update UI so it feels instant
        setSelectedPromptId(currentId as string);
        toast.success("Project created!");

        // Run fetch in background to populate sidebar
        fetchPrompts();
      }

      // 1. Get Optimized Content
      const dbCall = await axios.post("http://localhost:3000/api/v1/user/optimize", {
        prompt: originalPrompt
      });

      const enhancedContent = dbCall.data.response;

      // 2. Get Scores
      const userDbCall = await axios.post("http://localhost:3000/api/v1/user/secret-optimize", {
        prompt: originalPrompt
      });
      const uFeedback = userDbCall.data.feedback.split("Reason: ")[1];
      const uPercentage = Number(userDbCall.data.score.split(" ")[1]);

      const outputDbCall = await axios.post("http://localhost:3000/api/v1/user/secret-optimize", {
        prompt: enhancedContent
      });
      const rFeedback = outputDbCall.data.feedback.split("Reason: ")[1];
      const bPercentage = Number(outputDbCall.data.score.split(" ")[1]);

      // 3. Auto-Save Result safely in the background using the captured currentId
      if (currentId) {
        await axios.post(`http://localhost:3000/api/v1/prompts/${currentId}/version`, {
          content: originalPrompt,
          refinedContent: enhancedContent,
          aiFeedback: outputDbCall.data.feedback,
          aiScore: bPercentage
        });
      }

      // 4. Update UI ONLY if the user hasn't switched away from this project
      if (selectedPromptIdRef.current === currentId) {
        setRefinedPrompt(enhancedContent);
        setUserFeedback(uFeedback);
        setUserPercentage(uPercentage);
        setRefinedFeedback(rFeedback);
        setBackendPercentage(bPercentage);

        if (currentId) {
          const res = await axios.get(`http://localhost:3000/api/v1/prompts/${currentId}`);
          setVersions(res.data.versions);
        }
      }

      refreshProfile();
      toast.success("Prompt refined successfully!");

    } catch (e) {
      toast.error("Looks like Gemini is down!");
      console.error(e);
    } finally {
      setIsRefining(false);
    }
  };

  const handleTabChange = async (value: string) => {
    // Auto-save logic if user is leaving an unsaved "New Chat" with content to switch tabs
    if (!selectedPromptId && originalPrompt.trim() !== "" && value !== "refine") {
      await handleSaveVersion();
    }
    setActiveTab(value);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getRankTitle = (lvl: number) => {
    const titles = [
      "Unranked", // 0
      "Paper Raft Builder", // 1
      "Driftwood Collector", // 2
      "Stream Paddler", // 3
      "River Navigator", // 4
      "Rapid Rider", // 5
      "Current Watcher", // 6
      "Prompt Tinkerer", // 7
      "Context Seeker", // 8
      "Token Counter", // 9
      "Apprentice Scribe", // 10
      "Logic Weaver", // 11
      "Syntax Shaper", // 12
      "Instruction Crafter", // 13
      "Model Whisperer", // 14
      "Pattern Recognizer", // 15
      "Chain of Thought Guide", // 16
      "Few-Shot Learner", // 17
      "Zero-Shot Specialist", // 18
      "Hallucination Tamer", // 19
      "Prompt Engineer", // 20
      "System Prompt Architect", // 21
      "Context Window Keeper", // 22
      "Token Optimizer", // 23
      "Vector voyager", // 24
      "Embedding Explorer", // 25
      "Latency Reducer", // 26
      "Temperature Tuner", // 27
      "Top-K Strategist", // 28
      "Top-P Tactician", // 29
      "Prompt Master", // 30
      "Fine-Tuning Expert", // 31
      "RLHF Specialist", // 32
      "Transformer Trainer", // 33
      "Attention Mechanism Guru", // 34
      "Neural Network Navigator", // 35
      "Generative Genius", // 36
      "AI Collaborator", // 37
      "Digital Muse", // 38
      "Code Synthesis Savant", // 39
      "Creative Spark", // 40
      "Prompt Grandmaster", // 41
      "Language Lord", // 42
      "Token Titan", // 43
      "Context Commander", // 44
      "Prompt Prophet", // 45
      "AI Whisperer", // 46
      "Singularity Seeker", // 47
      "AGI Architect", // 48
      "Superintelligence Guide", // 49
      "Ascended Prompter" // 50
    ];

    if (lvl <= 50) return titles[lvl] || `Level ${lvl} Explorer`;
    return `Level ${lvl} Legend`;
  };

  return (
    <div className="min-h-screen dark:bg-[#1a1a1a] flex flex-col overflow-y-hidden">
      <Header />
      <div className="flex flex-1">
        {isAuthenticated && (
          <PromptSidebar
            prompts={prompts}
            selectedId={selectedPromptId}
            onSelect={handleSelectProjectWrapper}
            onNew={handleNewProjectWrapper}
            onRename={handleRenameProject}
            isOpen={showSidebar}
          />
        )}

        <div className="flex-1 px-6 py-8 w-full">
          {/* User Progress Bar */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 ">
              {isAuthenticated && (
                <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
                  <Layout className="w-5 h-5" />
                </Button>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-heading font-extrabold tracking-tight text-foreground">
                    {selectedPromptId ? "Project Workspace" : "Prompt Refinement Studio"}
                  </h1>
                  {selectedPromptId && (
                    <Button
                      variant="custom2"
                      size="sm"
                      onClick={handleDeleteProject}
                      className="h-8 w-8 p-0 rounded-md"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground text-sm font-medium">Transform your prompts into powerful instructions</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Level</div>
                <div className="text-lg font-bold text-foreground">{level}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Streak</div>
                <div className="text-lg font-bold text-foreground">{streak}🔥</div>
              </div>
              <div className="text-center min-w-32 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50">
                <div className="text-sm font-medium text-foreground mb-2 flex flex-col">
                  <span>XP Progress</span>
                  <span className="text-muted-foreground font-mono text-xs">{xp} / {nextLevelXP}</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-md h-2 mt-1 overflow-hidden">
                  <div
                    className="bg-black dark:bg-white h-2 rounded-md transition-all duration-700 ease-out"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-lg">
              <TabsTrigger value="refine" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:dark:bg-black data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-neutral-200 dark:data-[state=active]:ring-neutral-800 transition-all duration-200">
                <Wand2 className="w-4 h-4" />
                Refine Prompts
              </TabsTrigger>
              <TabsTrigger value="learn" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:dark:bg-black data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-neutral-200 dark:data-[state=active]:ring-neutral-800 transition-all duration-200">
                <BookOpen className="w-4 h-4" />
                Learn & Practice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="refine" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Version Controls */}
              {selectedPromptId && versions.length > 0 && (
                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <HistoryIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Version History:</span>
                    <Select
                      value={activeVersion?._id}
                      onValueChange={(val) => {
                        const v = versions.find(v => v._id === val);
                        if (v) {
                          setActiveVersion(v);
                          setOriginalPrompt(v.content);
                          setRefinedPrompt(v.refinedContent || "");
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map(v => (
                          <SelectItem key={v._id} value={v._id}>
                            Version {v.versionNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Viewing Version {activeVersion?.versionNumber}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (!activeVersion || !selectedPromptId) return;
                        if (confirm("Are you sure you want to delete this version?")) {
                          try {
                            await axios.delete(`http://localhost:3000/api/v1/prompts/${selectedPromptId}/version/${activeVersion._id}`);
                            toast.success("Version deleted");
                            // Refresh
                            await handleSelectProject(selectedPromptId);
                          } catch (e) {
                            toast.error("Failed to delete");
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {/* Main Refinement Interface */}
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-300 ${isInputFullScreen ? "fixed inset-0 z-50 bg-background p-8 overflow-y-auto" : ""
                } ${isOutputFullScreen ? "fixed inset-0 z-50 bg-background p-8 overflow-y-auto" : ""}`} >
                {/* Input Section */}
                {!isOutputFullScreen && (
                  <CardEnhanced variant="default" className={`relative h-fit ${isInputFullScreen ? "max-w-5xl mx-auto w-full h-auto" : ""
                    }`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-50 text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      onClick={() => setIsInputFullScreen(!isInputFullScreen)}
                    >
                      {isInputFullScreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                    <CardEnhancedHeader className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <CardEnhancedTitle className="flex items-center gap-2 text-foreground font-bold font-sans">
                            <Target className="w-4 h-4" />
                            Editor
                          </CardEnhancedTitle>
                          <CardEnhancedDescription className="text-muted-foreground">
                            Edit your prompt or select a version
                          </CardEnhancedDescription>
                        </div>
                        <div className="flex gap-2 mr-10">
                          <Button
                            variant="outline"
                            size="icon"
                            {...undoLongPress}
                            disabled={!canUndo}
                            className="h-8 w-8"
                            title="Undo"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            {...redoLongPress}
                            disabled={!canRedo}
                            className="h-8 w-8"
                            title="Redo"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardEnhancedHeader>
                    <CardEnhancedContent className="pt-6 space-y-4">
                      <Textarea
                        placeholder="Enter your prompt here... For example: 'Write me a blog post about AI'"
                        value={originalPrompt}
                        onChange={(e) => setOriginalPrompt(e.target.value)}
                        className="min-h-[200px] resize-none font-mono text-sm bg-background border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-500 shadow-none text-foreground placeholder:text-muted-foreground"
                      />
                      <div className="flex gap-3 mt-4">
                        <Button
                          variant="outline"
                          onClick={handleSaveVersion}
                          disabled={isSaving || !originalPrompt.trim() || !isAuthenticated}
                          className="flex-1 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? "Saving..." : "Save Version"}
                        </Button>
                        <Button
                          onClick={handleRefinePrompt}
                          disabled={isRefining || !originalPrompt.trim()}
                          className="flex-1 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-none"
                        >
                          {isRefining ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Refining...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Refine with AI
                            </>
                          )}
                        </Button>
                      </div>
                      {!isAuthenticated && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Login to save your prompt versions history.
                        </p>
                      )}
                      {isInputFullScreen ? <div className="px-3 py-10 flex gap-3">
                        <CircularProgressBar sqSize={180} strokeWidth={18} percentage={userPercentage}></CircularProgressBar>
                        <div
                          className="
                                                    inline-block
                                                    bg-background
                                                    text-white
                                                    pl-3 py-2
                                                    rounded-2xl
                                                    break-words
                                                    min-w-[440px]
                                                    max-w-[440px]
                                                    sm:max-w-sm md:max-w-md lg:max-w-lg
                                                    text-sm sm:text-base md:text-md
                                                    transition-all duration-300 ease-in-out                      
                                                    ">
                          <div className={`flex h-full text-muted-foreground ${userFeedback ? "text-white" : ""}`}>
                            {/* <p>Feedback and area`s to improve</p> */}
                            {userFeedback}
                          </div>
                        </div>
                      </div> : ''}
                    </CardEnhancedContent>
                  </CardEnhanced>
                )}

                {/* Output Section */}
                {!isInputFullScreen && (
                  <CardEnhanced variant="accent" className={`relative h-50 ${isOutputFullScreen ? "fixed top-10 right-10 bottom-10 z-50 md:w-1/2 h-auto" : ""}`}>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-50 text-muted-foreground hover:text-foreground" onClick={() => setIsOutputFullScreen(!isOutputFullScreen)}>
                      {isOutputFullScreen ? <Minimize2 className="w-4 h-4"></Minimize2> : <Maximize2 className="w-4 h-4"></Maximize2>}
                    </Button>
                    <CardEnhancedHeader className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                      <CardEnhancedTitle className="flex items-center gap-2 text-foreground font-bold font-sans">
                        <Sparkles className="w-4 h-4" />
                        Optimized Version
                      </CardEnhancedTitle>
                      <CardEnhancedDescription className="text-muted-foreground">
                        AI suggestions will appear here
                      </CardEnhancedDescription>
                    </CardEnhancedHeader>
                    <CardEnhancedContent className="pt-6 space-y-4">
                      <div className="min-h-[200px] p-5 bg-background rounded-lg border border-neutral-200 dark:border-neutral-800">
                        {refinedPrompt ? (
                          <div className="space-y-3">
                            <p className="text-sm leading-relaxed font-mono text-foreground whitespace-pre-wrap">{refinedPrompt}</p>
                            <div className="flex gap-2 pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(refinedPrompt)}
                                className="flex-1 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-800"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>Your refined prompt will appear here</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {isOutputFullScreen ? <div className="px-3 py-10 flex gap-3">
                        <CircularProgressBar sqSize={180} strokeWidth={18} percentage={backendPercentage}></CircularProgressBar>
                        <div
                          className="
                                                    inline-block
                                                    bg-background
                                                    text-white
                                                    pl-3 py-2
                                                    rounded-2xl
                                                    break-words
                                                    min-w-[440px]
                                                    max-w-[440px]
                                                    sm:max-w-sm md:max-w-md lg:max-w-lg
                                                    text-sm sm:text-base md:text-md
                                                    transition-all duration-300 ease-in-out                      
                                                    ">
                          <div className={`flex h-full text-muted-foreground ${refinedFeedback ? "text-white" : ""}`}>
                            {/* <p>Feedback and area`s to improve</p> */}
                            {refinedFeedback}
                          </div>
                        </div>
                      </div> : ''}
                    </CardEnhancedContent>
                  </CardEnhanced>
                )}
              </div>

              {/* Quick Tips */}
              <CardEnhanced variant="flat">
                <CardEnhancedHeader className="border-b border-neutral-200 dark:border-neutral-700/50 pb-4">
                  <CardEnhancedTitle className="text-lg font-bold">💡 Pro Tips for Better Prompts</CardEnhancedTitle>
                </CardEnhancedHeader>
                <CardEnhancedContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Badge variant="secondary">Be Specific</Badge>
                      <p className="text-sm text-muted-foreground">
                        Instead of "write about dogs", try "write a 500-word article about golden retriever training tips for new owners"
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary">Add Context</Badge>
                      <p className="text-sm text-muted-foreground">
                        Mention your audience, purpose, and desired tone to get more targeted results
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary">Include Examples</Badge>
                      <p className="text-sm text-muted-foreground">
                        Show the AI what you want by providing examples or describing the format you need
                      </p>
                    </div>
                  </div>
                </CardEnhancedContent>
              </CardEnhanced>
            </TabsContent>

            <TabsContent value="learn" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
              <DraggableBentoGrid
                defaultLayout={[
                  { i: "level", x: 0, y: 0, w: 1, h: 1 },
                  { i: "xp", x: 1, y: 0, w: 1, h: 1 },
                  { i: "streak", x: 2, y: 0, w: 1, h: 1 },
                  { i: "challenge", x: 0, y: 1, w: 2, h: 2 },
                  { i: "modules", x: 2, y: 1, w: 1, h: 2 },
                ]}
              >
                {/* Level Card */}
                <div key="level" className="h-full">
                  <CardEnhanced variant="outline" className="text-center h-full flex flex-col relative group">
                    <div className="drag-handle absolute top-2 right-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardEnhancedContent className="p-3 flex flex-col items-center justify-center h-full">
                      <Trophy className="w-8 h-8 text-foreground mb-3" />
                      <h3 className="text-2xl font-bold font-sans">Level {level}</h3>
                      <p className="text-sm font-medium text-muted-foreground mt-1">{getRankTitle(level)}</p>
                    </CardEnhancedContent>
                  </CardEnhanced>
                </div>

                {/* XP Card */}
                <div key="xp" className="h-full">
                  <CardEnhanced variant="accent" className="text-center h-full flex flex-col relative group">
                    <div className="drag-handle absolute top-2 right-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardEnhancedContent className="p-3 flex flex-col items-center justify-center h-full">
                      <Sparkles className="w-8 h-8 text-foreground mb-3" />
                      <h3 className="text-2xl font-bold font-sans">{xp}</h3>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Total XP Earned</p>
                    </CardEnhancedContent>
                  </CardEnhanced>
                </div>

                {/* Streak Card */}
                <div key="streak" className="h-full">
                  <CardEnhanced variant="outline" className="text-center h-full flex flex-col relative group">
                    <div className="drag-handle absolute top-2 right-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardEnhancedContent className="p-3 flex flex-col items-center justify-center h-full">
                      <div className="text-3xl font-bold mb-2">🔥</div>
                      <h3 className="text-2xl font-bold font-sans">{streak} Days</h3>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Current Streak</p>
                    </CardEnhancedContent>
                  </CardEnhanced>
                </div>

                {/* Daily Challenge */}
                <div key="challenge" className="h-full">
                  <CardEnhanced variant="outline" className="h-full flex flex-col relative group">
                    <div className="drag-handle absolute top-2 right-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardEnhancedHeader className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                      <CardEnhancedTitle className="text-lg flex items-center gap-2 font-bold">
                        <Target className="w-5 h-5 text-foreground" />
                        Daily Challenge
                      </CardEnhancedTitle>
                      <CardEnhancedDescription className="text-muted-foreground mt-1">Refine 3 prompts today to earn bonus XP</CardEnhancedDescription>
                    </CardEnhancedHeader>
                    <CardEnhancedContent className="pt-6 flex flex-col justify-center gap-4 flex-1">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold text-foreground">1/3</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                        <div className="bg-black dark:bg-white h-2 rounded-full transition-all" style={{ width: '33%' }}></div>
                      </div>
                      <Button className="w-full mt-2 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-none">Continue Refining</Button>
                    </CardEnhancedContent>
                  </CardEnhanced>
                </div>

                {/* Learning Modules */}
                <div key="modules" className="h-full">
                  <CardEnhanced variant="flat" className="h-full flex flex-col relative group">
                    <div className="drag-handle absolute top-2 right-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardEnhancedHeader className="pb-4">
                      <CardEnhancedTitle className="text-lg font-bold">Modules</CardEnhancedTitle>
                      <CardEnhancedDescription className="text-sm mt-1">
                        Mastery Path
                      </CardEnhancedDescription>
                    </CardEnhancedHeader>
                    <CardEnhancedContent className="flex-1 overflow-y-auto space-y-3 pb-2 custom-scrollbar">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                          <span className="text-sm font-medium">Basics</span>
                          <Badge className="text-xs px-2 py-0.5">Done</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-ocean-mist/20 rounded-md">
                          <span className="text-sm font-medium">Context</span>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md opacity-60">
                          <span className="text-sm font-medium">Advanced</span>
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">Locked</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md opacity-60">
                          <span className="text-sm font-medium">Expert</span>
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">Locked</Badge>
                        </div>
                      </div>
                    </CardEnhancedContent>
                  </CardEnhanced>
                </div>
              </DraggableBentoGrid>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div >
  );
};

export default PromptRefinement;
