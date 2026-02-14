import { useState, useEffect, useRef } from "react";
// Try to import everything as a namespace to handle potential ESM/CJS interop for Responsive
import * as ReactGridLayout from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, RotateCcw } from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { toast } from "sonner";

// Robustly get the Responsive component
const Responsive = ReactGridLayout.Responsive || (ReactGridLayout as any).default?.Responsive || (ReactGridLayout as any).default;

interface DraggableBentoGridProps {
    children: React.ReactNode[];
    defaultLayout: any[];
}

export const DraggableBentoGrid = ({ children, defaultLayout }: DraggableBentoGridProps) => {
    const [isDraggable, setIsDraggable] = useState(false);
    const [layout, setLayout] = useState(defaultLayout);
    // Explicitly compute static layout to prevent any dragging/resizing when locked
    const displayLayout = layout.map(item => ({
        ...item,
        static: !isDraggable,
        isDraggable: isDraggable,
        isResizable: isDraggable
    }));

    const [width, setWidth] = useState(1200);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setWidth(entries[0].contentRect.width);
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Load layout from local storage on mount
    useEffect(() => {
        const savedLayout = localStorage.getItem("bento-grid-layout");
        if (savedLayout) {
            try {
                setLayout(JSON.parse(savedLayout));
            } catch (e) {
                console.error("Failed to parse layout", e);
            }
        }
    }, []);

    const handleLayoutChange = (newLayout: any) => {
        setLayout(newLayout);
        if (isDraggable) {
            localStorage.setItem("bento-grid-layout", JSON.stringify(newLayout));
        }
    };

    const handleResetLayout = () => {
        setLayout(defaultLayout);
        localStorage.removeItem("bento-grid-layout");
        toast.success("Layout reset to default");
    }

    // Determine if we found a valid Responsive component
    if (!Responsive) {
        return <div className="p-4 text-red-500">Error: Could not load Grid Layout component.</div>;
    }

    return (
        <div className={`space-y-4 ${isDraggable ? 'is-draggable' : ''}`} ref={containerRef}>
            <div className="flex justify-end gap-2 mb-2">
                {isDraggable && (
                    <Button variant="outline" size="sm" onClick={handleResetLayout}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Reset Layout
                    </Button>
                )}
                <Button
                    variant={isDraggable ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                        setIsDraggable(!isDraggable);
                        toast.info(isDraggable ? "Layout Locked" : "Layout Unlocked: Drag & Resize enabled");
                    }}
                >
                    {isDraggable ? (
                        <>
                            <Lock className="w-4 h-4 mr-2" /> Lock Layout
                        </>
                    ) : (
                        <>
                            <Unlock className="w-4 h-4 mr-2" /> Edit Layout
                        </>
                    )}
                </Button>
            </div>

            {mounted && width > 0 && (
                <Responsive
                    className="layout"
                    layouts={{ lg: displayLayout, md: displayLayout, sm: displayLayout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
                    rowHeight={150}
                    width={width}
                    isDraggable={isDraggable}
                    isResizable={isDraggable}
                    // Use a key to force re-render when draggable state changes if needed, 
                    // keeping consistency with static prop
                    key={isDraggable ? 'draggable' : 'static'}
                    onLayoutChange={(newLayout) => {
                        // Only update if draggable to avoid persisting static flags or temporary states
                        if (isDraggable) {
                            handleLayoutChange(newLayout);
                        }
                    }}
                    margin={[16, 16]}
                    draggableHandle=".drag-handle"
                >
                    {children}
                </Responsive>
            )}

            <style>{`
                .react-grid-item {
                    transition: all 200ms ease;
                    transition-property: left, top;
                }
                .react-grid-item.cssTransforms {
                    transition-property: transform;
                }
                .react-grid-item.resizing {
                    z-index: 100;
                    box-shadow: 0 0 10px rgba(0,0,0,0.2);
                }
                .react-grid-placeholder {
                    background: rgba(var(--ocean-primary), 0.2) !important;
                    border-radius: 0.5rem;
                    opacity: 0.5;
                }
                 /* Hide resize handle when not draggable */
                 .react-grid-item:not(.react-grid-placeholder) > .react-resizable-handle {
                    display: ${isDraggable ? 'block' : 'none'};
                 }
                 /* Hide drag handle when not draggable */
                 .is-draggable .drag-handle {
                    cursor: move;
                 }
                 .space-y-4:not(.is-draggable) .drag-handle {
                    display: none;
                    pointer-events: none;
                 }
            `}</style>
        </div>
    );
};
