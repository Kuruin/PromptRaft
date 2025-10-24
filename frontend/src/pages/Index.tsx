import { Button } from "@/components/ui/button";
import { CardEnhanced, CardEnhancedContent, CardEnhancedDescription, CardEnhancedHeader, CardEnhancedTitle } from "@/components/ui/card-enhanced";
import { AnimatedText } from "@/components/AnimatedText";
import { ArrowRight, Anchor, Compass, Star, Users, Lightbulb, Waves } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import ideaSailorsLogo from "@/assets/idea-sailors-logo.png";
import oceanBackground from "@/assets/ocean-background.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-ocean-mist/10 to-ocean-light/20">
      {/* Floating Navigation */}
      <nav className="fixed top-8 right-8 z-50 animate-fade-in">
        <ThemeToggle />
      </nav>
      
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center px-6 py-20 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${oceanBackground})`,
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-background/90 dark:bg-background/95"></div>
        {/* Floating Animation Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 animate-bounce">
            <Anchor className="w-8 h-8 text-ocean-light opacity-30" />
          </div>
          <div className="absolute top-40 right-20 animate-pulse">
            <Compass className="w-6 h-6 text-gold-accent opacity-40" />
          </div>
          <div className="absolute bottom-40 left-20 animate-bounce delay-1000">
            <Star className="w-5 h-5 text-ocean-primary opacity-25" />
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto relative z-10">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <img 
                src={ideaSailorsLogo} 
                alt="Idea Sailors Logo" 
                className="w-32 h-auto transition-all duration-500 group-hover:scale-110 drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-ocean opacity-0 group-hover:opacity-20 rounded-full blur-xl transition-opacity duration-500"></div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-ocean-primary tracking-tight">
            <AnimatedText text="Idea Sailors" delay={100} />
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-ocean-primary/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Navigate the vast ocean of possibilities and transform your boldest ideas into extraordinary realities
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              variant="ocean" 
              size="lg" 
              className="text-lg px-8 py-6 shadow-elegant"
              onClick={() => window.location.href = '/prompt-refine'}
            >
              Try PromptCraft <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="waves" size="lg" className="text-lg px-8 py-6">
              Explore Our Journey <Compass className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center group">
              <div className="text-4xl font-bold text-ocean-primary group-hover:text-gold-accent transition-colors">
                100+
              </div>
              <p className="text-ocean-primary/70">Ideas Launched</p>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-ocean-primary group-hover:text-gold-accent transition-colors">
                50+
              </div>
              <p className="text-ocean-primary/70">Happy Clients</p>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-ocean-primary group-hover:text-gold-accent transition-colors">
                5+
              </div>
              <p className="text-ocean-primary/70">Years Experience</p>
            </div>
          </div>
        </div>

        {/* Wave Animation */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg className="w-full h-24 text-ocean-mist" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              opacity=".25" 
              fill="currentColor"
            />
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              opacity=".5" 
              fill="currentColor"
            />
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-waves">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-ocean-primary mb-4">
              Why Choose Idea Sailors?
            </h2>
            <p className="text-xl text-ocean-primary/80 max-w-2xl mx-auto">
              We don't just navigate ideas—we chart new courses toward innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CardEnhanced variant="ocean" className="group hover:scale-105 transition-all duration-300">
              <CardEnhancedHeader>
                <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <CardEnhancedTitle>Innovation First</CardEnhancedTitle>
                <CardEnhancedDescription>
                  Every idea is a vessel for change. We build the future, one breakthrough at a time.
                </CardEnhancedDescription>
              </CardEnhancedHeader>
            </CardEnhanced>

            <CardEnhanced variant="gold" className="group hover:scale-105 transition-all duration-300">
              <CardEnhancedHeader>
                <div className="w-12 h-12 bg-gradient-gold rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-ocean-primary" />
                </div>
                <CardEnhancedTitle>Expert Crew</CardEnhancedTitle>
                <CardEnhancedDescription>
                  Our seasoned navigators bring decades of experience across diverse industries and technologies.
                </CardEnhancedDescription>
              </CardEnhancedHeader>
            </CardEnhanced>

            <CardEnhanced variant="glass" className="group hover:scale-105 transition-all duration-300">
              <CardEnhancedHeader>
                <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Waves className="w-6 h-6 text-white" />
                </div>
                <CardEnhancedTitle>Smooth Sailing</CardEnhancedTitle>
                <CardEnhancedDescription>
                  From concept to launch, we ensure your journey is seamless, efficient, and remarkably successful.
                </CardEnhancedDescription>
              </CardEnhancedHeader>
            </CardEnhanced>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gradient-ocean text-white relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 animate-spin-slow">
            <Compass className="w-32 h-32" />
          </div>
          <div className="absolute bottom-10 right-10 animate-pulse">
            <Anchor className="w-24 h-24" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Set Sail?
          </h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90">
            Let's navigate your next big idea together and discover uncharted territories of success
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button variant="gold" size="lg" className="text-lg px-10 py-6 shadow-glow">
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-10 py-6 border-white text-white hover:bg-white hover:text-ocean-primary"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-ocean-deep text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <img 
              src={ideaSailorsLogo} 
              alt="Idea Sailors Logo" 
              className="w-16 h-auto mx-auto opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-ocean-light mb-4">
            © 2024 Idea Sailors. Navigating innovation across all seas.
          </p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-ocean-light hover:text-gold-accent transition-colors">
              Contact
            </a>
            <a href="#" className="text-ocean-light hover:text-gold-accent transition-colors">
              Portfolio
            </a>
            <a href="#" className="text-ocean-light hover:text-gold-accent transition-colors">
              About
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;