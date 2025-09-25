import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PlayerAPI } from '../services/playerAPI';
export const ScoutDashboard = ({ scoutId }) => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        ageRange: [0, 100],
        positions: [],
        skills: [],
        minRating: 0
    });
    const playerAPI = new PlayerAPI();
    const addScoutNote = async (note) => {
        try {
            await playerAPI.addScoutNote({
                ...note,
                scoutId: scoutId,
                visibility: 'private'
            });
        }
        catch (error) {
            console.error('Failed to add scout note:', error);
        }
    };
    const updatePlayerEvaluation = async (playerId, evaluation) => {
        try {
            await playerAPI.updatePlayerEvaluation(playerId, {
                ...evaluation,
                overallPotential: evaluation.overallPotential || 0,
                lastUpdated: new Date(),
                evaluatorId: scoutId
            });
        }
        catch (error) {
            console.error('Failed to update player evaluation:', error);
        }
    };
    const filteredPlayers = players.filter(player => {
        const matchesSearch = !searchQuery ||
            player.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            player.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            player.team?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAge = filters.ageRange.length === 2 &&
            player.age !== undefined &&
            filters.ageRange.every(([min, max]) => player.age >= min && player.age <= max);
        const matchesPosition = filters.positions.length === 0 ||
            (player.position && filters.positions.includes(player.position));
        const matchesSkills = filters.skills.length === 0 ||
            (player.skills && player.skills.some((s) => s.name && filters.skills.includes(s.name) && s.level >= 7));
        const matchesRating = player.scoutRating !== undefined &&
            player.scoutRating >= filters.minRating;
        return matchesSearch && matchesAge && matchesPosition && matchesSkills && matchesRating;
    });
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        if (filters.minRating > 0) {
            return (b.scoutRating || 0) - (a.scoutRating || 0);
        }
        if (filters.ageRange.length === 2) {
            return (a.age || 0) - (b.age || 0);
        }
        return 0;
    });
    return (_jsxs("div", { className: "scout-dashboard", children: [_jsxs("div", { className: "header", children: [_jsx("h1", { children: "Scout Dashboard" }), _jsx("input", { type: "text", placeholder: "Search players...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsx("div", { className: "players-grid", children: sortedPlayers.map(player => (_jsx("div", { className: "player-card", children: _jsxs("div", { className: "player-info", children: [_jsxs("h3", { children: [player.firstName, " ", player.lastName] }), _jsx("div", { className: "rating", children: _jsxs("span", { children: ["Rating: ", (player.scoutRating || 0) / 2, "/5"] }) }), _jsxs("p", { children: [player.age || 'N/A', " years \u2022 ", player.position || 'N/A', " \u2022 ", player.team?.name || 'No Team'] }), player.skills && (_jsx("div", { className: "skills", children: player.skills.map((skill) => (_jsxs("span", { className: "skill-tag", children: [skill.name, ": ", skill.level] }, skill.name))) }))] }) }, player.id))) })] }));
};
