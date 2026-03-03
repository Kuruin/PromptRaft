import { useCallback, useRef } from "react";

interface UseLongPressOptions {
    onStart?: () => void;
    onFinish?: () => void;
    onCancel?: () => void;
    threshold?: number;
    intervalMs?: number;
}

export function useLongPress(
    callback: () => void,
    {
        onStart,
        onFinish,
        onCancel,
        threshold = 500, // How long to press before it counts as a long press
        intervalMs = 100 // How often to fire the callback after threshold is reached
    }: UseLongPressOptions = {}
) {
    const isLongPressActive = useRef(false);
    const isPressed = useRef(false);
    const timeoutId = useRef<NodeJS.Timeout>();
    const intervalId = useRef<NodeJS.Timeout>();

    const start = useCallback(
        (event: React.MouseEvent | React.TouchEvent) => {
            // Prevent context menu or default behaviors if necessary, depending on the event
            if ("button" in event && event.button !== 0) return; // Only trigger on left click

            isPressed.current = true;
            if (onStart) onStart();

            timeoutId.current = setTimeout(() => {
                isLongPressActive.current = true;

                // Fire once immediately when long press threshold is reached
                callback();

                // Then start firing continuously
                intervalId.current = setInterval(() => {
                    callback();
                }, intervalMs);

            }, threshold);
        },
        [callback, threshold, intervalMs, onStart]
    );

    const clear = useCallback(
        (event: React.MouseEvent | React.TouchEvent, shouldTriggerClick: boolean = true) => {
            if (!isPressed.current) return;
            isPressed.current = false;

            if (timeoutId.current) clearTimeout(timeoutId.current);
            if (intervalId.current) clearInterval(intervalId.current);

            if (isLongPressActive.current) {
                // It was a long press, so finish it
                if (onFinish) onFinish();
            } else if (shouldTriggerClick) {
                // It was a short click, just fire the callback once
                callback();
            } else {
                // It was cancelled (e.g., mouse left the button before threshold)
                if (onCancel) onCancel();
            }

            isLongPressActive.current = false;
        },
        [callback, onFinish, onCancel]
    );

    return {
        onMouseDown: (e: React.MouseEvent) => start(e),
        onMouseUp: (e: React.MouseEvent) => clear(e),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onTouchEnd: (e: React.TouchEvent) => clear(e),
    };
}
