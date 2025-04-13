import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PlayerData, DrillHistoryEntry, AIAnalysis, VideoClip } from './types';

interface PDFOptions {
    includeAIAnalysis?: boolean;
    includeVideoClips?: boolean;
    organizationLogo?: string;
    customHeader?: string;
}

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;

const addVideoClipsSection = (doc: jsPDF, clips: VideoClip[]) => {
    doc.setFontSize(14);
    doc.text('Highlighted Clips', MARGIN, doc.lastAutoTable.finalY + 20);

    const clipsData = clips.map(clip => [
        clip.description,
        new Date(clip.timestamp).toLocaleString(),
        clip.skillTags.join(', '),
        clip.url
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Description', 'Timestamp', 'Skills', 'URL']],
        body: clipsData,
        margin: { left: MARGIN },
        columnStyles: {
            3: { cellWidth: 50 } // URL column width
        }
    });
};

const addBadgesSection = (doc: jsPDF, badges: any[]) => {
    doc.setFontSize(14);
    doc.text('Achievements & Badges', MARGIN, doc.lastAutoTable.finalY + 20);

    const badgesData = badges.map(badge => [
        badge.name,
        badge.description,
        badge.dateEarned,
        `${badge.progress}%`
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Badge', 'Description', 'Date Earned', 'Progress']],
        body: badgesData,
        margin: { left: MARGIN }
    });
};

export const generatePDF = async (players: PlayerData[], options: PDFOptions = {}): Promise<Blob> => {
    const doc = new jsPDF();
    
    // Add header
    if (options.organizationLogo) {
        doc.addImage(options.organizationLogo, 'PNG', MARGIN, MARGIN, 40, 20);
    }
    
    if (options.customHeader) {
        doc.setFontSize(18);
        doc.text(options.customHeader, PAGE_WIDTH / 2, MARGIN + 10, { align: 'center' });
    }
    
    players.forEach((playerData, index) => {
        if (index > 0) {
            doc.addPage();
        }
        
        const { player, drillHistory, aiAnalysis, videoClips, badges } = playerData;
        
        // Player Info Section
        doc.setFontSize(16);
        doc.text(`Player Profile: ${player.name}`, MARGIN, MARGIN + 30);
        
        doc.setFontSize(12);
        const playerInfo = [
            ['Position', player.position],
            ['Age', player.age.toString()],
            ['Height', player.height],
            ['Weight', player.weight],
            ['Team', player.team],
            ['Level', player.level]
        ];
        
        doc.autoTable({
            startY: MARGIN + 40,
            head: [['Attribute', 'Value']],
            body: playerInfo,
            margin: { left: MARGIN }
        });
        
        // Stats Section with Trends
        const statsData = Object.entries(player.stats).map(([key, value]) => [
            key,
            value.toString(),
            `${player.percentiles[key]}%`,
            player.trends?.[key] || 'stable'
        ]);
        
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Stat', 'Value', 'Percentile', 'Trend']],
            body: statsData,
            margin: { left: MARGIN }
        });
        
        // Badges Section
        if (badges?.length > 0) {
            addBadgesSection(doc, badges);
        }

        // Video Clips Section
        if (options.includeVideoClips && videoClips?.length > 0) {
            addVideoClipsSection(doc, videoClips);
        }
        
        // Drill History Section
        if (drillHistory.length > 0) {
            doc.setFontSize(14);
            doc.text('Training History', MARGIN, doc.lastAutoTable.finalY + 20);
            
            const drillData = drillHistory.map((drill: DrillHistoryEntry) => [
                drill.name,
                drill.date,
                drill.score.toString(),
                drill.notes
            ]);
            
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 30,
                head: [['Drill', 'Date', 'Score', 'Notes']],
                body: drillData,
                margin: { left: MARGIN }
            });
        }
        
        // Enhanced AI Analysis Section
        if (options.includeAIAnalysis && aiAnalysis) {
            doc.setFontSize(14);
            doc.text('Player Analysis & Development', MARGIN, doc.lastAutoTable.finalY + 20);
            
            // Key Strengths
            doc.setFontSize(12);
            doc.text('Key Strengths:', MARGIN, doc.lastAutoTable.finalY + 30);
            aiAnalysis.strengths.forEach((strength: string, idx: number) => {
                doc.text(`• ${strength}`, MARGIN + 5, doc.lastAutoTable.finalY + 40 + (idx * 7));
            });
            
            // Roles & Playing Style
            const rolesY = doc.lastAutoTable.finalY + 50 + (aiAnalysis.strengths.length * 7);
            doc.text('Optimal Roles & Playing Style:', MARGIN, rolesY);
            aiAnalysis.roles?.forEach((role: string, idx: number) => {
                doc.text(`• ${role}`, MARGIN + 5, rolesY + 10 + (idx * 7));
            });
            
            // Development Goals
            const goalsY = rolesY + 20 + ((aiAnalysis.roles?.length || 0) * 7);
            doc.text('Development Focus Areas:', MARGIN, goalsY);
            aiAnalysis.improvements.forEach((improvement: string, idx: number) => {
                doc.text(`• ${improvement}`, MARGIN + 5, goalsY + 10 + (idx * 7));
            });
            
            // Specific Recommendations
            const recommendationsY = goalsY + 20 + (aiAnalysis.improvements.length * 7);
            doc.text('Action Plan & Recommendations:', MARGIN, recommendationsY);
            aiAnalysis.recommendations.forEach((recommendation: string, idx: number) => {
                doc.text(`• ${recommendation}`, MARGIN + 5, recommendationsY + 10 + (idx * 7));
            });
        }
    });
    
    return doc.output('blob');
}; 