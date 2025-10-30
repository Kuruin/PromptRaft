import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardEnhanced, CardEnhancedContent, CardEnhancedDescription, CardEnhancedHeader, CardEnhancedTitle } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Copy, RefreshCw, Sparkles, Trophy, Target, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import axios from 'axios'
import { Minimize2, Maximize2 } from "lucide-react";
import CircularProgressBar from "@/components/Circular-bar";

const PromptRefinement = () => {
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [refinedPrompt, setRefinedPrompt] = useState("");

  const [userFeedback, setUserFeedback] = useState("");
  const [refinedFeedback, setRefinedFeedback] = useState("");

  const [userPercentage, setUserPercentage] = useState(0);
  const [backendPercentage, setBackendPercentage] = useState(0);

  const [isRefining, setIsRefining] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(10);
  const [userStreak, setUserStreak] = useState(0);
  const [isInputFullScreen, setIsInputFullScreen] = useState(false);
  const [isOutputFullScreen, setIsOutputFullScreen] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsInputFullScreen(false);
      if (e.key === "Escape") setIsOutputFullScreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleRefinePrompt = async () => {
    if (!originalPrompt.trim()) {
      toast.error("Please enter a prompt to refine!");
      return;
    }

    setIsRefining(true);

    async function dbCall() {
      try {
        const dbCall = await axios.post("http://localhost:3000/api/v1/user/optimize", {
          prompt: originalPrompt
        });
        if (dbCall.data) {
          setRefinedPrompt(dbCall.data.response);
          setIsRefining(false);
          setUserXP(prev => prev + 54);
          toast.success("Prompt refined successfully! +25 XP earned");
        }

        const userDbCall = await axios.post("http://localhost:3000/api/v1/user/secret-optimize", {
          prompt: originalPrompt
        });
        setUserFeedback(userDbCall.data.feedback.split("Reason: ")[1]);
        setUserPercentage(Number(userDbCall.data.score.split(" ")[1]));

        const outputDbCall = await axios.post("http://localhost:3000/api/v1/user/secret-optimize", {
          prompt: refinedPrompt
        });
        setRefinedFeedback(outputDbCall.data.feedback.split("Reason: ")[1]);
        setBackendPercentage(Number(outputDbCall.data.score.split(" ")[1]));

      } catch (e) {
        toast.error("Looks like Gemini is down!");
      } finally {
        setIsRefining(false);
      }

    }
    dbCall();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  useEffect(() => {
    const requiredXP = userLevel * 200;
    if (userXP >= requiredXP) {
      setUserXP(prevXP => prevXP - requiredXP); // carry over remaining XP
      setUserLevel(prevLevel => prevLevel + 1); // increase level
    }
  }, [userXP, userLevel]);

  const nextLevelXP = userLevel * 200;
  const xpProgress = (userXP / nextLevelXP) * 100;

  return (
    <div className="min-h-screen dark:bg-[#1a1a1a]">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* User Progress Bar */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Prompt Refinement Studio</h1>
            <p className="text-muted-foreground">Transform your prompts into powerful instructions</p>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Level</div>
              <div className="text-lg font-bold text-ocean-primary">{userLevel}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Streak</div>
              <div className="text-lg font-bold text-gold-accent">{userStreak}🔥</div>
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
                {userXP}/{nextLevelXP}
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
                      Your Original Prompt
                    </CardEnhancedTitle>
                    <CardEnhancedDescription>
                      Enter your prompt below and we'll help you make it better
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
                            Refine Prompt
                          </>
                        )}
                      </Button>
                    </div>
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
                      Refined Result
                    </CardEnhancedTitle>
                    <CardEnhancedDescription>
                      Your improved, more effective prompt
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
                  <h3 className="text-2xl font-bold text-ocean-primary">Level {userLevel}</h3>
                  <p className="text-muted-foreground">Prompt Apprentice</p>
                </CardEnhancedContent>
              </CardEnhanced>

              <CardEnhanced variant="gold" className="text-center">
                <CardEnhancedContent className="pt-6">
                  <Sparkles className="w-12 h-12 text-ocean-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-ocean-primary">{userXP}</h3>
                  <p className="text-muted-foreground">Total XP Earned</p>
                </CardEnhancedContent>
              </CardEnhanced>

              <CardEnhanced variant="glass" className="text-center">
                <CardEnhancedContent className="pt-6">
                  <Target className="w-12 h-12 text-gold-accent mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-ocean-primary">{userStreak}</h3>
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

      <Footer />
    </div >
  );
};

export default PromptRefinement;
