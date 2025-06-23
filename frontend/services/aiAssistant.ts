import { fetchWithAuth } from './api';
import { DrillDetail } from '../types';
import axios from 'axios';

export interface PerformanceMetrics {
    accuracy: number;
    speed: number;
    consistency: number;
    formScore: number;
    energyLevel: number;
    focusScore: number;
}

export interface DrillAdaptation {
    difficulty: 'easier' | 'harder' | 'maintain';
    modifications: {
        type: 'speed' | 'complexity' | 'duration' | 'intensity';
        change: number;
        reason: string;
    }[];
    notes: string;
}

export interface CoachNote {
    timestamp: string;
    type: 'observation' | 'suggestion' | 'warning' | 'praise';
    content: string;
    confidence: number;
    relatedMetrics?: string[];
    actionItems?: string[];
}

export interface SessionSummary {
    duration: number;
    drillsCompleted: DrillDetail[];
    performanceHighlights: {
        metric: keyof PerformanceMetrics;
        value: number;
        trend: 'improving' | 'declining' | 'stable';
        note: string;
    }[];
    coachNotes: CoachNote[];
    recommendations: {
        drillId: string;
        reason: string;
        expectedImpact: string;
        confidence: number;
    }[];
}

class AIAssistant {
    private audioContext: AudioContext | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new AudioContext();
        }
    }

    async startVoiceRecording(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
        } catch (error) {
            console.error('Failed to start voice recording:', error);
            throw error;
        }
    }

    async stopVoiceRecording(): Promise<string> {
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
                } catch (error) {
                    reject(error);
                }
            };

            this.mediaRecorder.stop();
        });
    }

    async analyzeDrillPerformance(
        drillId: string,
        metrics: PerformanceMetrics,
        videoUrl?: string
    ): Promise<{
        adaptation: DrillAdaptation;
        notes: CoachNote[];
    }> {
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

    async generateSessionSummary(
        sessionId: string,
        includeVideo: boolean = false
    ): Promise<SessionSummary> {
        const response = await fetchWithAuth(
            `/api/assistant/session-summary/${sessionId}?includeVideo=${includeVideo}`
        );
        return response.json();
    }

    async suggestNextDrills(
        playerId: string,
        recentPerformance: PerformanceMetrics,
        focusAreas?: string[]
    ): Promise<{
        suggestions: {
            drill: DrillDetail;
            reasoning: string;
            difficulty: number;
            expectedBenefits: string[];
        }[];
    }> {
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

    async generateCoachNotes(
        sessionId: string,
        audioBlob?: Blob
    ): Promise<{
        notes: CoachNote[];
        summary: string;
        keyPoints: string[];
    }> {
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

    async getPerformanceInsights(
        playerId: string,
        timeframe: 'day' | 'week' | 'month' = 'week'
    ): Promise<{
        trends: {
            metric: keyof PerformanceMetrics;
            values: { date: string; value: number }[];
            insight: string;
        }[];
        recommendations: string[];
    }> {
        const response = await fetchWithAuth(
            `/api/assistant/insights/${playerId}?timeframe=${timeframe}`
        );
        return response.json();
    }
}

export const aiAssistant = new AIAssistant();

export async function fetchCoachingRecommendations({ playerId, sport, walletAddress, signature, message }: any) {
  const res = await axios.post('/api/coach/recommendations', {
    player_id: playerId,
    sport,
    wallet_address: walletAddress,
    signature,
    message
  });
  return res.data;
}

export async function playAudioFeedback(content: any) {
  // Placeholder: will call /api/audio-coaching with content and play audio
  // For now, just log
  console.log('Play audio for', content);
  // TODO: Implement audio playback using audio_coaching utility
} 