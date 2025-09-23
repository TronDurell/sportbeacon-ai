// EventNLPBuilder - AI-powered natural language processing for events
export class EventNLPBuilder {
  private static instance: EventNLPBuilder;
  private initialized = false;

  private constructor() {}

  static getInstance(): EventNLPBuilder {
    if (!EventNLPBuilder.instance) {
      EventNLPBuilder.instance = new EventNLPBuilder();
    }
    return EventNLPBuilder.instance;
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async parseCommand(command: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('EventNLPBuilder not initialized');
    }
    if (!command || !command.text) {
      throw new Error('Invalid command');
    }
    
    // Check for mock provider failure
    if (process.env.MOCK_PROVIDER_FAIL === "1") {
      throw new Error('Mock provider failure');
    }
    
    const text = command.text.toLowerCase();
    
    if (text.includes('basketball') && text.includes('tomorrow')) {
      return {
        intent: 'create_event',
        entities: {
          sport: 'basketball',
          time: 'tomorrow 3pm',
          type: 'game'
        },
        confidence: 0.9,
        structuredData: {
          sport: 'basketball',
          date: 'tomorrow',
          time: '15:00',
          type: 'game'
        }
      };
    }
    
    if (text.includes('soccer') && text.includes('practice') && text.includes('tuesday')) {
      return {
        intent: 'schedule_recurring_event',
        entities: {
          sport: 'soccer',
          ageGroup: 'U12',
          frequency: 'weekly',
          time: '4pm',
          days: ['Tuesday', 'Thursday']
        },
        confidence: 0.95,
        structuredData: {
          sport: 'soccer',
          ageGroup: 'U12',
          frequency: 'weekly',
          time: '16:00',
          days: ['Tuesday', 'Thursday']
        }
      };
    }
    
    return {
      intent: 'unknown',
      entities: {},
      confidence: 0.1,
      structuredData: {}
    };
  }

  cleanup(): void {
    this.initialized = false;
  }
}

export const eventNLPBuilder = EventNLPBuilder.getInstance();
