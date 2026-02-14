import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, History, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptProject {
    _id: string;
    title: string;
    updatedAt: string;
}

interface PromptSidebarProps {
    prompts: PromptProject[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    isOpen: boolean;
}

export function PromptSidebar({ prompts, selectedId, onSelect, onNew, isOpen }: PromptSidebarProps) {
    return (
        <div
            className={cn(
                "border-r bg-card h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
                isOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-none"
            )}
        >
            <div className="w-64 flex flex-col h-full">
                <div className="p-4 border-b">
                    <Button onClick={onNew} className="w-full gap-2" variant="outline">
                        <Plus className="w-4 h-4" /> New Project
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                        {prompts.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No saved prompts yet.
                            </div>
                        )}
                        {prompts.map((prompt) => (
                            <Button
                                key={prompt._id}
                                variant={selectedId === prompt._id ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start text-left font-normal truncate",
                                    selectedId === prompt._id && "bg-muted"
                                )}
                                onClick={() => onSelect(prompt._id)}
                            >
                                <MessageSquare className="w-4 h-4 mr-2 opacity-70" />
                                <span className="truncate">{prompt.title}</span>
                                {/* <span className="ml-auto text-xs opacity-50">
                                {new Date(prompt.updatedAt).toLocaleDateString()}
                            </span> */}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
