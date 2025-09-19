import { useEffect, useRef, useState } from "react";
const sampleInsights = {
    player: [
        {
            id: "player-1",
            title: "Missed Training Log",
            message: "You missed logging your last training session. Log it now or set a reminder.",
            status: "warning",
            actions: [
                { label: "Log it now", aiPrompt: "Log my last training session", variant: "primary" },
                { label: "Remind me later", aiPrompt: "Remind me to log training", variant: "secondary" },
                { label: "Dismiss", variant: "ghost" },
            ],
        },
    ],
    coach: [
        {
            id: "coach-1",
            title: "Schedule Conflict",
            message: "Two players have overlapping events this week. View details or let AI suggest a fix.",
            status: "error",
            actions: [
                { label: "View Details", aiPrompt: "Show me the conflict details", variant: "primary" },
                { label: "AI Suggest Fix", aiPrompt: "Suggest a schedule fix", variant: "secondary" },
                { label: "Dismiss", variant: "ghost" },
            ],
        },
    ],
    parent: [
        {
            id: "parent-1",
            title: "Upcoming Payment Due",
            message: "Your monthly fee for Alex is due in 2 days. Pay now or set a reminder.",
            status: "info",
            actions: [
                { label: "Pay Now", aiPrompt: "Pay my monthly fee", variant: "primary" },
                { label: "Remind me later", aiPrompt: "Remind me to pay", variant: "secondary" },
                { label: "Dismiss", variant: "ghost" },
            ],
        },
    ],
    admin: [
        {
            id: "admin-1",
            title: "System Alert: Unusual Login",
            message: "Unusual login activity detected. View details or let AI investigate.",
            status: "error",
            actions: [
                { label: "View Details", aiPrompt: "Show login alert details", variant: "primary" },
                { label: "AI Investigate", aiPrompt: "Investigate login alert", variant: "secondary" },
                { label: "Dismiss", variant: "ghost" },
            ],
        },
    ],
};
export function useInsightsScan(role, autopilot) {
    const [insights, setInsights] = useState([]);
    const timer = useRef(null);
    useEffect(() => {
        if (!autopilot)
            return;
        // On enable, immediately show a sample insight
        setInsights(sampleInsights[role] || []);
        // Periodically (every 30s) surface a new insight (mock)
        timer.current = setInterval(() => {
            setInsights((prev) => {
                // Only add if not already present
                const newOnes = (sampleInsights[role] || []).filter(i => !prev.find(p => p.id === i.id));
                return [...prev, ...newOnes];
            });
        }, 30000);
        return () => {
            if (timer.current)
                clearInterval(timer.current);
        };
    }, [role, autopilot]);
    // Dismiss handler
    const dismissInsight = (id) => {
        setInsights((prev) => prev.filter(i => i.id !== id));
    };
    return { insights, dismissInsight };
}
