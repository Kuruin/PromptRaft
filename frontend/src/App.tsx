import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";

const Home = lazy(() => import("./pages/Home"));
const PromptRefinement = lazy(() => import("./pages/PromptRefinement"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CreatePrompt = lazy(() => import("./pages/CreatePrompt"));
const ChallengeArena = lazy(() => import("./pages/ChallengeArena"));
const BattleArena = lazy(() => import("./pages/BattleArena"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PromptsGallery = lazy(() => import("./pages/PromptsGallery"));
const PromptGuide = lazy(() => import("./pages/PromptGuide"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
    <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/prompt-refine" element={<PromptRefinement />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/create" element={<CreatePrompt />} />
              <Route path="/arena" element={<ChallengeArena />} />
              <Route path="/battles" element={<BattleArena />} />
              <Route path="/prompts" element={<PromptsGallery />} />
              <Route path="/guide" element={<PromptGuide />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
