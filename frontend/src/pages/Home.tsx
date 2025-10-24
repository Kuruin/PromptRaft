import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import BestPracticesSection from "@/components/BestPracticesSection";
import CommonMistakesSection from "@/components/CommonMistakesSection";
import PromptTemplatesSection from "@/components/PromptTemplatesSection";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Prompt Raft - Master AI Prompt Engineering</title>
        <meta name="description" content="Learn proven prompt engineering techniques, avoid common mistakes, and use our AI-powered tool to refine your prompts for ChatGPT, Claude, and other LLMs." />
        <meta name="keywords" content="prompt engineering, AI prompts, ChatGPT, Claude, LLM, prompt refinement, AI tools" />
      </Helmet>

      <div className="min-h-screen bg-background" data-testid="home-page">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <BestPracticesSection />
          <CommonMistakesSection />
          <PromptTemplatesSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
