export interface NLPConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  enableSentimentAnalysis: boolean;
  enableEntityExtraction: boolean;
  enableKeywordExtraction: boolean;
  enableSummarization: boolean;
}

export interface TextAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1 to 1
  entities: Entity[];
  keywords: Keyword[];
  summary?: string;
  topics: string[];
  language: string;
  confidence: number;
}

export interface Entity {
  text: string;
  type: 'person' | 'location' | 'organization' | 'event' | 'sport' | 'skill';
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface Keyword {
  text: string;
  score: number; // 0-1
  frequency: number;
  importance: number; // 0-1
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  description: string;
}

export class NLPTransformer {
  private static instance: NLPTransformer;
  private openAIConfig: {
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  private templates: Map<string, PromptTemplate> = new Map();

  static getInstance(): NLPTransformer {
    if (!NLPTransformer.instance) {
      NLPTransformer.instance = new NLPTransformer();
    }
    return NLPTransformer.instance;
  }

  constructor() {
    this.openAIConfig = {
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    };
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Scout evaluation template
    this.templates.set('scout_evaluation', {
      id: 'scout_evaluation',
      name: 'Scout Evaluation Analysis',
      template: `Analyze the following sports performance data and provide a comprehensive evaluation:

Sport: {sportType}
Analysis Type: {analysisType}
Movement Data: {movementData}
Performance Metrics: {performanceMetrics}

Please provide:
1. Overall assessment
2. Key strengths
3. Areas for improvement
4. Specific recommendations
5. Technical feedback
6. Next steps for development

Format the response as a structured evaluation report.`,
      variables: ['sportType', 'analysisType', 'movementData', 'performanceMetrics'],
      description: 'Template for generating scout evaluation reports'
    });

    // Coach recommendation template
    this.templates.set('coach_recommendation', {
      id: 'coach_recommendation',
      name: 'Coach Recommendation',
      template: `Based on the athlete's profile and performance data, generate personalized recommendations:

Athlete Profile: {athleteProfile}
Recent Performance: {recentPerformance}
Goals: {goals}
Current Challenges: {challenges}

Provide recommendations for:
1. Training focus areas
2. Skill development
3. Recovery strategies
4. Competition preparation
5. Mental game improvement`,
      variables: ['athleteProfile', 'recentPerformance', 'goals', 'challenges'],
      description: 'Template for generating coach recommendations'
    });

    // Event analysis template
    this.templates.set('event_analysis', {
      id: 'event_analysis',
      name: 'Event Analysis',
      template: `Analyze the following sports event data:

Event Type: {eventType}
Participants: {participants}
Location: {location}
Duration: {duration}
Activities: {activities}

Generate insights about:
1. Event success factors
2. Participant engagement
3. Venue utilization
4. Improvement opportunities
5. Future recommendations`,
      variables: ['eventType', 'participants', 'location', 'duration', 'activities'],
      description: 'Template for analyzing sports events'
    });
  }

  async analyzeText(text: string, config: NLPConfig): Promise<TextAnalysis> {
    try {
      // Mock text analysis - in real implementation, use OpenAI or other NLP service
      const sentiment = this.analyzeSentiment(text);
      const entities = this.extractEntities(text);
      const keywords = this.extractKeywords(text);
      const topics = this.extractTopics(text);
      const summary = config.enableSummarization ? this.generateSummary(text) : undefined;

      return {
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.score,
        entities,
        keywords,
        summary,
        topics,
        language: 'en',
        confidence: 0.85
      };
    } catch (error) {
      console.error('NLPTransformer: Text analysis failed:', error);
      throw error;
    }
  }

  private analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral'; score: number } {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'outstanding', 'improved', 'better', 'strong', 'fast', 'skilled'];
    const negativeWords = ['bad', 'poor', 'weak', 'slow', 'needs', 'improvement', 'struggling', 'difficult', 'challenging'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = words.length;
    const positiveRatio = positiveCount / total;
    const negativeRatio = negativeCount / total;

    if (positiveRatio > negativeRatio && positiveRatio > 0.1) {
      return { sentiment: 'positive', score: positiveRatio };
    } else if (negativeRatio > positiveRatio && negativeRatio > 0.1) {
      return { sentiment: 'negative', score: -negativeRatio };
    } else {
      return { sentiment: 'neutral', score: 0 };
    }
  }

  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // Mock entity extraction - in real implementation, use NER model
    const entityPatterns = [
      { pattern: /\b(basketball|football|soccer|tennis|baseball|volleyball)\b/gi, type: 'sport' as const },
      { pattern: /\b(shooting|passing|dribbling|defense|speed|agility)\b/gi, type: 'skill' as const },
      { pattern: /\b(gym|field|court|stadium|arena)\b/gi, type: 'location' as const }
    ];

    entityPatterns.forEach(({ pattern, type }) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const startIndex = text.indexOf(match);
          entities.push({
            text: match,
            type,
            confidence: 0.8 + Math.random() * 0.2,
            startIndex,
            endIndex: startIndex + match.length
          });
        });
      }
    });

    return entities;
  }

  private extractKeywords(text: string): Keyword[] {
    const keywords: Keyword[] = [];
    
    // Mock keyword extraction - in real implementation, use TF-IDF or similar
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: Map<string, number> = new Map();

    words.forEach(word => {
      if (word.length > 3) { // Filter out short words
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // Get top keywords
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedWords.forEach(([word, freq]) => {
      keywords.push({
        text: word,
        score: freq / words.length,
        frequency: freq,
        importance: Math.min(1, freq / 5) // Normalize importance
      });
    });

    return keywords;
  }

  private extractTopics(text: string): string[] {
    // Mock topic extraction
    const topics = ['sports', 'training', 'performance', 'skills'];
    return topics.filter(() => Math.random() > 0.5); // Random selection for demo
  }

  private generateSummary(text: string): string {
    // Mock summarization - in real implementation, use extractive or abstractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summarySentences = sentences.slice(0, Math.min(3, sentences.length));
    return summarySentences.join('. ') + '.';
  }

  async generatePrompt(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let prompt = template.template;

    // Replace variables in template
    template.variables.forEach(variable => {
      const value = variables[variable];
      if (value !== undefined) {
        prompt = prompt.replace(new RegExp(`{${variable}}`, 'g'), String(value));
      }
    });

    return prompt;
  }

  async generateResponse(prompt: string, config: NLPConfig): Promise<string> {
    try {
      // Mock OpenAI response - in real implementation, call OpenAI API
      const responses = [
        "Based on the analysis, the athlete shows strong fundamentals with excellent footwork and coordination. Key areas for improvement include reaction time and decision-making under pressure.",
        "The performance data indicates consistent improvement in technical skills. Focus on building endurance and mental toughness for competitive play.",
        "Analysis reveals solid technique with room for growth in speed and agility. Recommended focus on plyometric training and game situation drills."
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      console.error('NLPTransformer: Response generation failed:', error);
      throw error;
    }
  }

  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  cleanup(): void {
    this.templates.clear();
  }
} 