"use client"

import { useEffect, useState } from "react"

const UNDO_WINDOW_MS = 5000;

type DeletedEntry = { id: string; employeeName: string }

export function useUndoableDelete(
    undo: (id: string) => Promise<{ error?: string }>,
    onUndoError?: (message: string) => void,
) {
    const [queue, setQueue] = useState<DeletedEntry[]>([]);
    const currentId = queue[0]?.id;

    useEffect(() => {
        if (!currentId) return;
        const timer = setTimeout(() => {
            setQueue(prev => prev.filter((d) => d.id !== currentId));
        }, UNDO_WINDOW_MS)
        return () => clearTimeout(timer)
    }, [currentId])

    function notifyDeleted(id: string, employeeName: string) {
        setQueue(prev => [...prev, { id, employeeName }])
    }

    function undoCurrent() {
        if (!currentId) return;

        setQueue(prev => prev.filter((d) => d.id !== currentId));
        undo(currentId).then((result) => {
            if (result?.error) onUndoError?.(result.error);
        });
    }

    return { current: queue[0], notifyDeleted, undoCurrent }

}