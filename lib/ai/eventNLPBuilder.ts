import { Platform } from 'react-native';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { smartVenueManager, SmartVenue } from '../maps/smartVenues';

export interface ParsedEvent {
  id: string;
  title: string;
  description: string;
  sportType: string;
  eventType: 'match' | 'training' | 'tournament' | 'pickup' | 'league';
  startTime: Date;
  endTime: Date;
  venueId?: string;
  venueName?: string;
  maxParticipants: number;
  minParticipants: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  cost: number;
  requirements: string[];
  equipment: string[];
  officials: {
    referees: number;
    scorekeepers: number;
    coaches: number;
  };
  logistics: EventLogistics;
  invites: EventInvite[];
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  language: string;
  confidence: number;
  aiGenerated: boolean;
}

export interface EventLogistics {
  setupTime: number; // minutes before start
  cleanupTime: number; // minutes after end
  parkingInfo: string;
  equipmentProvided: boolean;
  refreshments: boolean;
  medicalSupport: boolean;
  insurance: boolean;
  weatherDependent: boolean;
  backupPlan?: string;
}

export interface EventInvite {
  id: string;
  userId: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
  invitedAt: Date;
  respondedAt?: Date;
  message?: string;
}

export interface NLPParseResult {
  success: boolean;
  confidence: number;
  parsedEvent: Partial<ParsedEvent>;
  missingInfo: string[];
  suggestions: string[];
  errors: string[];
  language: string;
  aiEnhanced: boolean;
}

export interface NLPCommand {
  text: string;
  userId: string;
  timestamp: Date;
  language?: string;
  context?: {
    location?: { latitude: number; longitude: number };
    preferences?: any;
    recentEvents?: any[];
    userProfile?: any;
  };
}

export interface OpenAIResponse {
  sportType: string;
  eventType: string;
  startTime: string;
  endTime: string;
  venueName?: string;
  maxParticipants: number;
  minParticipants: number;
  skillLevel: string;
  cost: number;
  requirements: string[];
  equipment: string[];
  title: string;
  description: string;
  confidence: number;
}

export interface MultilingualSupport {
  supportedLanguages: string[];
  defaultLanguage: string;
  translationCache: Map<string, Map<string, string>>;
}

export class EventNLPBuilder {
  private static instance: EventNLPBuilder;
  private sportPatterns: Map<string, RegExp[]> = new Map();
  private timePatterns: RegExp[] = [];
  private venuePatterns: RegExp[] = [];
  private participantPatterns: RegExp[] = [];
  private costPatterns: RegExp[] = [];
  private multilingualSupport: MultilingualSupport;
  private openAIConfig: {
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };

  static getInstance(): EventNLPBuilder {
    if (!EventNLPBuilder.instance) {
      EventNLPBuilder.instance = new EventNLPBuilder();
    }
    return EventNLPBuilder.instance;
  }

  constructor() {
    this.initializePatterns();
    this.initializeMultilingualSupport();
    this.initializeOpenAI();
  }

  // Initialize method for testing compatibility
  async initialize(): Promise<void> {
    // The class is already initialized in constructor
    // This method exists for testing compatibility
    console.log('EventNLPBuilder initialized');
  }

  // Initialize multilingual support
  private initializeMultilingualSupport(): void {
    this.multilingualSupport = {
      supportedLanguages: ['en', 'es', 'fr', 'de', 'pt', 'it'],
      defaultLanguage: 'en',
      translationCache: new Map(),
    };
  }

  // Initialize OpenAI configuration
  private initializeOpenAI(): void {
    this.openAIConfig = {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.3,
    };
  }

  // Initialize NLP patterns with multilingual support
  private initializePatterns(): void {
    // Sport patterns with multilingual support
    this.sportPatterns.set('basketball', [
      /basketball|bball|hoops|5v5|3v3|pickup|baloncesto|basket/i,
      /basketball game|bball game|hoops game|partido de baloncesto/i,
    ]);
    
    this.sportPatterns.set('soccer', [
      /soccer|football|futbol|11v11|7v7|5v5|fútbol/i,
      /soccer game|football game|futbol game|partido de fútbol/i,
    ]);
    
    this.sportPatterns.set('tennis', [
      /tennis|singles|doubles|tenis/i,
      /tennis match|tennis game|partido de tenis/i,
    ]);
    
    this.sportPatterns.set('baseball', [
      /baseball|softball|9v9|béisbol/i,
      /baseball game|softball game|partido de béisbol/i,
    ]);
    
    this.sportPatterns.set('volleyball', [
      /volleyball|volley|6v6|voleibol/i,
      /volleyball game|volley game|partido de voleibol/i,
    ]);

    // Enhanced time patterns with multilingual support
    this.timePatterns = [
      // English patterns
      /(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)/i,
      /(\d{1,2})\s*(am|pm|AM|PM)/i,
      /(\d{1,2})\s*(o'clock|oclock)/i,
      /(\d{1,2})\s*(morning|afternoon|evening|night)/i,
      /today\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)/i,
      /tomorrow\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)/i,
      /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)/i,
      
      // Spanish patterns
      /(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)/i,
      /(\d{1,2})\s*(de la mañana|de la tarde|de la noche)/i,
      /hoy\s+a las\s+(\d{1,2}):?(\d{2})?/i,
      /mañana\s+a las\s+(\d{1,2}):?(\d{2})?/i,
      /el próximo\s+(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+a las\s+(\d{1,2}):?(\d{2})?/i,
      
      // French patterns
      /(\d{1,2})h(\d{2})?/i,
      /(\d{1,2})\s*(matin|après-midi|soir)/i,
      /aujourd'hui\s+à\s+(\d{1,2})h(\d{2})?/i,
      /demain\s+à\s+(\d{1,2})h(\d{2})?/i,
    ];

    // Enhanced venue patterns
    this.venuePatterns = [
      /at\s+([a-zA-Z\s]+(?:park|center|gym|field|court|stadium|parque|centro|gimnasio|campo|cancha|estadio))/i,
      /in\s+([a-zA-Z\s]+(?:park|center|gym|field|court|stadium|parque|centro|gimnasio|campo|cancha|estadio))/i,
      /([a-zA-Z\s]+(?:park|center|gym|field|court|stadium|parque|centro|gimnasio|campo|cancha|estadio))/i,
    ];

    // Enhanced participant patterns
    this.participantPatterns = [
      /(\d+)\s*(?:people|players|participants|personas|jugadores|participantes)/i,
      /(\d+)v(\d+)/i,
      /(\d+)\s*(?:vs|versus|contra)\s*(\d+)/i,
      /team\s+of\s+(\d+)/i,
      /equipo\s+de\s+(\d+)/i,
    ];

    // Enhanced cost patterns
    this.costPatterns = [
      /\$(\d+(?:\.\d{2})?)/i,
      /(\d+)\s*dollars/i,
      /(\d+)\s*bucks/i,
      /(\d+)\s*euros/i,
      /(\d+)\s*dólares/i,
      /free|no cost|no charge|gratis|libre/i,
    ];
  }

  // Parse natural language command into event with AI enhancement
  async parseCommand(command: NLPCommand): Promise<NLPParseResult> {
    try {
      console.log('Parsing command:', command.text, 'Language:', command.language);

      const result: NLPParseResult = {
        success: false,
        confidence: 0,
        parsedEvent: {},
        missingInfo: [],
        suggestions: [],
        errors: [],
        language: command.language || this.detectLanguage(command.text),
        aiEnhanced: false,
      };

      // Try AI-enhanced parsing first
      if (this.openAIConfig.apiKey) {
        const aiResult = await this.parseWithAI(command);
        if (aiResult && aiResult.confidence > 0.7) {
          result.parsedEvent = aiResult;
          result.confidence = aiResult.confidence;
          result.success = true;
          result.aiEnhanced = true;
          console.log('AI-enhanced parsing successful');
        }
      }

      // Fallback to rule-based parsing if AI fails or not available
      if (!result.success) {
        await this.parseWithRules(command, result);
      }

      // Validate and enhance the parsed event
      await this.validateAndEnhanceEvent(result, command);

      // Generate suggestions for missing information
      result.suggestions = this.generateSuggestions(result.missingInfo, result.parsedEvent);

      return result;
    } catch (error) {
      console.error('Failed to parse command:', error);
      return {
        success: false,
        confidence: 0,
        parsedEvent: {},
        missingInfo: ['parsing_error'],
        suggestions: ['Please try rephrasing your request'],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        language: command.language || 'en',
        aiEnhanced: false,
      };
    }
  }

  // Parse command using OpenAI GPT-4
  private async parseWithAI(command: NLPCommand): Promise<Partial<ParsedEvent> | null> {
    try {
      if (!this.openAIConfig.apiKey) return null;

      const prompt = this.buildAIPrompt(command);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: this.openAIConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that helps create sports events from natural language descriptions. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: this.openAIConfig.maxTokens,
          temperature: this.openAIConfig.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const parsedResponse: OpenAIResponse = JSON.parse(content);
      
      return this.convertAIResponseToEvent(parsedResponse, command);
    } catch (error) {
      console.error('AI parsing failed:', error);
      return null;
    }
  }

  // Build AI prompt for event parsing
  private buildAIPrompt(command: NLPCommand): string {
    const language = command.language || 'en';
    const context = command.context ? `\nContext: ${JSON.stringify(command.context)}` : '';
    
    return `Parse this sports event request and return JSON with the following structure:
{
  "sportType": "string",
  "eventType": "string (match|training|tournament|pickup|league)",
  "startTime": "ISO date string",
  "endTime": "ISO date string", 
  "venueName": "string (optional)",
  "maxParticipants": number,
  "minParticipants": number,
  "skillLevel": "string (beginner|intermediate|advanced|all)",
  "cost": number,
  "requirements": ["string array"],
  "equipment": ["string array"],
  "title": "string",
  "description": "string",
  "confidence": number (0-1)
}

Request: "${command.text}"${context}
Language: ${language}

Parse the request and return only the JSON object.`;
  }

  // Convert AI response to event object
  private convertAIResponseToEvent(aiResponse: OpenAIResponse, command: NLPCommand): Partial<ParsedEvent> {
    return {
      sportType: aiResponse.sportType,
      eventType: aiResponse.eventType as any,
      startTime: new Date(aiResponse.startTime),
      endTime: new Date(aiResponse.endTime),
      venueName: aiResponse.venueName,
      maxParticipants: aiResponse.maxParticipants,
      minParticipants: aiResponse.minParticipants,
      skillLevel: aiResponse.skillLevel as any,
      cost: aiResponse.cost,
      requirements: aiResponse.requirements,
      equipment: aiResponse.equipment,
      title: aiResponse.title,
      description: aiResponse.description,
      language: command.language || 'en',
      confidence: aiResponse.confidence,
      aiGenerated: true,
    };
  }

  // Rule-based parsing as fallback
  private async parseWithRules(command: NLPCommand, result: NLPParseResult): Promise<void> {
    // Parse sport type
    const sportType = this.parseSportType(command.text);
    if (sportType) {
      result.parsedEvent.sportType = sportType;
      result.confidence += 0.3;
    } else {
      result.missingInfo.push('sport type');
    }

    // Parse time
    const timeInfo = this.parseTime(command.text);
    if (timeInfo) {
      result.parsedEvent.startTime = timeInfo.startTime;
      result.parsedEvent.endTime = timeInfo.endTime;
      result.confidence += 0.3;
    } else {
      result.missingInfo.push('time');
    }

    // Parse venue
    const venueInfo = await this.parseVenue(command.text, command.context?.location);
    if (venueInfo) {
      result.parsedEvent.venueId = venueInfo.venueId;
      result.parsedEvent.venueName = venueInfo.venueName;
      result.confidence += 0.2;
    } else {
      result.missingInfo.push('venue');
    }

    // Parse participants
    const participantInfo = this.parseParticipants(command.text, result.parsedEvent.sportType);
    if (participantInfo) {
      result.parsedEvent.maxParticipants = participantInfo.maxParticipants;
      result.parsedEvent.minParticipants = participantInfo.minParticipants;
      result.confidence += 0.15;
    } else {
      result.missingInfo.push('participants');
    }

    // Parse cost
    const cost = this.parseCost(command.text);
    if (cost !== null) {
      result.parsedEvent.cost = cost;
      result.confidence += 0.05;
    }

    // Generate title and description
    const titleDesc = this.generateTitleAndDescription(command.text, result.parsedEvent);
    result.parsedEvent.title = titleDesc.title;
    result.parsedEvent.description = titleDesc.description;

    result.success = result.confidence > 0.5;
  }

  // Detect language from text
  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'las', 'una', 'como', 'más', 'pero', 'sus', 'me', 'hasta', 'hay', 'donde', 'han', 'quien', 'están', 'estado', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros'];
    const frenchWords = ['le', 'la', 'de', 'et', 'un', 'à', 'être', 'etre', 'avoir', 'ne', 'pas', 'je', 'il', 'ce', 'qui', 'que', 'pour', 'dans', 'sur', 'avec', 'plus', 'par', 'se', 'ne', 's', 'pas', 'son', 'sa', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'notre', 'votre', 'leur', 'leurs', 'du', 'des', 'au', 'aux', 'en', 'y', 'où', 'quand', 'comment', 'pourquoi', 'combien', 'quel', 'quelle', 'quels', 'quelles'];
    
    const words = text.toLowerCase().split(/\s+/);
    let spanishCount = 0;
    let frenchCount = 0;
    
    words.forEach(word => {
      if (spanishWords.includes(word)) spanishCount++;
      if (frenchWords.includes(word)) frenchCount++;
    });
    
    if (spanishCount > 2) return 'es';
    if (frenchCount > 2) return 'fr';
    return 'en'; // Default to English
  }

  // Enhanced venue parsing with availability validation
  private async parseVenue(text: string, userLocation?: { latitude: number; longitude: number }): Promise<{ venueId: string; venueName: string } | null> {
    try {
      // Extract venue name from text
      let venueName = '';
      for (const pattern of this.venuePatterns) {
        const match = text.match(pattern);
        if (match) {
          venueName = match[1] || match[0];
          break;
        }
      }

      if (!venueName) return null;

      // Search for venue in database
      const venuesQuery = query(
        collection(db, 'venues'),
        where('name', '>=', venueName.toLowerCase()),
        where('name', '<=', venueName.toLowerCase() + '\uf8ff'),
        limit(5)
      );

      const venuesSnapshot = await getDocs(venuesQuery);
      const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (venues.length === 0) {
        // Try fuzzy matching
        return this.findFuzzyVenueMatch(venueName, userLocation);
      }

      // Find best match
      let bestVenue = venues[0];
      let bestScore = 0;

      for (const venue of venues) {
        const score = this.calculateVenueMatchScore(venue, venueName, userLocation);
        if (score > bestScore) {
          bestScore = score;
          bestVenue = venue;
        }
      }

      if (bestScore > 0.5) {
        return {
          venueId: bestVenue.id,
          venueName: bestVenue.name,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to parse venue:', error);
      return null;
    }
  }

  // Find fuzzy venue match
  private async findFuzzyVenueMatch(venueName: string, userLocation?: { latitude: number; longitude: number }): Promise<{ venueId: string; venueName: string } | null> {
    try {
      // Get all venues and calculate similarity
      const venuesQuery = query(collection(db, 'venues'), limit(100));
      const venuesSnapshot = await getDocs(venuesQuery);
      const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let bestVenue = null;
      let bestScore = 0;

      for (const venue of venues) {
        const similarity = this.calculateStringSimilarity(venueName.toLowerCase(), venue.name.toLowerCase());
        const locationScore = userLocation ? this.calculateLocationScore(venue, userLocation) : 0.5;
        const totalScore = similarity * 0.7 + locationScore * 0.3;

        if (totalScore > bestScore && totalScore > 0.6) {
          bestScore = totalScore;
          bestVenue = venue;
        }
      }

      return bestVenue ? {
        venueId: bestVenue.id,
        venueName: bestVenue.name,
      } : null;
    } catch (error) {
      console.error('Failed to find fuzzy venue match:', error);
      return null;
    }
  }

  // Calculate string similarity using Levenshtein distance
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    const distance = matrix[str2.length][str1.length];
    return 1 - (distance / Math.max(str1.length, str2.length));
  }

  // Calculate location score for venue matching
  private calculateLocationScore(venue: any, userLocation: { latitude: number; longitude: number }): number {
    if (!venue.location) return 0.5;

    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      venue.location.latitude,
      venue.location.longitude
    );

    // Score based on distance (closer = higher score)
    return Math.max(0, 1 - (distance / 50)); // 50km max distance
  }

  // Calculate distance between two points
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Calculate venue match score
  private calculateVenueMatchScore(venue: any, venueName: string, userLocation?: { latitude: number; longitude: number }): number {
    let score = 0;

    // Name similarity
    const nameSimilarity = this.calculateStringSimilarity(venueName.toLowerCase(), venue.name.toLowerCase());
    score += nameSimilarity * 0.6;

    // Location proximity
    if (userLocation && venue.location) {
      const locationScore = this.calculateLocationScore(venue, userLocation);
      score += locationScore * 0.4;
    }

    return score;
  }

  // Validate and enhance parsed event
  private async validateAndEnhanceEvent(result: NLPParseResult, command: NLPCommand): Promise<void> {
    const event = result.parsedEvent;

    // Validate venue availability
    if (event.venueId && event.startTime) {
      const isAvailable = await this.checkVenueAvailability(event.venueId, event.startTime, event.endTime);
      if (!isAvailable) {
        result.errors.push('Venue is not available at the specified time');
        result.missingInfo.push('alternative venue');
      }
    }

    // Set default values
    if (!event.eventType) {
      event.eventType = this.determineEventType(event);
    }

    if (!event.equipment || event.equipment.length === 0) {
      event.equipment = this.determineEquipment(event.sportType);
    }

    if (!event.logistics) {
      event.logistics = this.generateLogistics(event);
    }

    // Enhance with AI-generated content if not already AI-enhanced
    if (!result.aiEnhanced && this.openAIConfig.apiKey) {
      await this.enhanceWithAI(event, command);
    }
  }

  // Check venue availability
  private async checkVenueAvailability(venueId: string, startTime: Date, endTime: Date): Promise<boolean> {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('venueId', '==', venueId),
        where('status', 'in', ['scheduled', 'active']),
        where('startTime', '<', endTime),
        where('endTime', '>', startTime)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      return eventsSnapshot.empty;
    } catch (error) {
      console.error('Failed to check venue availability:', error);
      return true; // Assume available if check fails
    }
  }

  // Enhance event with AI-generated content
  private async enhanceWithAI(event: Partial<ParsedEvent>, command: NLPCommand): Promise<void> {
    try {
      if (!this.openAIConfig.apiKey) return;

      const prompt = `Enhance this sports event with better title, description, and requirements:

Sport: ${event.sportType}
Type: ${event.eventType}
Time: ${event.startTime}
Venue: ${event.venueName}
Participants: ${event.minParticipants}-${event.maxParticipants}
Skill Level: ${event.skillLevel}

Original request: "${command.text}"

Return JSON with enhanced title, description, and requirements.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: this.openAIConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that enhances sports event descriptions. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        if (content) {
          const enhancement = JSON.parse(content);
          if (enhancement.title) event.title = enhancement.title;
          if (enhancement.description) event.description = enhancement.description;
          if (enhancement.requirements) event.requirements = enhancement.requirements;
        }
      }
    } catch (error) {
      console.error('Failed to enhance with AI:', error);
    }
  }

  // Parse sport type from text
  private parseSportType(text: string): string | null {
    for (const [sport, patterns] of this.sportPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return sport;
        }
      }
    }
    return null;
  }

  // Parse time from text
  private parseTime(text: string): { startTime: Date; endTime: Date } | null {
    for (const pattern of this.timePatterns) {
      const match = text.match(pattern);
      if (match) {
        const now = new Date();
        let targetDate = new Date(now);
        let hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const period = match[3]?.toLowerCase() || 'pm';

        // Handle AM/PM
        if (period === 'pm' && hour !== 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;

        // Handle day references
        if (text.toLowerCase().includes('tomorrow')) {
          targetDate.setDate(targetDate.getDate() + 1);
        } else if (text.toLowerCase().includes('next')) {
          const dayMatch = text.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
          if (dayMatch) {
            const dayName = dayMatch[1].toLowerCase();
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = days.indexOf(dayName);
            const currentDay = targetDate.getDay();
            const daysToAdd = (targetDay - currentDay + 7) % 7;
            targetDate.setDate(targetDate.getDate() + daysToAdd);
          }
        }

        targetDate.setHours(hour, minute, 0, 0);

        // Set end time (default 2 hours later)
        const endTime = new Date(targetDate);
        endTime.setHours(endTime.getHours() + 2);

        return { startTime: targetDate, endTime };
      }
    }
    return null;
  }

  // Parse participant count from text
  private parseParticipants(text: string, sportType?: string): { maxParticipants: number; minParticipants: number } | null {
    // Try participant patterns
    for (const pattern of this.participantPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          // Format like "5v5" or "5 vs 5"
          const count = parseInt(match[1]);
          return { maxParticipants: count * 2, minParticipants: count };
        } else {
          // Format like "10 people"
          const count = parseInt(match[1]);
          return { maxParticipants: count, minParticipants: Math.ceil(count * 0.8) };
        }
      }
    }

    // Default based on sport type
    const defaults: { [key: string]: { max: number; min: number } } = {
      basketball: { max: 10, min: 6 },
      soccer: { max: 22, min: 14 },
      tennis: { max: 4, min: 2 },
      baseball: { max: 18, min: 12 },
      volleyball: { max: 12, min: 8 },
    };

    if (sportType && defaults[sportType]) {
      return defaults[sportType];
    }

    return { maxParticipants: 10, minParticipants: 6 };
  }

  // Parse cost from text
  private parseCost(text: string): number | null {
    for (const pattern of this.costPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (text.toLowerCase().includes('free') || text.toLowerCase().includes('no cost')) {
          return 0;
        }
        return parseFloat(match[1]);
      }
    }
    return null;
  }

  // Generate title and description
  private generateTitleAndDescription(text: string, parsedEvent: Partial<ParsedEvent>): { title: string; description: string } {
    let title = '';
    let description = '';

    if (parsedEvent.sportType) {
      title = `${parsedEvent.sportType.charAt(0).toUpperCase() + parsedEvent.sportType.slice(1)} Event`;
      
      if (parsedEvent.startTime) {
        const timeStr = parsedEvent.startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const dayStr = parsedEvent.startTime.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
        title = `${parsedEvent.sportType.charAt(0).toUpperCase() + parsedEvent.sportType.slice(1)} - ${dayStr} at ${timeStr}`;
      }
    } else {
      title = 'New Sports Event';
    }

    description = `Join us for a ${parsedEvent.sportType || 'sports'} event!`;
    
    if (parsedEvent.maxParticipants) {
      description += ` Open to ${parsedEvent.maxParticipants} participants.`;
    }

    if (parsedEvent.venueName) {
      description += ` Location: ${parsedEvent.venueName}.`;
    }

    if (parsedEvent.cost !== undefined && parsedEvent.cost > 0) {
      description += ` Cost: $${parsedEvent.cost}.`;
    } else if (parsedEvent.cost === 0) {
      description += ` Free event.`;
    }

    if (parsedEvent.requirements && parsedEvent.requirements.length > 0) {
      description += ` Requirements: ${parsedEvent.requirements.join(', ')}.`;
    }

    return { title, description };
  }

  // Generate suggestions for missing information
  private generateSuggestions(missingInfo: string[], parsedEvent: Partial<ParsedEvent>): string[] {
    const suggestions: string[] = [];

    if (missingInfo.includes('sport type')) {
      suggestions.push('Please specify the sport (e.g., "basketball", "soccer", "tennis")');
    }

    if (missingInfo.includes('time')) {
      suggestions.push('Please specify the time (e.g., "Saturday at 4 PM", "tomorrow at 6:30 PM")');
    }

    if (missingInfo.includes('venue')) {
      suggestions.push('Please specify a venue or location');
    }

    if (missingInfo.includes('participant count')) {
      suggestions.push('Please specify number of participants (e.g., "10 people", "5v5")');
    }

    return suggestions;
  }

  // Create event from parsed data
  async createEvent(parsedEvent: Partial<ParsedEvent>): Promise<ParsedEvent | null> {
    try {
      // Validate required fields
      if (!parsedEvent.sportType || !parsedEvent.startTime || !parsedEvent.creatorId) {
        throw new Error('Missing required fields');
      }

      // Set defaults
      const event: ParsedEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: parsedEvent.title || 'New Event',
        description: parsedEvent.description || '',
        sportType: parsedEvent.sportType,
        eventType: this.determineEventType(parsedEvent),
        startTime: parsedEvent.startTime,
        endTime: parsedEvent.endTime || new Date(parsedEvent.startTime.getTime() + 2 * 60 * 60 * 1000),
        venueId: parsedEvent.venueId,
        venueName: parsedEvent.venueName,
        maxParticipants: parsedEvent.maxParticipants || 10,
        minParticipants: parsedEvent.minParticipants || 6,
        skillLevel: parsedEvent.skillLevel || 'all',
        cost: parsedEvent.cost || 0,
        requirements: parsedEvent.requirements || [],
        equipment: this.determineEquipment(parsedEvent.sportType),
        officials: {
          referees: parsedEvent.requirements?.includes('referees') ? 1 : 0,
          scorekeepers: 0,
          coaches: 0,
        },
        logistics: this.generateLogistics(parsedEvent),
        invites: [],
        status: 'draft',
        creatorId: parsedEvent.creatorId,
        createdAt: parsedEvent.createdAt || new Date(),
        updatedAt: new Date(),
        language: parsedEvent.language || 'en',
        confidence: parsedEvent.confidence || 0.5,
        aiGenerated: false,
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'events'), {
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      });

      event.id = docRef.id;

      return event;
    } catch (error) {
      console.error('Failed to create event:', error);
      return null;
    }
  }

  // Determine event type based on parsed data
  private determineEventType(parsedEvent: Partial<ParsedEvent>): ParsedEvent['eventType'] {
    const text = parsedEvent.title?.toLowerCase() || '';
    
    if (text.includes('tournament') || text.includes('league')) {
      return 'tournament';
    }
    
    if (text.includes('training') || text.includes('practice')) {
      return 'training';
    }
    
    if (text.includes('pickup') || text.includes('casual')) {
      return 'pickup';
    }
    
    return 'match';
  }

  // Determine equipment needed
  private determineEquipment(sportType?: string): string[] {
    const equipmentMap: { [key: string]: string[] } = {
      basketball: ['basketball', 'hoops'],
      soccer: ['soccer ball', 'goals'],
      tennis: ['tennis rackets', 'tennis balls', 'net'],
      baseball: ['baseball', 'bats', 'gloves', 'bases'],
      volleyball: ['volleyball', 'net'],
    };

    return equipmentMap[sportType || ''] || [];
  }

  // Generate logistics
  private generateLogistics(parsedEvent: Partial<ParsedEvent>): EventLogistics {
    return {
      setupTime: 15,
      cleanupTime: 15,
      parkingInfo: 'Free parking available',
      equipmentProvided: false,
      refreshments: false,
      medicalSupport: false,
      insurance: parsedEvent.requirements?.includes('insurance') || false,
      weatherDependent: ['soccer', 'baseball', 'tennis'].includes(parsedEvent.sportType || ''),
      backupPlan: 'Indoor facility available if weather is poor',
    };
  }

  // Send invites for an event
  async sendInvites(eventId: string, userIds: string[], message?: string): Promise<void> {
    try {
      const invites: EventInvite[] = userIds.map(userId => ({
        id: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        status: 'pending',
        invitedAt: new Date(),
        message,
      }));

      // Save invites to Firestore
      for (const invite of invites) {
        await addDoc(collection(db, 'event_invites'), {
          eventId,
          ...invite,
          invitedAt: invite.invitedAt.toISOString(),
        });
      }

      // Update event with invite count
      await updateDoc(doc(db, 'events', eventId), {
        inviteCount: invites.length,
        updatedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to send invites:', error);
    }
  }

  // Get event suggestions based on user preferences
  async getEventSuggestions(userId: string, preferences: any): Promise<ParsedEvent[]> {
    try {
      // This would analyze user preferences and suggest event templates
      const suggestions: ParsedEvent[] = [];

      // Example suggestions based on preferences
      if (preferences.sports?.includes('basketball')) {
        suggestions.push({
          id: 'suggestion-1',
          title: 'Weekend Basketball Pickup',
          description: 'Casual basketball game for all skill levels',
          sportType: 'basketball',
          eventType: 'pickup',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          maxParticipants: 10,
          minParticipants: 6,
          skillLevel: 'all',
          cost: 0,
          requirements: [],
          equipment: ['basketball'],
          officials: { referees: 0, scorekeepers: 0, coaches: 0 },
          logistics: {
            setupTime: 15,
            cleanupTime: 15,
            parkingInfo: 'Free parking',
            equipmentProvided: false,
            refreshments: false,
            medicalSupport: false,
            insurance: false,
            weatherDependent: false,
          },
          invites: [],
          status: 'draft',
          creatorId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          language: 'en',
          confidence: 0.5,
          aiGenerated: false,
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Failed to get event suggestions:', error);
      return [];
    }
  }

  // Cleanup
  cleanup(): void {
    this.sportPatterns.clear();
    this.timePatterns = [];
    this.venuePatterns = [];
    this.participantPatterns = [];
    this.costPatterns = [];
  }
}

// Export singleton instance
export const eventNLPBuilder = EventNLPBuilder.getInstance(); 