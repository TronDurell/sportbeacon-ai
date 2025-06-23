import { PlayerProfile } from '../types';
import { badgeService } from './badgeService';

export interface LevelThreshold {
    level: number;
    xpRequired: number;
    rewards?: {
        badges?: string[];
        unlocks?: string[];
    };
}

const LEVEL_THRESHOLDS: LevelThreshold[] = [
    { level: 1, xpRequired: 0 },
    { level: 2, xpRequired: 100 },
    { level: 3, xpRequired: 300 },
    { level: 4, xpRequired: 600 },
    { level: 5, xpRequired: 1000, rewards: { badges: ['beginner_warrior'] } },
    { level: 6, xpRequired: 1500 },
    { level: 7, xpRequired: 2100 },
    { level: 8, xpRequired: 2800 },
    { level: 9, xpRequired: 3600 },
    { level: 10, xpRequired: 4500, rewards: { badges: ['intermediate_warrior'] } },
];

class LevelSystem {
    calculateLevel(xp: number): { 
        level: number; 
        currentLevelXp: number; 
        nextLevelXp: number;
        progress: number;
    } {
        let currentLevel = 1;
        for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
            if (xp >= LEVEL_THRESHOLDS[i].xpRequired) {
                currentLevel = LEVEL_THRESHOLDS[i].level;
            } else {
                break;
            }
        }

        const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
        const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || currentThreshold;
        
        const currentLevelXp = xp - currentThreshold.xpRequired;
        const nextLevelXp = nextThreshold.xpRequired - currentThreshold.xpRequired;
        const progress = (currentLevelXp / nextLevelXp) * 100;

        return {
            level: currentLevel,
            currentLevelXp,
            nextLevelXp,
            progress
        };
    }

    async checkLevelUp(profile: PlayerProfile): Promise<{
        leveledUp: boolean;
        newLevel?: number;
        rewards?: LevelThreshold['rewards'];
    }> {
        const oldLevel = profile.level;
        const { level } = this.calculateLevel(profile.xp.current);

        if (level > oldLevel) {
            const threshold = LEVEL_THRESHOLDS[level - 1];
            
            // If there are rewards, process them
            if (threshold.rewards) {
                if (threshold.rewards.badges) {
                    await badgeService.checkBadgeProgress(profile);
                }
                // Process other rewards here
            }

            return {
                leveledUp: true,
                newLevel: level,
                rewards: threshold.rewards
            };
        }

        return { leveledUp: false };
    }

    getNextLevelThreshold(currentLevel: number): number {
        const nextLevel = LEVEL_THRESHOLDS.find(t => t.level > currentLevel);
        return nextLevel?.xpRequired || Infinity;
    }

    calculateXpToNextLevel(currentXp: number, currentLevel: number): number {
        const nextThreshold = this.getNextLevelThreshold(currentLevel);
        return nextThreshold - currentXp;
    }
}

export const levelSystem = new LevelSystem(); 