import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
    onRename?: (id: string, newTitle: string) => void;
    isOpen: boolean;
}

export function PromptSidebar({ prompts, selectedId, onSelect, onNew, onRename, isOpen }: PromptSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const handleStartEdit = (e: React.MouseEvent, prompt: PromptProject) => {
        e.stopPropagation();
        setEditingId(prompt._id);
        setEditTitle(prompt.title);
    };

    const handleSaveEdit = (e?: React.MouseEvent | React.FormEvent) => {
        e?.stopPropagation();
        if (editingId && editTitle.trim() && onRename) {
            onRename(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

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
                            <div key={prompt._id} className="relative group flex items-center">
                                {editingId === prompt._id ? (
                                    <div className="flex items-center w-full gap-1 p-1">
                                        <Input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            autoFocus
                                            className="h-8 text-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20"
                                            onClick={handleSaveEdit}
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                                            onClick={handleCancelEdit}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant={selectedId === prompt._id ? "secondary" : "custom2"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal truncate group-hover:pr-8 transition-all",
                                            selectedId === prompt._id && "bg-muted"
                                        )}
                                        onClick={() => onSelect(prompt._id)}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2 opacity-70 shrink-0" />
                                        <span className="truncate">{prompt.title}</span>
                                    </Button>
                                )}

                                {editingId !== prompt._id && onRename && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-all bg-background/50 backdrop-blur-sm hover:bg-muted dark:hover:bg-muted/80"
                                        onClick={(e) => handleStartEdit(e, prompt)}
                                        title="Rename Project"
                                    >
                                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
