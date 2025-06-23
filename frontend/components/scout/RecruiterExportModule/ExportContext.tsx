import React, { createContext, useContext, useState, useCallback } from 'react';
import { ScoutPlayer } from '../../../types/player';
import { AIAnalysis } from '../../../services/PlayerAIService';

interface ExportContextState {
    selectedPlayers: string[];
    playerData: Map<string, {
        player: ScoutPlayer;
        aiAnalysis: AIAnalysis;
        videoClips: Array<{
            url: string;
            timestamp: number;
            description: string;
        }>;
        drillHistory: Array<{
            date: string;
            name: string;
            performance: number;
            notes: string;
        }>;
    }>;
    exportProgress: {
        status: 'idle' | 'loading' | 'generating' | 'compressing' | 'complete' | 'error';
        progress: number;
        message: string;
    };
}

interface ExportContextValue extends ExportContextState {
    togglePlayerSelection: (playerId: string) => void;
    selectAllPlayers: () => void;
    deselectAllPlayers: () => void;
    updatePlayerData: (playerId: string, data: Partial<ExportContextState['playerData']>) => void;
    setExportProgress: (progress: Partial<ExportContextState['exportProgress']>) => void;
    clearExport: () => void;
}

const ExportContext = createContext<ExportContextValue | null>(null);

interface ExportProviderProps {
    children: React.ReactNode;
    availablePlayers: ScoutPlayer[];
}

export const ExportProvider: React.FC<ExportProviderProps> = ({
    children,
    availablePlayers,
}) => {
    const [state, setState] = useState<ExportContextState>({
        selectedPlayers: [],
        playerData: new Map(),
        exportProgress: {
            status: 'idle',
            progress: 0,
            message: '',
        },
    });

    const togglePlayerSelection = useCallback((playerId: string) => {
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

    const updatePlayerData = useCallback((
        playerId: string,
        data: Partial<ExportContextState['playerData']>
    ) => {
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

    const setExportProgress = useCallback((
        progress: Partial<ExportContextState['exportProgress']>
    ) => {
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

    const value: ExportContextValue = {
        ...state,
        togglePlayerSelection,
        selectAllPlayers,
        deselectAllPlayers,
        updatePlayerData,
        setExportProgress,
        clearExport,
    };

    return (
        <ExportContext.Provider value={value}>
            {children}
        </ExportContext.Provider>
    );
};

export const useExport = () => {
    const context = useContext(ExportContext);
    if (!context) {
        throw new Error('useExport must be used within an ExportProvider');
    }
    return context;
}; 