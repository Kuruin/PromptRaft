import { useEffect, useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [refinedPrompt, setRefinedPrompt] = useState("");

  // Metadata State
  const [userFeedback, setUserFeedback] = useState("");
  const [refinedFeedback, setRefinedFeedback] = useState("");
  const [userPercentage, setUserPercentage] = useState(0);
  const [backendPercentage, setBackendPercentage] = useState(0);

  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isInputFullScreen, setIsInputFullScreen] = useState(false);
  const [isOutputFullScreen, setIsOutputFullScreen] = useState(false);

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

  const handleNewProject = () => {
    setSelectedPromptId(null);
    setVersions([]);
    setActiveVersion(null);
    setOriginalPrompt("");
    setRefinedPrompt("");
    setUserFeedback("");
    setRefinedFeedback("");
    setUserPercentage(0);
    setBackendPercentage(0);
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
        setOriginalPrompt(latest.content);
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

  const handleRefinePrompt = async () => {
    if (!originalPrompt.trim()) {
      toast.error("Please enter a prompt to refine!");
      return;
    }

    setIsRefining(true);

    try {
      // 1. Get Optimized Content
      const dbCall = await axios.post("http://localhost:3000/api/v1/user/optimize", {
        prompt: originalPrompt
      });

      const enhancedContent = dbCall.data.response;
      setRefinedPrompt(enhancedContent);

      // 2. Get Scores
      const userDbCall = await axios.post("http://localhost:3000/api/v1/user/secret-optimize", {
        prompt: originalPrompt
      });
      setUserFeedback(userDbCall.data.feedback.split("Reason: ")[1]);
      setUserPercentage(Number(userDbCall.data.score.split(" ")[1]));

      const outputDbCall = await axios.post("http://localhost:3000/api/v1/user/secret-optimize", {
        prompt: enhancedContent
      });
      setRefinedFeedback(outputDbCall.data.feedback.split("Reason: ")[1]);
      setBackendPercentage(Number(outputDbCall.data.score.split(" ")[1]));

      refreshProfile();

      toast.success("Prompt refined successfully!");

      // 3. Auto-Save Result if in a project
      if (selectedPromptId) {
        // When we auto-save a refinement, the "New Version" is the Enhanced Prompt.
        // So content = enhancedContent.
        // RefinedContent could be empty since we haven't refined *that* yet?
        // OR do we want V2: Input=A, Output=B? 
        // If I click Refine, I expect to SEE the result.
        // If the app auto-saves to V2, and V2 has content=B.
        // Then I see B in left box?
        // No, UI currently shows B in right box.
        // IF I WANT TO SAVE THE PAIR: 
        // I should probably save V(N+1) = { content: originalPrompt, refinedContent: enhancedContent }.
        // This preserves the "Transformation".
        await axios.post(`http://localhost:3000/api/v1/prompts/${selectedPromptId}/version`, {
          content: originalPrompt,
          refinedContent: enhancedContent,
          aiFeedback: outputDbCall.data.feedback,
          aiScore: Number(outputDbCall.data.score.split(" ")[1])
        });
        // Refresh list to show new version
        const res = await axios.get(`http://localhost:3000/api/v1/prompts/${selectedPromptId}`);
        setVersions(res.data.versions);
        // We DON'T set activeVersion to the new one immediately if we want to keep the view as is?
        // Actually if we just fetched versions, the user is still looking at the state.
        // If they change version in dropdown, they see it.
      }

    } catch (e) {
      toast.error("Looks like Gemini is down!");
      console.error(e);
    } finally {
      setIsRefining(false);
    }
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
    <div className="min-h-screen dark:bg-[#1a1a1a] flex flex-col">
      <Header />
      <div className="flex flex-1">
        {isAuthenticated && (
          <PromptSidebar
            prompts={prompts}
            selectedId={selectedPromptId}
            onSelect={handleSelectProject}
            onNew={handleNewProject}
            isOpen={showSidebar}
          />
        )}

        <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
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
                  <h1 className="text-3xl font-bold text-foreground">
                    {selectedPromptId ? "Project Workspace" : "Prompt Refinement Studio"}
                  </h1>
                  {selectedPromptId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteProject}
                      className="h-8 w-8 p-0 rounded-full"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground">Transform your prompts into powerful instructions</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Level</div>
                <div className="text-lg font-bold text-ocean-primary">{level}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Streak</div>
                <div className="text-lg font-bold text-gold-accent">{streak}🔥</div>
              </div>
              <div className="text-center min-w-32">
                <div className="text-sm text-muted-foreground">XP Progress</div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div
                    className="bg-black dark:bg-white/90 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {xp}/{nextLevelXP}
                </div>
              </div>
            </div>
          </div>
          <Tabs defaultValue="refine" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="refine" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Refine Prompts
              </TabsTrigger>
              <TabsTrigger value="learn" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Learn & Practice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="refine" className="space-y-8">
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
                  <CardEnhanced variant="ocean" className={`relative h-fit dark:bg-[#1f1f1f]/100 ${isInputFullScreen ? "max-w-5xl mx-auto w-full h-auto" : ""
                    }`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-50"
                      onClick={() => setIsInputFullScreen(!isInputFullScreen)}
                    >
                      {isInputFullScreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                    <CardEnhancedHeader>
                      <CardEnhancedTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Editor
                      </CardEnhancedTitle>
                      <CardEnhancedDescription>
                        Edit your prompt or select a version
                      </CardEnhancedDescription>
                    </CardEnhancedHeader>
                    <CardEnhancedContent className="space-y-4">
                      <Textarea
                        placeholder="Enter your prompt here... For example: 'Write me a blog post about AI'"
                        value={originalPrompt}
                        onChange={(e) => setOriginalPrompt(e.target.value)}
                        className="min-h-32 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleSaveVersion}
                          disabled={isSaving || !originalPrompt.trim() || !isAuthenticated}
                          className="flex-1"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? "Saving..." : "Save Version"}
                        </Button>
                        <Button
                          variant="custom1"
                          onClick={handleRefinePrompt}
                          disabled={isRefining || !originalPrompt.trim()}
                          className="flex-1"
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
                  <CardEnhanced variant="gold" className={`relative h-50 ${isOutputFullScreen ? "fixed top-10 right-10 bottom-10 z-50 md:w-1/2 h-auto" : ""}`}>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-50" onClick={() => setIsOutputFullScreen(!isOutputFullScreen)}>
                      {isOutputFullScreen ? <Minimize2 className="w-4 h-4"></Minimize2> : <Maximize2 className="w-4 h-4"></Maximize2>}
                    </Button>
                    <CardEnhancedHeader>
                      <CardEnhancedTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Optimized Version
                      </CardEnhancedTitle>
                      <CardEnhancedDescription>
                        AI suggestions will appear here
                      </CardEnhancedDescription>
                    </CardEnhancedHeader>
                    <CardEnhancedContent className="space-y-4">
                      <div className="min-h-32 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                        {refinedPrompt ? (
                          <div className="space-y-3">
                            <p className="text-sm leading-relaxed">{refinedPrompt}</p>
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="custom1"
                                size="sm"
                                onClick={() => copyToClipboard(refinedPrompt)}
                                className="flex-1"
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
              <CardEnhanced variant="glass">
                <CardEnhancedHeader>
                  <CardEnhancedTitle>💡 Pro Tips for Better Prompts</CardEnhancedTitle>
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

            <TabsContent value="learn" className="space-y-8">
              {/* Learning Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CardEnhanced variant="ocean" className="text-center">
                  <CardEnhancedContent className="pt-6">
                    <Trophy className="w-12 h-12 text-gold-accent mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-ocean-primary">Level {level}</h3>
                    <p className="text-muted-foreground">{getRankTitle(level)}</p>
                  </CardEnhancedContent>
                </CardEnhanced>

                <CardEnhanced variant="gold" className="text-center">
                  <CardEnhancedContent className="pt-6">
                    <Sparkles className="w-12 h-12 text-ocean-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-ocean-primary">{xp}</h3>
                    <p className="text-muted-foreground">Total XP Earned</p>
                  </CardEnhancedContent>
                </CardEnhanced>

                <CardEnhanced variant="glass" className="text-center">
                  <CardEnhancedContent className="pt-6">
                    <Target className="w-12 h-12 text-gold-accent mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-ocean-primary">{streak}</h3>
                    <p className="text-muted-foreground">Day Streak</p>
                  </CardEnhancedContent>
                </CardEnhanced>
              </div>

              {/* Learning Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CardEnhanced variant="ocean">
                  <CardEnhancedHeader>
                    <CardEnhancedTitle>🎯 Daily Challenge</CardEnhancedTitle>
                    <CardEnhancedDescription>
                      Complete today's prompt engineering challenge
                    </CardEnhancedDescription>
                  </CardEnhancedHeader>
                  <CardEnhancedContent>
                    <div className="space-y-4">
                      <p className="text-sm">
                        <strong>Challenge:</strong> Transform this vague prompt into a specific, actionable one:
                      </p>
                      <div className="p-3 bg-muted rounded-lg">
                        <em>"Make me something creative"</em>
                      </div>
                      <Button variant="challenge" className="w-full" onClick={() => toast.error("YOU ARE NOT YET READYSOLDIER!")}>
                        Start Challenge (+50 XP)
                      </Button>
                    </div>
                  </CardEnhancedContent>
                </CardEnhanced>

                <CardEnhanced variant="glass">
                  <CardEnhancedHeader>
                    <CardEnhancedTitle>📚 Learning Modules</CardEnhancedTitle>
                    <CardEnhancedDescription>
                      Master prompt engineering step by step
                    </CardEnhancedDescription>
                  </CardEnhancedHeader>
                  <CardEnhancedContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-ocean-mist/20 rounded-lg">
                        <span className="text-sm font-medium">Basics of Prompt Writing</span>
                        <Badge>Completed</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-ocean-mist/20 rounded-lg">
                        <span className="text-sm font-medium">Adding Context & Examples</span>
                        <Badge variant="outline">In Progress</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg opacity-60">
                        <span className="text-sm font-medium">Advanced Techniques</span>
                        <Badge variant="secondary">Locked</Badge>
                      </div>
                    </div>
                  </CardEnhancedContent>
                </CardEnhanced>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div >
  );
};

export default PromptRefinement;
