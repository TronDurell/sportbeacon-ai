import axios from 'axios';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Voice configurations for different coaching tones
const VOICE_CONFIGS = {
  coach_mike: {
    voice_id: '21m00Tcm4TlvDq8ikWAM', // ElevenLabs voice ID
    name: 'Coach Mike',
    tone: 'encouraging',
    gender: 'male',
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  },
  coach_sarah: {
    voice_id: 'AZnzlk1XvdvUeBnXmlld', // ElevenLabs voice ID
    name: 'Coach Sarah',
    tone: 'technical',
    gender: 'female',
    stability: 0.6,
    similarity_boost: 0.8,
    style: 0.1,
    use_speaker_boost: true
  },
  coach_james: {
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // ElevenLabs voice ID
    name: 'Coach James',
    tone: 'motivational',
    gender: 'male',
    stability: 0.7,
    similarity_boost: 0.85,
    style: 0.2,
    use_speaker_boost: true
  },
  coach_lisa: {
    voice_id: 'VR6AewLTigWG4xSOukaG', // ElevenLabs voice ID
    name: 'Coach Lisa',
    tone: 'strict',
    gender: 'female',
    stability: 0.9,
    similarity_boost: 0.95,
    style: 0.0,
    use_speaker_boost: true
  },
  motivational_coach: {
    voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
    stability: 0.4,
    similarity_boost: 0.7,
    style: 0.3,
    use_speaker_boost: true
  },
  technical_coach: {
    voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi voice
    stability: 0.8,
    similarity_boost: 0.9,
    style: 0.0,
    use_speaker_boost: true
  }
};

// Tone-specific message templates
const TONE_TEMPLATES = {
  encouraging: {
    positive: [
      "Great work! Your {skill} is looking really good.",
      "Excellent form! Keep up the momentum.",
      "You're making fantastic progress on {skill}.",
      "That's the right technique! Well done."
    ],
    improvement: [
      "Let's work on {skill}. You're getting closer!",
      "Good effort! A few more reps and you'll have it.",
      "Keep practicing {skill}. You're improving every time.",
      "Nice try! Let's refine that {skill} technique."
    ],
    motivation: [
      "You've got this! Keep pushing through.",
      "Stay focused and trust your training.",
      "Every rep counts toward your goals.",
      "You're building something special here."
    ]
  },
  technical: {
    positive: [
      "Your {skill} form is technically sound. Maintain this position.",
      "Excellent biomechanics on that {skill} movement.",
      "Your {skill} technique shows proper muscle engagement.",
      "Good alignment and posture throughout the {skill}."
    ],
    improvement: [
      "Focus on {skill} form. Ensure proper knee alignment.",
      "Adjust your {skill} stance. Feet should be shoulder-width apart.",
      "For {skill}, maintain core stability throughout the movement.",
      "Your {skill} needs more hip hinge. Keep chest up."
    ],
    motivation: [
      "Consistent form leads to consistent results.",
      "Technique first, then intensity.",
      "Quality over quantity in every rep.",
      "Perfect practice makes perfect performance."
    ]
  },
  motivational: {
    positive: [
      "🔥 Incredible work on {skill}! You're on fire!",
      "💪 That {skill} was absolutely dominant!",
      "🚀 You're crushing it with {skill}! Keep soaring!",
      "⭐ Outstanding {skill} performance! You're a star!"
    ],
    improvement: [
      "💪 Let's level up your {skill}! You're ready for this challenge!",
      "🔥 Time to unlock your {skill} potential! Let's go!",
      "⚡ Your {skill} is about to reach new heights!",
      "🌟 Every {skill} rep brings you closer to greatness!"
    ],
    motivation: [
      "🔥 You're unstoppable! Keep that energy high!",
      "💪 Champions are made in moments like this!",
      "🚀 Your dedication is inspiring! Keep pushing!",
      "⭐ You're building a legacy of excellence!"
    ]
  },
  strict: {
    positive: [
      "Acceptable {skill} form. Maintain this standard.",
      "Your {skill} meets expectations. Don't let it slip.",
      "Good {skill} execution. Keep this level of focus.",
      "Proper {skill} technique. Continue with this precision."
    ],
    improvement: [
      "Your {skill} needs work. Focus on the fundamentals.",
      "Unacceptable {skill} form. Correct it immediately.",
      "Your {skill} is below standard. Put in more effort.",
      "That {skill} was sloppy. Clean it up now."
    ],
    motivation: [
      "Excellence is not optional. Demand more from yourself.",
      "Mediocrity is not acceptable. Push harder.",
      "Your potential is being wasted. Step it up.",
      "Champions don't make excuses. Get it done."
    ]
  }
};

interface CoachingAudioRequest {
  text?: string;
  voice?: string;
  tone?: string;
  skill?: string;
  feedback_type?: 'positive' | 'improvement' | 'motivation';
  context?: 'drill_start' | 'form_correction' | 'milestone' | 'encouragement';
  urgency?: 'low' | 'medium' | 'high';
}

interface AudioResponse {
  audio_url: string;
  duration: number;
  voice_used: string;
  tone_used: string;
  text_generated: string;
}

interface AudioCoachingOptions {
  personality?: keyof typeof COACH_PERSONALITIES;
  voice?: string;
  speed?: number;
  volume?: number;
  language?: string;
}

class AudioCoachingService extends EventEmitter {
  private audioCache: Map<string, AudioResponse> = new Map();
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    super();
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    // Initialize Web Audio API context for better audio control
    if (typeof window !== 'undefined') {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContext();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }

  /**
   * Generate audio feedback from text using ElevenLabs
   */
  async generateAudioFeedback(
    text: string,
    options: AudioCoachingOptions = {}
  ): Promise<AudioResponse> {
    try {
      const personality = options.personality || 'motivational';
      const voiceConfig = VOICE_CONFIGS[COACH_PERSONALITIES[personality].voice];
      
      // Check cache first
      const cacheKey = `${text}_${personality}_${voiceConfig.voice_id}`;
      if (this.audioCache.has(cacheKey)) {
        return this.audioCache.get(cacheKey)!;
      }

      // Prepare the API request
      const requestData = {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: voiceConfig.stability,
          similarity_boost: voiceConfig.similarity_boost,
          style: voiceConfig.style,
          use_speaker_boost: voiceConfig.use_speaker_boost
        }
      };

      // Make API call to ElevenLabs
      const response = await axios.post(
        `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceConfig.voice_id}`,
        requestData,
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
          },
          responseType: 'arraybuffer'
        }
      );

      // Convert audio buffer to base64 URL
      const audioBuffer = Buffer.from(response.data);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Calculate duration (approximate)
      const duration = this.estimateAudioDuration(audioBuffer);

      const audioResponse: AudioResponse = {
        audio_url: audioUrl,
        duration: duration,
        voice_used: voiceConfig.name,
        tone_used: personality,
        text_generated: text
      };

      // Cache the response
      this.audioCache.set(cacheKey, audioResponse);

      // Emit event for successful generation
      this.emit('audioGenerated', audioResponse);

      return audioResponse;

    } catch (error) {
      console.error('Error generating audio feedback:', error);
      throw new Error(`Failed to generate audio: ${error.message}`);
    }
  }

  /**
   * Play audio feedback
   */
  async playAudioFeedback(
    text: string,
    options: AudioCoachingOptions = {}
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stopAudio();

      // Generate audio
      const audioResponse = await this.generateAudioFeedback(text, options);

      // Create audio element
      const audio = new Audio(audioResponse.audio_url);
      
      // Set audio properties
      audio.volume = options.volume || 0.8;
      audio.playbackRate = options.speed || 1.0;

      // Set up event listeners
      audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.emit('audioPlay', audioResponse);
      });

      audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.emit('audioEnd', audioResponse);
      });

      audio.addEventListener('error', (error) => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.emit('audioError', error);
      });

      // Play the audio
      this.currentAudio = audio;
      await audio.play();

    } catch (error) {
      console.error('Error playing audio feedback:', error);
      this.emit('audioError', error);
      throw error;
    }
  }

  /**
   * Stop currently playing audio
   */
  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.emit('audioStop');
  }

  /**
   * Pause audio
   */
  pauseAudio(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.emit('audioPause');
    }
  }

  /**
   * Resume audio
   */
  resumeAudio(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      this.emit('audioResume');
    }
  }

  /**
   * Generate coaching feedback based on performance data
   */
  async generatePerformanceFeedback(
    performanceData: any,
    options: AudioCoachingOptions = {}
  ): Promise<AudioResponse> {
    const personality = options.personality || 'motivational';
    const coach = COACH_PERSONALITIES[personality];

    // Generate feedback text based on performance
    let feedbackText = this.generateFeedbackText(performanceData, coach);

    // Generate and play audio
    return await this.generateAudioFeedback(feedbackText, options);
  }

  /**
   * Generate feedback text based on performance data
   */
  private generateFeedbackText(performanceData: any, coach: any): string {
    const { stats, achievements, trends } = performanceData;

    let feedback = '';

    // Analyze performance trends
    if (trends?.improvement > 0) {
      feedback += `Great work! You've improved by ${trends.improvement}% this week. `;
    }

    if (stats?.current_streak > 5) {
      feedback += `Your ${stats.current_streak}-day streak is impressive! `;
    }

    if (achievements?.recent?.length > 0) {
      feedback += `Congratulations on earning ${achievements.recent[0]}! `;
    }

    // Add personality-specific feedback
    switch (coach.style) {
      case 'encouraging and energetic':
        feedback += 'Keep up this amazing momentum! You\'re crushing it!';
        break;
      case 'analytical and precise':
        feedback += 'Focus on maintaining consistent form and technique.';
        break;
      case 'intense and competitive':
        feedback += 'Push harder! You have what it takes to dominate!';
        break;
      case 'caring and supportive':
        feedback += 'Remember to take care of yourself and celebrate your progress.';
        break;
    }

    return feedback || 'Keep up the great work!';
  }

  /**
   * Estimate audio duration from buffer
   */
  private estimateAudioDuration(audioBuffer: Buffer): number {
    // Rough estimation: 1 second ≈ 16KB for MP3
    const bytesPerSecond = 16000;
    return Math.round(audioBuffer.length / bytesPerSecond);
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
        }
      });
      return response.data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  /**
   * Get coach personalities
   */
  getCoachPersonalities() {
    return COACH_PERSONALITIES;
  }

  /**
   * Get voice configurations
   */
  getVoiceConfigs() {
    return VOICE_CONFIGS;
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    this.audioCache.clear();
    this.emit('cacheCleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.audioCache.size,
      entries: Array.from(this.audioCache.keys())
    };
  }

  /**
   * Check if audio is currently playing
   */
  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current audio information
   */
  getCurrentAudio(): AudioResponse | null {
    if (this.currentAudio) {
      // Return cached info if available
      return null; // Would need to track current audio response
    }
    return null;
  }
}

// Create singleton instance
const audioCoachingService = new AudioCoachingService();

// Export functions for easy use
export const generateAudioFeedback = (text: string, options?: AudioCoachingOptions) =>
  audioCoachingService.generateAudioFeedback(text, options);

export const playAudioFeedback = (text: string, options?: AudioCoachingOptions) =>
  audioCoachingService.playAudioFeedback(text, options);

export const stopAudio = () => audioCoachingService.stopAudio();

export const pauseAudio = () => audioCoachingService.pauseAudio();

export const resumeAudio = () => audioCoachingService.resumeAudio();

export const generatePerformanceFeedback = (performanceData: any, options?: AudioCoachingOptions) =>
  audioCoachingService.generatePerformanceFeedback(performanceData, options);

export const getCoachPersonalities = () => audioCoachingService.getCoachPersonalities();

export const getVoiceConfigs = () => audioCoachingService.getVoiceConfigs();

export const isAudioPlaying = () => audioCoachingService.isAudioPlaying();

// Export the service instance for advanced usage
export default audioCoachingService;

// Utility functions for different coaching scenarios
export async function generateFormCorrectionAudio(skill: string, issue: string, voice: string = 'coach_mike'): Promise<string> {
  return generateCoachingAudio({
    skill,
    voice,
    tone: 'technical',
    feedback_type: 'improvement',
    context: 'form_correction',
    urgency: 'medium'
  });
}

export async function generateMilestoneAudio(skill: string, achievement: string, voice: string = 'coach_james'): Promise<string> {
  return generateCoachingAudio({
    skill,
    voice,
    tone: 'motivational',
    feedback_type: 'positive',
    context: 'milestone',
    urgency: 'low'
  });
}

export async function generateEncouragementAudio(skill: string, voice: string = 'coach_mike'): Promise<string> {
  return generateCoachingAudio({
    skill,
    voice,
    tone: 'encouraging',
    feedback_type: 'motivation',
    context: 'encouragement',
    urgency: 'low'
  });
}

export async function generateDrillInstructionAudio(drillName: string, instruction: string, voice: string = 'coach_sarah'): Promise<string> {
  return generateCoachingAudio({
    text: `For ${drillName}: ${instruction}`,
    voice,
    tone: 'technical',
    feedback_type: 'improvement',
    context: 'drill_start',
    urgency: 'medium'
  });
}

// Batch audio generation for multiple feedback items
export async function generateBatchCoachingAudio(requests: CoachingAudioRequest[]): Promise<string[]> {
  const audioUrls: string[] = [];
  
  for (const request of requests) {
    try {
      const audioUrl = await generateCoachingAudio(request);
      audioUrls.push(audioUrl);
    } catch (error) {
      console.error('Error generating batch audio:', error);
      audioUrls.push(''); // Empty string for failed generations
    }
  }
  
  return audioUrls;
}

// Clean up temporary audio files
export function cleanupAudioFiles(filePaths: string[]): void {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up audio file:', error);
    }
  }
}

// Get available voices
export function getAvailableVoices(): any[] {
  return Object.entries(VOICE_CONFIGS).map(([id, config]) => ({
    id,
    name: config.name,
    tone: config.tone,
    gender: config.gender
  }));
}

// Get voice settings for a specific voice
export function getVoiceConfig(voiceId: string): any {
  return VOICE_CONFIGS[voiceId] || VOICE_CONFIGS.coach_mike;
} 