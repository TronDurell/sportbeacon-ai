import { PlayerStats } from './types';

interface PlayerAnalysisInput {
    stats: PlayerStats;
    history: any[];
    position: string;
    age: number;
}

interface AISummary {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    roles: string[];
}

const analyzeStats = (stats: PlayerStats, position: string): string[] => {
    const strengths: string[] = [];
    
    // Analyze based on position and stats
    if (position.toLowerCase().includes('forward')) {
        if (stats.goalsScored > 10) strengths.push('Consistent goal scorer');
        if (stats.shotAccuracy > 65) strengths.push('Excellent shot accuracy');
        if (stats.assists > 5) strengths.push('Good playmaking ability');
    } else if (position.toLowerCase().includes('midfielder')) {
        if (stats.passAccuracy > 80) strengths.push('Strong passing accuracy');
        if (stats.distanceCovered > 200) strengths.push('High work rate and stamina');
        if (stats.assists > 7) strengths.push('Creative playmaker');
    } else if (position.toLowerCase().includes('defender')) {
        if (stats.tacklesWon > 40) strengths.push('Strong tackling ability');
        if (stats.passAccuracy > 75) strengths.push('Good distribution from the back');
        if (stats.yellowCards < 5) strengths.push('Disciplined defender');
    }

    return strengths;
};

const generateRoleRecommendations = (stats: PlayerStats, position: string): string[] => {
    const roles: string[] = [];
    
    // Suggest roles based on stats and position
    if (position.toLowerCase().includes('forward')) {
        if (stats.goalsScored > 10 && stats.assists < 5) {
            roles.push('Target Man');
        }
        if (stats.assists > 5 && stats.passAccuracy > 75) {
            roles.push('False Nine');
        }
        if (stats.shotAccuracy > 65) {
            roles.push('Clinical Finisher');
        }
    } else if (position.toLowerCase().includes('midfielder')) {
        if (stats.passAccuracy > 85) {
            roles.push('Deep-Lying Playmaker');
        }
        if (stats.distanceCovered > 220) {
            roles.push('Box-to-Box Midfielder');
        }
        if (stats.assists > 8) {
            roles.push('Advanced Playmaker');
        }
    }
    
    return roles;
};

const identifyImprovements = (stats: PlayerStats, position: string): string[] => {
    const improvements: string[] = [];
    
    // Identify areas for improvement
    if (position.toLowerCase().includes('forward')) {
        if (stats.shotAccuracy < 60) {
            improvements.push('Work on shooting accuracy');
        }
        if (stats.goalsScored < 8) {
            improvements.push('Focus on finishing drills');
        }
    } else if (position.toLowerCase().includes('midfielder')) {
        if (stats.passAccuracy < 80) {
            improvements.push('Improve passing accuracy');
        }
        if (stats.distanceCovered < 180) {
            improvements.push('Enhance stamina and work rate');
        }
    } else if (position.toLowerCase().includes('defender')) {
        if (stats.tacklesWon < 35) {
            improvements.push('Work on defensive positioning and tackling');
        }
        if (stats.yellowCards > 8) {
            improvements.push('Improve discipline and timing of challenges');
        }
    }
    
    return improvements;
};

const generateRecommendations = (improvements: string[]): string[] => {
    return improvements.map(improvement => {
        switch (improvement) {
            case 'Work on shooting accuracy':
                return 'Incorporate target practice and finishing drills in training sessions';
            case 'Focus on finishing drills':
                return 'Practice one-on-one situations and shooting under pressure';
            case 'Improve passing accuracy':
                return 'Regular passing drills focusing on both short and long-range distribution';
            case 'Enhance stamina and work rate':
                return 'Include high-intensity interval training in fitness routine';
            case 'Work on defensive positioning and tackling':
                return 'Practice defensive scenarios and timing of tackles';
            case 'Improve discipline and timing of challenges':
                return 'Focus on reading the game and anticipating player movements';
            default:
                return `Develop specific training routines for: ${improvement}`;
        }
    });
};

export const generateAISummary = async (input: PlayerAnalysisInput): Promise<AISummary> => {
    const strengths = analyzeStats(input.stats, input.position);
    const roles = generateRoleRecommendations(input.stats, input.position);
    const improvements = identifyImprovements(input.stats, input.position);
    const recommendations = generateRecommendations(improvements);

    return {
        strengths,
        improvements,
        recommendations,
        roles
    };
}; 