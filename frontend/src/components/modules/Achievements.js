import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Trophy, Star, Target, Award } from "lucide-react";
const Achievements = () => {
    const achievements = [
        {
            id: "1",
            title: "First Goal",
            description: "Score your first goal in a match",
            icon: "⚽",
            category: "performance",
            unlocked: true,
            unlockedDate: new Date("2024-01-15")
        },
        {
            id: "2",
            title: "Perfect Attendance",
            description: "Attend 10 consecutive practices",
            icon: "📅",
            category: "participation",
            unlocked: false,
            progress: 7,
            maxProgress: 10
        },
        {
            id: "3",
            title: "Team Captain",
            description: "Be selected as team captain",
            icon: "👑",
            category: "leadership",
            unlocked: true,
            unlockedDate: new Date("2024-01-20")
        },
        {
            id: "4",
            title: "Skill Master",
            description: "Complete 50 skill drills",
            icon: "🎯",
            category: "skill",
            unlocked: false,
            progress: 32,
            maxProgress: 50
        }
    ];
    const getCategoryIcon = (category) => {
        switch (category) {
            case "performance": return _jsx(Trophy, { className: "w-5 h-5 text-yellow-500" });
            case "participation": return _jsx(Star, { className: "w-5 h-5 text-blue-500" });
            case "leadership": return _jsx(Award, { className: "w-5 h-5 text-purple-500" });
            case "skill": return _jsx(Target, { className: "w-5 h-5 text-green-500" });
            default: return _jsx(Star, { className: "w-5 h-5 text-gray-500" });
        }
    };
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Achievements" }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-2xl font-bold text-blue-600", children: [unlockedCount, "/", totalCount] }), _jsx("p", { className: "text-sm text-gray-600", children: "Achievements Unlocked" })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: achievements.map((achievement) => (_jsxs("div", { className: `bg-white rounded-lg shadow p-6 border-2 ${achievement.unlocked ? "border-green-200" : "border-gray-200"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [getCategoryIcon(achievement.category), _jsx("span", { className: "text-2xl", children: achievement.icon })] }), achievement.unlocked && (_jsx("div", { className: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium", children: "Unlocked" }))] }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: achievement.title }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: achievement.description }), achievement.unlocked ? (_jsxs("div", { className: "text-sm text-green-600", children: ["Unlocked on ", achievement.unlockedDate?.toLocaleDateString()] })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Progress" }), _jsxs("span", { className: "text-gray-900", children: [achievement.progress, "/", achievement.maxProgress] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: {
                                            width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%`
                                        } }) })] }))] }, achievement.id))) })] }));
};
export default Achievements;
