import { Badge } from '../components/BadgeSystem';
import { PlayerProfile } from '../types';
import { fetchWithAuth } from './api';

export interface BadgeUnlockCondition {
    type: 'xp' | 'drillCount' | 'skillLevel' | 'achievement';
    threshold: number;
    skillName?: string;
    achievementId?: string;
}

export interface BadgeDefinition extends Omit<Badge, 'earned' | 'earnedDate' | 'progress'> {
    unlockConditions: BadgeUnlockCondition[];
    sound?: string;
    animation?: string;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
    {
        id: 'beginner_warrior',
        name: 'Beginner Warrior',
        description: 'Reach level 5',
        icon: '/badges/beginner_warrior.svg',
        category: 'achievement',
        maxProgress: 5,
        unlockConditions: [{ type: 'xp', threshold: 500 }],
        sound: '/sounds/achievement_unlock.mp3',
        animation: 'bounce'
    },
    {
        id: 'drill_master',
        name: 'Drill Master',
        description: 'Complete 50 drills',
        icon: '/badges/drill_master.svg',
        category: 'achievement',
        maxProgress: 50,
        unlockConditions: [{ type: 'drillCount', threshold: 50 }]
    },
    // Add more badge definitions as needed
];

class BadgeService {
    private audioContext: AudioContext | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new AudioContext();
        }
    }

    async checkBadgeProgress(profile: PlayerProfile): Promise<Badge[]> {
        const badges = BADGE_DEFINITIONS.map(badgeDef => {
            const progress = this.calculateProgress(badgeDef, profile);
            const earned = progress >= badgeDef.maxProgress;
            
            return {
                ...badgeDef,
                progress,
                earned,
                earnedDate: earned ? new Date().toISOString() : undefined
            };
        });

        // Update badge status in backend
        await this.updateBadges(profile.id, badges);
        return badges;
    }

    private calculateProgress(badge: BadgeDefinition, profile: PlayerProfile): number {
        return badge.unlockConditions.reduce((progress, condition) => {
            switch (condition.type) {
                case 'xp':
                    return Math.min(profile.xp.current, condition.threshold);
                case 'drillCount':
                    return Math.min(profile.stats.completedDrills, condition.threshold);
                case 'skillLevel':
                    return condition.skillName && profile.skills?.[condition.skillName]?.level || 0;
                case 'achievement':
                    return profile.achievements?.includes(condition.achievementId || '') ? 1 : 0;
                default:
                    return 0;
            }
        }, 0);
    }

    async updateBadges(playerId: string, badges: Badge[]): Promise<void> {
        await fetchWithAuth(`/players/${playerId}/badges`, {
            method: 'PUT',
            body: JSON.stringify({ badges })
        });
    }

    async playUnlockSound(badge: Badge): Promise<void> {
        if (!badge.sound || !this.audioContext) return;

        try {
            const response = await fetch(badge.sound);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start(0);
        } catch (error) {
            console.error('Failed to play badge unlock sound:', error);
        }
    }
}

export const badgeService = new BadgeService(); 