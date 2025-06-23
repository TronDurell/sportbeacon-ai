import { useCallback } from 'react';
import { useExport } from './ExportContext';
import { generatePDF } from './PDFExporter';
import { zipExportBundle } from './ZipExporter';
import { ScoutPlayer } from '../../../types/player';
import { AIAnalysis } from '../../../services/PlayerAIService';

interface ExportOptions {
    includeVideos?: boolean;
    includeAIAnalysis?: boolean;
    organizationLogo?: string;
    customHeader?: string;
}

export const useRecruiterExport = () => {
    const {
        selectedPlayers,
        playerData,
        exportProgress,
        setExportProgress,
        updatePlayerData,
    } = useExport();

    const fetchPlayerData = useCallback(async (playerId: string) => {
        try {
            setExportProgress({
                status: 'loading',
                message: `Loading data for player ${playerId}...`,
            });

            // Replace with your actual API endpoints
            const [player, aiAnalysis, videoClips, drillHistory] = await Promise.all([
                fetch(`/api/players/${playerId}`).then(res => res.json()),
                fetch(`/api/players/${playerId}/ai-analysis`).then(res => res.json()),
                fetch(`/api/players/${playerId}/video-clips`).then(res => res.json()),
                fetch(`/api/players/${playerId}/drill-history`).then(res => res.json()),
            ]);

            updatePlayerData(playerId, {
                player,
                aiAnalysis,
                videoClips,
                drillHistory,
            });

            return { player, aiAnalysis, videoClips, drillHistory };
        } catch (error) {
            console.error(`Failed to fetch data for player ${playerId}:`, error);
            throw error;
        }
    }, [setExportProgress, updatePlayerData]);

    const generateExport = useCallback(async (options: ExportOptions = {}) => {
        try {
            setExportProgress({
                status: 'loading',
                progress: 0,
                message: 'Preparing export...',
            });

            // Fetch data for any players that haven't been loaded yet
            const pendingDataFetches = selectedPlayers
                .filter(id => !playerData.has(id))
                .map(fetchPlayerData);

            await Promise.all(pendingDataFetches);

            setExportProgress({
                status: 'generating',
                progress: 30,
                message: 'Generating PDF...',
            });

            const exportData = selectedPlayers.map(id => playerData.get(id)!);
            const pdfBlob = await generatePDF(exportData, options);

            if (options.includeVideos) {
                setExportProgress({
                    status: 'compressing',
                    progress: 60,
                    message: 'Packaging video clips...',
                });

                const zipBlob = await zipExportBundle({
                    pdf: pdfBlob,
                    players: exportData,
                });

                setExportProgress({
                    status: 'complete',
                    progress: 100,
                    message: 'Export complete!',
                });

                return zipBlob;
            }

            setExportProgress({
                status: 'complete',
                progress: 100,
                message: 'Export complete!',
            });

            return pdfBlob;
        } catch (error) {
            console.error('Export failed:', error);
            setExportProgress({
                status: 'error',
                progress: 0,
                message: 'Export failed. Please try again.',
            });
            throw error;
        }
    }, [selectedPlayers, playerData, setExportProgress, fetchPlayerData]);

    const downloadExport = useCallback(async (options: ExportOptions = {}) => {
        const blob = await generateExport(options);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scout_report_${new Date().toISOString().split('T')[0]}.${
            options.includeVideos ? 'zip' : 'pdf'
        }`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [generateExport]);

    const shareViaEmail = useCallback(async (
        email: string,
        message: string,
        options: ExportOptions = {}
    ) => {
        try {
            const blob = await generateExport(options);
            const formData = new FormData();
            formData.append('file', blob);
            formData.append('email', email);
            formData.append('message', message);

            const response = await fetch('/api/share/email', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            return response.json();
        } catch (error) {
            console.error('Failed to share via email:', error);
            throw error;
        }
    }, [generateExport]);

    return {
        exportProgress,
        generateExport,
        downloadExport,
        shareViaEmail,
    };
}; 