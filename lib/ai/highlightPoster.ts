import { firestore } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { analytics } from './shared/analytics';

export interface RangeSession {
  id: string;
  uid: string;
  drillType: string;
  avgScore: number;
  totalShots: number;
  scores: number[];
  sessionDuration: number;
  date: Date;
  shotDetails?: ShotDetail[];
  feedback: string[];
  usedHardware: boolean;
}

export interface ShotDetail {
  score: number;
  modelConfidence: number;
  muzzleDrift: number;
  userCorrected: boolean;
  timestamp: Date;
}

export interface Highlight {
  id: string;
  uid: string;
  sessionId: string;
  imageUrl: string;
  title: string;
  description: string;
  aiComment: string;
  stats: {
    bestScore: number;
    accuracyStreak: number;
    improvementTrend: number;
    totalShots: number;
    sessionDuration: number;
  };
  tags: string[];
  createdAt: Date;
  shared: boolean;
}

export interface HighlightTemplate {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  layout: 'minimal' | 'detailed' | 'achievement' | 'progress';
  elements: string[];
}

export class HighlightPoster {
  private static instance: HighlightPoster;

  static getInstance(): HighlightPoster {
    if (!HighlightPoster.instance) {
      HighlightPoster.instance = new HighlightPoster();
    }
    return HighlightPoster.instance;
  }

  /**
   * Generate highlight after range session
   */
  async generateHighlight(sessionId: string): Promise<Highlight> {
    try {
      // Get session data
      const session = await this.getSessionData(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Calculate highlight stats
      const stats = this.calculateHighlightStats(session);
      
      // Generate AI comment
      const aiComment = this.generateAIComment(session, stats);
      
      // Generate highlight title and description
      const title = this.generateTitle(session, stats);
      const description = this.generateDescription(session, stats);
      
      // Generate image
      const imageUrl = await this.generateHighlightImage(session, stats, aiComment);
      
      // Create highlight object
      const highlight: Omit<Highlight, 'id'> = {
        uid: session.uid,
        sessionId: session.id,
        imageUrl,
        title,
        description,
        aiComment,
        stats,
        tags: this.generateTags(session, stats),
        createdAt: new Date(),
        shared: false
      };

      // Save to Firestore
      const highlightId = await this.saveHighlight(highlight);
      
      // Track analytics
      await analytics.track('highlight_generated', {
        userId: session.uid,
        sessionId: session.id,
        drillType: session.drillType,
        avgScore: session.avgScore,
        bestScore: stats.bestScore,
        timestamp: new Date().toISOString()
      });

      return { ...highlight, id: highlightId };

    } catch (error) {
      console.error('Failed to generate highlight:', error);
      throw error;
    }
  }

  /**
   * Get session data from Firestore
   */
  private async getSessionData(sessionId: string): Promise<RangeSession | null> {
    try {
      const sessionRef = doc(firestore, 'range_sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        return {
          id: sessionDoc.id,
          uid: data.uid,
          drillType: data.drillType,
          avgScore: data.avgScore || 0,
          totalShots: data.totalShots || 0,
          scores: data.scores || [],
          sessionDuration: data.sessionDuration || 0,
          shotDetails: data.shotDetails || [],
          feedback: data.feedback || [],
          usedHardware: data.usedHardware || false,
          date: data.date.toDate()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get session data:', error);
      return null;
    }
  }

  /**
   * Calculate highlight statistics
   */
  private calculateHighlightStats(session: RangeSession) {
    const scores = session.scores;
    const bestScore = Math.max(...scores);
    
    // Calculate accuracy streak (consecutive scores above 85)
    let accuracyStreak = 0;
    let currentStreak = 0;
    for (const score of scores) {
      if (score >= 85) {
        currentStreak++;
        accuracyStreak = Math.max(accuracyStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Calculate improvement trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    const improvementTrend = secondHalfAvg - firstHalfAvg;

    return {
      bestScore,
      accuracyStreak,
      improvementTrend: Math.round(improvementTrend * 100) / 100,
      totalShots: session.totalShots,
      sessionDuration: session.sessionDuration
    };
  }

  /**
   * Generate AI comment based on performance
   */
  private generateAIComment(session: RangeSession, stats: any): string {
    const comments = {
      excellent: [
        "🔥 Best drill of the week!",
        "🎯 Absolutely crushing it today!",
        "💪 Elite level performance!",
        "⭐ Shooting like a pro!",
        "🏆 Championship material!"
      ],
      great: [
        "👍 Solid performance!",
        "🎯 Great consistency!",
        "💪 Strong showing!",
        "⭐ Nice work!",
        "🔥 Hot streak continues!"
      ],
      good: [
        "👏 Good progress!",
        "📈 Building momentum!",
        "🎯 Steady improvement!",
        "💪 Keep it up!",
        "⭐ Getting better!"
      ],
      improving: [
        "📈 Showing improvement!",
        "🎯 Building consistency!",
        "💪 Progress made!",
        "⭐ On the right track!",
        "🔥 Potential unlocked!"
      ]
    };

    let category = 'good';
    
    if (stats.bestScore >= 95 && stats.accuracyStreak >= 3) {
      category = 'excellent';
    } else if (stats.bestScore >= 90 && stats.accuracyStreak >= 2) {
      category = 'great';
    } else if (stats.improvementTrend > 2) {
      category = 'improving';
    }

    const categoryComments = comments[category];
    const randomComment = categoryComments[Math.floor(Math.random() * categoryComments.length)];
    
    return randomComment;
  }

  /**
   * Generate highlight title
   */
  private generateTitle(session: RangeSession, stats: any): string {
    const drillNames: { [key: string]: string } = {
      'draw': 'Draw & Fire 1',
      'pair': 'Controlled Pair',
      'circle': '5x5 Precision',
      'reload': 'Reload & Re-engage',
      'precision': 'Precision Drill',
      'speed': 'Speed Drill',
      'custom': 'Custom Drill'
    };

    const drillName = drillNames[session.drillType] || session.drillType;
    
    if (stats.bestScore >= 95) {
      return `Perfect ${drillName} Session`;
    } else if (stats.bestScore >= 90) {
      return `Outstanding ${drillName} Performance`;
    } else if (stats.improvementTrend > 3) {
      return `Improving ${drillName} Skills`;
    } else {
      return `${drillName} Training Session`;
    }
  }

  /**
   * Generate highlight description
   */
  private generateDescription(session: RangeSession, stats: any): string {
    const durationMinutes = Math.round(session.sessionDuration / 60000);
    
    let description = `Completed ${session.totalShots} shots in ${durationMinutes} minutes`;
    
    if (stats.bestScore >= 95) {
      description += ` with a perfect score of ${stats.bestScore}!`;
    } else if (stats.bestScore >= 90) {
      description += ` with an excellent best score of ${stats.bestScore}.`;
    } else if (stats.improvementTrend > 0) {
      description += ` showing ${stats.improvementTrend} point improvement.`;
    } else {
      description += ` with consistent performance.`;
    }

    if (stats.accuracyStreak >= 3) {
      description += ` Maintained ${stats.accuracyStreak}-shot accuracy streak!`;
    }

    return description;
  }

  /**
   * Generate highlight tags
   */
  private generateTags(session: RangeSession, stats: any): string[] {
    const tags = [session.drillType, 'training', 'sportbeacon'];
    
    if (stats.bestScore >= 95) tags.push('perfect', 'elite');
    else if (stats.bestScore >= 90) tags.push('excellent', 'great');
    else if (stats.improvementTrend > 0) tags.push('improving', 'progress');
    
    if (stats.accuracyStreak >= 3) tags.push('consistent', 'streak');
    if (session.usedHardware) tags.push('hardware', 'enhanced');
    
    return tags;
  }

  /**
   * Generate highlight image (placeholder - would use actual image generation)
   */
  private async generateHighlightImage(session: RangeSession, stats: any, aiComment: string): Promise<string> {
    try {
      // This would use a service like Canvas API, HTML2Canvas, or a custom image generator
      // For now, return a placeholder URL
      
      const imageData = {
        session,
        stats,
        aiComment,
        template: this.selectTemplate(stats),
        timestamp: new Date().toISOString()
      };

      // In a real implementation, this would:
      // 1. Create an HTML canvas with the highlight design
      // 2. Render the session data and AI comment
      // 3. Convert to image and upload to storage
      // 4. Return the image URL

      const imageUrl = `https://sportbeacon-ai.com/highlights/${session.id}.png`;
      
      // Simulate image generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return imageUrl;
    } catch (error) {
      console.error('Failed to generate highlight image:', error);
      return 'https://sportbeacon-ai.com/highlights/default.png';
    }
  }

  /**
   * Select highlight template based on performance
   */
  private selectTemplate(stats: any): string {
    if (stats.bestScore >= 95) return 'achievement';
    if (stats.bestScore >= 90) return 'detailed';
    if (stats.improvementTrend > 2) return 'progress';
    return 'minimal';
  }

  /**
   * Save highlight to Firestore
   */
  private async saveHighlight(highlight: Omit<Highlight, 'id'>): Promise<string> {
    try {
      const highlightsRef = collection(firestore, 'users', highlight.uid, 'highlights');
      const docRef = await addDoc(highlightsRef, highlight);
      return docRef.id;
    } catch (error) {
      console.error('Failed to save highlight:', error);
      throw error;
    }
  }

  /**
   * Share highlight to timeline
   */
  async shareHighlight(highlightId: string, uid: string): Promise<boolean> {
    try {
      // Get highlight data
      const highlightRef = doc(firestore, 'users', uid, 'highlights', highlightId);
      const highlightDoc = await getDoc(highlightRef);
      
      if (!highlightDoc.exists()) {
        throw new Error('Highlight not found');
      }

      const highlight = highlightDoc.data() as Highlight;

      // Create timeline post
      const postData = {
        uid,
        type: 'highlight',
        content: `${highlight.title}\n\n${highlight.description}\n\n${highlight.aiComment}`,
        media: [highlight.imageUrl],
        metadata: {
          highlightId: highlight.id,
          sessionId: highlight.sessionId,
          drillType: highlight.drillType,
          bestScore: highlight.stats.bestScore,
          tags: highlight.tags
        },
        createdAt: new Date(),
        likes: 0,
        comments: 0
      };

      const postsRef = collection(firestore, 'posts');
      await addDoc(postsRef, postData);

      // Update highlight as shared
      await setDoc(highlightRef, { shared: true }, { merge: true });

      // Track analytics
      await analytics.track('highlight_shared', {
        userId: uid,
        highlightId: highlight.id,
        sessionId: highlight.sessionId,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to share highlight:', error);
      return false;
    }
  }

  /**
   * Get user's highlights
   */
  async getUserHighlights(uid: string, limit: number = 20): Promise<Highlight[]> {
    try {
      const highlightsRef = collection(firestore, 'users', uid, 'highlights');
      const q = query(highlightsRef, orderBy('createdAt', 'desc'), limit(limit));
      const querySnapshot = await getDocs(q);
      
      const highlights: Highlight[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        highlights.push({
          id: doc.id,
          uid: data.uid,
          sessionId: data.sessionId,
          imageUrl: data.imageUrl,
          title: data.title,
          description: data.description,
          aiComment: data.aiComment,
          stats: data.stats,
          tags: data.tags,
          createdAt: data.createdAt.toDate(),
          shared: data.shared || false
        });
      });

      return highlights;
    } catch (error) {
      console.error('Failed to get user highlights:', error);
      return [];
    }
  }

  /**
   * Delete highlight
   */
  async deleteHighlight(highlightId: string, uid: string): Promise<boolean> {
    try {
      const highlightRef = doc(firestore, 'users', uid, 'highlights', highlightId);
      await deleteDoc(highlightRef);

      // Track analytics
      await analytics.track('highlight_deleted', {
        userId: uid,
        highlightId,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to delete highlight:', error);
      return false;
    }
  }

  /**
   * Get highlight templates
   */
  getHighlightTemplates(): HighlightTemplate[] {
    return [
      {
        id: 'minimal',
        name: 'Minimal',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        accentColor: '#10b981',
        layout: 'minimal',
        elements: ['title', 'score', 'aiComment']
      },
      {
        id: 'detailed',
        name: 'Detailed',
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        accentColor: '#3b82f6',
        layout: 'detailed',
        elements: ['title', 'stats', 'aiComment', 'tags']
      },
      {
        id: 'achievement',
        name: 'Achievement',
        backgroundColor: '#7c3aed',
        textColor: '#ffffff',
        accentColor: '#fbbf24',
        layout: 'achievement',
        elements: ['title', 'achievement', 'aiComment', 'stats']
      },
      {
        id: 'progress',
        name: 'Progress',
        backgroundColor: '#059669',
        textColor: '#ffffff',
        accentColor: '#10b981',
        layout: 'progress',
        elements: ['title', 'improvement', 'aiComment', 'trend']
      }
    ];
  }
}

// Export singleton instance
export const highlightPoster = HighlightPoster.getInstance(); 