import { fetchWithAuth } from './api';
class AIAssistant {
    audioContext = null;
    mediaRecorder = null;
    recordedChunks = [];
    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new AudioContext();
        }
    }
    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            this.mediaRecorder.start();
        }
        catch (error) {
            console.error('Failed to start voice recording:', error);
            throw error;
        }
    }
    async stopVoiceRecording() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('No active recording'));
                return;
            }
            this.mediaRecorder.onstop = async () => {
                try {
                    const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append('audio', audioBlob);
                    const response = await fetchWithAuth('/api/assistant/transcribe', {
                        method: 'POST',
                        body: formData,
                    });
                    const { transcription } = await response.json();
                    this.recordedChunks = [];
                    resolve(transcription);
                }
                catch (error) {
                    reject(error);
                }
            };
            this.mediaRecorder.stop();
        });
    }
    async analyzeDrillPerformance(drillId, metrics, videoUrl) {
        const response = await fetchWithAuth('/api/assistant/analyze-performance', {
            method: 'POST',
            body: JSON.stringify({
                drillId,
                metrics,
                videoUrl,
            }),
        });
        return response.json();
    }
    async generateSessionSummary(sessionId, includeVideo = false) {
        const response = await fetchWithAuth(`/api/assistant/session-summary/${sessionId}?includeVideo=${includeVideo}`);
        return response.json();
    }
    async suggestNextDrills(playerId, recentPerformance, focusAreas) {
        const response = await fetchWithAuth('/api/assistant/suggest-drills', {
            method: 'POST',
            body: JSON.stringify({
                playerId,
                recentPerformance,
                focusAreas,
            }),
        });
        return response.json();
    }
    async generateCoachNotes(sessionId, audioBlob) {
        const formData = new FormData();
        if (audioBlob) {
            formData.append('audio', audioBlob);
        }
        formData.append('sessionId', sessionId);
        const response = await fetchWithAuth('/api/assistant/coach-notes', {
            method: 'POST',
            body: formData,
        });
        return response.json();
    }
    async getPerformanceInsights(playerId, timeframe = 'week') {
        const response = await fetchWithAuth(`/api/assistant/insights/${playerId}?timeframe=${timeframe}`);
        return response.json();
    }
}
export const aiAssistant = new AIAssistant();
