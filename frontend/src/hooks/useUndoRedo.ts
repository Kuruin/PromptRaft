import { useState, useCallback } from "react";

export function useUndoRedo<T>(initialState: T) {
    const [state, setState] = useState<T>(initialState);
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const set = useCallback(
        (newState: T | ((prevState: T) => T)) => {
            setState((prev) => {
                const value = newState instanceof Function ? newState(prev) : newState;

                // If the new value is the same as the current, do nothing
                if (value === prev) return prev;

                setHistory((prevHistory) => {
                    // Slice the history up to the current index and add the new state
                    const newHistory = prevHistory.slice(0, currentIndex + 1);
                    newHistory.push(value);
                    return newHistory;
                });

                setCurrentIndex((prevIndex) => prevIndex + 1);
                return value;
            });
        },
        [currentIndex]
    );

    const undo = useCallback(() => {
        setCurrentIndex((prevIndex) => {
            if (prevIndex > 0) {
                const newIndex = prevIndex - 1;
                setState(history[newIndex]);
                return newIndex;
            }
            return prevIndex;
        });
    }, [history]);

    const redo = useCallback(() => {
        setCurrentIndex((prevIndex) => {
            if (prevIndex < history.length - 1) {
                const newIndex = prevIndex + 1;
                setState(history[newIndex]);
                return newIndex;
            }
            return prevIndex;
        });
    }, [history]);

    const reset = useCallback((newState: T) => {
        setState(newState);
        setHistory([newState]);
        setCurrentIndex(0);
    }, []);

    return {
        state,
        set,
        undo,
        redo,
        reset,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
    };
}
