import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border",
        ocean: "border-ocean-light bg-gradient-to-br from-background to-ocean-mist/20 shadow-ocean hover:shadow-elegant",
        gold: "border-gold-accent bg-gradient-to-br from-background to-gold-light/20 shadow-glow",
        glass: "border-ocean-light/30 bg-background/80 backdrop-blur-sm shadow-elegant",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardEnhancedProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const CardEnhanced = React.forwardRef<HTMLDivElement, CardEnhancedProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
  )
);
CardEnhanced.displayName = "CardEnhanced";

const CardEnhancedHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardEnhancedHeader.displayName = "CardEnhancedHeader";

const CardEnhancedTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-ocean-primary",
      className
    )}
    {...props}
  />
));
CardEnhancedTitle.displayName = "CardEnhancedTitle";

const CardEnhancedDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardEnhancedDescription.displayName = "CardEnhancedDescription";

const CardEnhancedContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardEnhancedContent.displayName = "CardEnhancedContent";

const CardEnhancedFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardEnhancedFooter.displayName = "CardEnhancedFooter";

export {
  CardEnhanced,
  CardEnhancedHeader,
  CardEnhancedFooter,
  CardEnhancedTitle,
  CardEnhancedDescription,
  CardEnhancedContent,
};