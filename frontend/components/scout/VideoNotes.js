import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/contexts/AdminAuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
export const VideoNotes = ({ playerId, onHealthCheck, onIssueReport }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isPlayer, setIsPlayer] = useState(false);
    useEffect(() => {
        const checkAccess = async () => {
            if (!user?.uid)
                return;
            try {
                await updateDoc(doc(db, 'profiles', user.uid), {
                    lastViewed: new Date()
                });
            }
            catch (error) {
                console.error('Failed to update profile:', error);
            }
        };
        checkAccess();
    }, [user]);
    useEffect(() => {
        if (loading)
            return;
        const checkPlayerAccess = async () => {
            if (!user?.uid)
                return;
            if (isPlayer && playerId !== user?.uid) {
                router.push('/unauthorized');
            }
        };
        checkPlayerAccess();
    }, [loading, isPlayer, playerId, router]);
    // Simplified chart data
    const chartData = {
        earnings: {
            timeline: [
                { date: '2024-01', amount: 100 },
                { date: '2024-02', amount: 150 },
                { date: '2024-03', amount: 200 }
            ],
            weeklyTips: [
                { date: 'Week 1', count: 5 },
                { date: 'Week 2', count: 8 },
                { date: 'Week 3', count: 12 }
            ]
        },
        referrals: {
            distribution: [
                { tier: 'Bronze', count: 10 },
                { tier: 'Silver', count: 5 },
                { tier: 'Gold', count: 2 }
            ]
        }
    };
    const timelineLabels = chartData.earnings.timeline.map(p => p.date);
    const timelineData = chartData.earnings.timeline.map(p => p.amount);
    const weeklyLabels = chartData.earnings.weeklyTips.map(p => p.date);
    const weeklyData = chartData.earnings.weeklyTips.map(p => p.count);
    const referralLabels = chartData.referrals.distribution.map(p => p.tier);
    const referralData = chartData.referrals.distribution.map(p => p.count);
    return (_jsxs("div", { className: "video-notes-container", children: [_jsxs("div", { className: "header", children: [_jsx("h1", { children: "Video Notes" }), _jsx("button", { className: "chat-button", onClick: () => console.log('Chat clicked'), children: "Chat" })] }), _jsxs("div", { className: "content", children: [_jsxs("div", { className: "stats-section", children: [_jsx("h2", { children: "Performance Stats" }), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("h3", { children: "Recent Drills" }), _jsx("p", { children: "5 completed this week" })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h3", { children: "Improvement" }), _jsx("p", { children: "+15% accuracy" })] })] })] }), _jsxs("div", { className: "referrals-section", children: [_jsx("h2", { children: "Referral Distribution" }), _jsx("div", { className: "referral-tiers", children: chartData.referrals.distribution.map(tier => (_jsxs("div", { className: "tier-card", children: [_jsx("h3", { children: tier.tier }), _jsxs("p", { children: [tier.count, " referrals"] }), _jsx("div", { className: "tier-color", style: {
                                                backgroundColor: tier.tier === 'Gold' ? '#FFD700' :
                                                    tier.tier === 'Silver' ? '#C0C0C0' : '#CD7F32'
                                            } })] }, tier.tier))) })] })] })] }));
};
