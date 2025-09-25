import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
const ExportContext = createContext(null);
export const ExportProvider = ({ children, availablePlayers, }) => {
    const [state, setState] = useState({
        selectedPlayers: [],
        playerData: new Map(),
        exportProgress: {
            status: 'idle',
            progress: 0,
            message: '',
        },
    });
    const togglePlayerSelection = useCallback((playerId) => {
        setState(prev => ({
            ...prev,
            selectedPlayers: prev.selectedPlayers.includes(playerId)
                ? prev.selectedPlayers.filter(id => id !== playerId)
                : [...prev.selectedPlayers, playerId],
        }));
    }, []);
    const selectAllPlayers = useCallback(() => {
        setState(prev => ({
            ...prev,
            selectedPlayers: availablePlayers.map(p => p.id),
        }));
    }, [availablePlayers]);
    const deselectAllPlayers = useCallback(() => {
        setState(prev => ({
            ...prev,
            selectedPlayers: [],
        }));
    }, []);
    const updatePlayerData = useCallback((playerId, data) => {
        setState(prev => {
            const newPlayerData = new Map(prev.playerData);
            const existingData = newPlayerData.get(playerId) || {};
            newPlayerData.set(playerId, { ...existingData, ...data });
            return {
                ...prev,
                playerData: newPlayerData,
            };
        });
    }, []);
    const setExportProgress = useCallback((progress) => {
        setState(prev => ({
            ...prev,
            exportProgress: {
                ...prev.exportProgress,
                ...progress,
            },
        }));
    }, []);
    const clearExport = useCallback(() => {
        setState({
            selectedPlayers: [],
            playerData: new Map(),
            exportProgress: {
                status: 'idle',
                progress: 0,
                message: '',
            },
        });
    }, []);
    const value = {
        ...state,
        togglePlayerSelection,
        selectAllPlayers,
        deselectAllPlayers,
        updatePlayerData,
        setExportProgress,
        clearExport,
    };
    return (_jsx(ExportContext.Provider, { value: value, children: children }));
};
export const useExport = () => {
    const context = useContext(ExportContext);
    if (!context) {
        throw new Error('useExport must be used within an ExportProvider');
    }
    return context;
};
