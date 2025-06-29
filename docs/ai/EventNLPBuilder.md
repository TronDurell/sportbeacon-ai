# EventNLPBuilder AI Module

## Overview

The EventNLPBuilder is an AI-powered natural language processing system that converts user commands into complete event objects. It understands natural language inputs like "Plan 5v5 Saturday at 4 PM with refs" and generates fully configured events with invites, logistics, and venue assignments.

## Features

- **Natural Language Parsing**: Understands conversational event creation commands
- **Smart Venue Matching**: Automatically finds and suggests appropriate venues
- **Time Intelligence**: Parses various time formats and calculates event duration
- **Participant Management**: Determines optimal participant counts and skill levels
- **Cost Analysis**: Extracts and suggests pricing information
- **Requirement Detection**: Identifies equipment, officials, and special needs
- **Automated Invites**: Generates and sends event invitations
- **Logistics Planning**: Creates comprehensive event logistics

## Architecture

```
EventNLPBuilder
├── Natural Language Processing
│   ├── Sport Type Recognition
│   ├── Time Parsing Engine
│   ├── Venue Matching
│   ├── Participant Analysis
│   ├── Cost Extraction
│   └── Requirement Detection
├── Event Generation
│   ├── Event Object Creation
│   ├── Venue Assignment
│   ├── Logistics Planning
│   ├── Invite Generation
│   └── Validation System
├── Integration Layer
│   ├── Firestore Event Storage
│   ├── Venue Management System
│   ├── Notification System
│   └── Calendar Integration
└── Learning System
    ├── Command Pattern Recognition
    ├── Success Rate Analysis
    └── Continuous Improvement
```

## Quick Start

```typescript
import { eventNLPBuilder } from '../lib/ai/eventNLPBuilder';

// Initialize the NLP builder
await eventNLPBuilder.initialize();

// Parse a natural language command
const command: NLPCommand = {
  text: "Plan 5v5 basketball Saturday at 4 PM at Cary Community Center",
  userId: "user-123",
  timestamp: new Date(),
  context: {
    location: { latitude: 35.7915, longitude: -78.7811 },
  },
};

const result = await eventNLPBuilder.parseCommand(command);
console.log('Success:', result.success);
console.log('Confidence:', result.confidence);
console.log('Parsed Event:', result.parsedEvent);

// Create the event
if (result.success) {
  const event = await eventNLPBuilder.createEvent(result.parsedEvent);
  console.log('Event created:', event.id);
}
```

## API Reference

### Core Methods

#### `parseCommand(command: NLPCommand): Promise<NLPParseResult>`
Parses a natural language command and returns structured event data.

```typescript
const result = await eventNLPBuilder.parseCommand({
  text: "Organize soccer tournament next Saturday 2 PM",
  userId: "user-123",
  timestamp: new Date(),
});
```

#### `createEvent(parsedEvent: Partial<ParsedEvent>): Promise<ParsedEvent | null>`
Creates a complete event from parsed data.

```typescript
const event = await eventNLPBuilder.createEvent({
  sportType: "basketball",
  startTime: new Date(),
  maxParticipants: 10,
  creatorId: "user-123",
});
```

#### `sendInvites(eventId: string, userIds: string[], message?: string): Promise<void>`
Sends invitations for an event to specified users.

```typescript
await eventNLPBuilder.sendInvites(
  "event-123",
  ["user-1", "user-2", "user-3"],
  "Join us for a great game!"
);
```

#### `getEventSuggestions(userId: string, preferences: any): Promise<ParsedEvent[]>`
Returns event suggestions based on user preferences.

```typescript
const suggestions = await eventNLPBuilder.getEventSuggestions("user-123", {
  sports: ["basketball", "soccer"],
  skillLevel: "intermediate",
});
```

### Data Structures

#### NLPCommand
```typescript
interface NLPCommand {
  text: string;
  userId: string;
  timestamp: Date;
  context?: {
    location?: { latitude: number; longitude: number };
    preferences?: any;
    recentEvents?: any[];
  };
}
```

#### NLPParseResult
```typescript
interface NLPParseResult {
  success: boolean;
  confidence: number;
  parsedEvent: Partial<ParsedEvent>;
  missingInfo: string[];
  suggestions: string[];
  errors: string[];
}
```

#### ParsedEvent
```typescript
interface ParsedEvent {
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
}
```

#### EventLogistics
```typescript
interface EventLogistics {
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
```

#### EventInvite
```typescript
interface EventInvite {
  id: string;
  userId: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
  invitedAt: Date;
  respondedAt?: Date;
  message?: string;
}
```

## Usage Examples

### 1. Voice-Enabled Event Creation

```typescript
import React, { useState } from 'react';
import { eventNLPBuilder } from '../lib/ai/eventNLPBuilder';

const VoiceEventCreator: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [command, setCommand] = useState('');
  const [result, setResult] = useState<NLPParseResult | null>(null);

  const handleVoiceInput = async (transcript: string) => {
    setCommand(transcript);
    
    const parseResult = await eventNLPBuilder.parseCommand({
      text: transcript,
      userId: 'current-user',
      timestamp: new Date(),
    });
    
    setResult(parseResult);
  };

  const createEvent = async () => {
    if (result?.success && result.parsedEvent) {
      const event = await eventNLPBuilder.createEvent(result.parsedEvent);
      if (event) {
        console.log('Event created successfully:', event.id);
      }
    }
  };

  return (
    <div>
      <h2>Create Event with Voice</h2>
      
      <button onClick={() => setIsListening(!isListening)}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      
      {command && (
        <div>
          <h3>Command: "{command}"</h3>
          {result && (
            <div>
              <p>Success: {result.success ? 'Yes' : 'No'}</p>
              <p>Confidence: {Math.round(result.confidence * 100)}%</p>
              
              {result.missingInfo.length > 0 && (
                <div>
                  <h4>Missing Information:</h4>
                  <ul>
                    {result.missingInfo.map(info => (
                      <li key={info}>{info}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.suggestions.length > 0 && (
                <div>
                  <h4>Suggestions:</h4>
                  <ul>
                    {result.suggestions.map(suggestion => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.success && (
                <button onClick={createEvent}>Create Event</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 2. Smart Event Form

```typescript
import React, { useState, useEffect } from 'react';
import { eventNLPBuilder } from '../lib/ai/eventNLPBuilder';

const SmartEventForm: React.FC = () => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [parsedEvent, setParsedEvent] = useState<Partial<ParsedEvent> | null>(null);

  const handleInputChange = async (value: string) => {
    setInput(value);
    
    if (value.length > 10) {
      const result = await eventNLPBuilder.parseCommand({
        text: value,
        userId: 'current-user',
        timestamp: new Date(),
      });
      
      if (result.success) {
        setParsedEvent(result.parsedEvent);
        setSuggestions(result.suggestions);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(prev => prev + ' ' + suggestion);
  };

  return (
    <div>
      <h2>Smart Event Creation</h2>
      
      <div className="input-section">
        <label>Describe your event:</label>
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="e.g., 'Plan 5v5 basketball Saturday at 4 PM with refs'"
          rows={3}
        />
      </div>
      
      {suggestions.length > 0 && (
        <div className="suggestions">
          <h4>Suggestions:</h4>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-btn"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {parsedEvent && (
        <div className="parsed-event">
          <h3>Event Preview</h3>
          <div className="event-details">
            <p><strong>Sport:</strong> {parsedEvent.sportType}</p>
            <p><strong>Time:</strong> {parsedEvent.startTime?.toLocaleString()}</p>
            <p><strong>Participants:</strong> {parsedEvent.maxParticipants}</p>
            <p><strong>Venue:</strong> {parsedEvent.venueName || 'TBD'}</p>
            <p><strong>Cost:</strong> ${parsedEvent.cost || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 3. Automated Event Scheduler

```typescript
import { eventNLPBuilder } from '../lib/ai/eventNLPBuilder';

class AutomatedEventScheduler {
  async scheduleRecurringEvents(userId: string, schedule: string) {
    // Parse recurring schedule command
    const command: NLPCommand = {
      text: schedule,
      userId,
      timestamp: new Date(),
    };
    
    const result = await eventNLPBuilder.parseCommand(command);
    
    if (result.success && result.parsedEvent) {
      // Create recurring event series
      await this.createRecurringSeries(result.parsedEvent, userId);
    }
  }

  private async createRecurringSeries(eventTemplate: Partial<ParsedEvent>, userId: string) {
    const series = [];
    const startDate = eventTemplate.startTime;
    
    // Create events for the next 4 weeks
    for (let i = 0; i < 4; i++) {
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + (i * 7));
      
      const event = await eventNLPBuilder.createEvent({
        ...eventTemplate,
        startTime: eventDate,
        title: `${eventTemplate.title} - Week ${i + 1}`,
      });
      
      if (event) {
        series.push(event);
      }
    }
    
    return series;
  }

  async autoInviteFriends(userId: string, eventId: string) {
    // Get user's friends who play the same sport
    const friends = await this.getFriendsBySport(userId, eventId);
    
    // Send automated invites
    await eventNLPBuilder.sendInvites(
      eventId,
      friends.map(f => f.id),
      "Hey! I'm hosting a game and thought you'd be interested. Join us!"
    );
  }

  private async getFriendsBySport(userId: string, eventId: string) {
    // Implementation to get friends who play the same sport
    return [
      { id: 'friend-1', name: 'John', sport: 'basketball' },
      { id: 'friend-2', name: 'Sarah', sport: 'basketball' },
    ];
  }
}
```

### 4. Event Optimization System

```typescript
import { eventNLPBuilder } from '../lib/ai/eventNLPBuilder';

class EventOptimizer {
  async optimizeEvent(command: string, userId: string) {
    // Parse initial command
    const result = await eventNLPBuilder.parseCommand({
      text: command,
      userId,
      timestamp: new Date(),
    });
    
    if (!result.success) {
      return this.suggestImprovements(result);
    }
    
    // Optimize the event
    const optimizedEvent = await this.optimizeEventDetails(result.parsedEvent);
    
    return {
      original: result.parsedEvent,
      optimized: optimizedEvent,
      improvements: this.calculateImprovements(result.parsedEvent, optimizedEvent),
    };
  }

  private async optimizeEventDetails(event: Partial<ParsedEvent>) {
    const optimized = { ...event };
    
    // Optimize venue selection
    if (!optimized.venueId) {
      const bestVenue = await this.findOptimalVenue(event);
      optimized.venueId = bestVenue.id;
      optimized.venueName = bestVenue.name;
    }
    
    // Optimize timing
    optimized.startTime = await this.findOptimalTime(event);
    
    // Optimize pricing
    optimized.cost = this.calculateOptimalPrice(event);
    
    // Optimize participant count
    const { min, max } = this.calculateOptimalParticipants(event);
    optimized.minParticipants = min;
    optimized.maxParticipants = max;
    
    return optimized;
  }

  private async findOptimalVenue(event: Partial<ParsedEvent>) {
    // Implementation to find the best venue based on sport, location, availability
    return { id: 'venue-123', name: 'Optimal Venue' };
  }

  private async findOptimalTime(event: Partial<ParsedEvent>) {
    // Implementation to find the best time based on venue availability and user preferences
    return new Date();
  }

  private calculateOptimalPrice(event: Partial<ParsedEvent>) {
    // Implementation to calculate optimal pricing based on market rates and demand
    return 25;
  }

  private calculateOptimalParticipants(event: Partial<ParsedEvent>) {
    // Implementation to calculate optimal participant range
    return { min: 8, max: 12 };
  }

  private suggestImprovements(result: NLPParseResult) {
    return {
      suggestions: result.suggestions,
      missingInfo: result.missingInfo,
      confidence: result.confidence,
    };
  }

  private calculateImprovements(original: any, optimized: any) {
    return {
      venueOptimization: original.venueId !== optimized.venueId,
      timeOptimization: original.startTime !== optimized.startTime,
      priceOptimization: original.cost !== optimized.cost,
      participantOptimization: original.maxParticipants !== optimized.maxParticipants,
    };
  }
}
```

### 5. Multi-Language Support

```typescript
import { eventNLPBuilder } from '../lib/ai/eventNLPBuilder';

class MultiLanguageEventBuilder {
  private languagePatterns = {
    spanish: {
      sports: {
        basketball: /baloncesto|basquetbol|basket/i,
        soccer: /fútbol|futbol|soccer/i,
        tennis: /tenis/i,
      },
      time: {
        today: /hoy/i,
        tomorrow: /mañana/i,
        next: /próximo|proximo/i,
      },
    },
    french: {
      sports: {
        basketball: /basket-ball|basketball/i,
        soccer: /football|soccer/i,
        tennis: /tennis/i,
      },
      time: {
        today: /aujourd'hui/i,
        tomorrow: /demain/i,
        next: /prochain/i,
      },
    },
  };

  async parseMultilingualCommand(command: string, language: string, userId: string) {
    // Detect language if not provided
    const detectedLanguage = language || this.detectLanguage(command);
    
    // Translate command to English if needed
    const translatedCommand = await this.translateCommand(command, detectedLanguage);
    
    // Parse the translated command
    const result = await eventNLPBuilder.parseCommand({
      text: translatedCommand,
      userId,
      timestamp: new Date(),
    });
    
    return {
      ...result,
      originalLanguage: detectedLanguage,
      originalCommand: command,
      translatedCommand,
    };
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    if (this.languagePatterns.spanish.sports.basketball.test(text)) {
      return 'spanish';
    }
    if (this.languagePatterns.french.sports.basketball.test(text)) {
      return 'french';
    }
    return 'english';
  }

  private async translateCommand(command: string, fromLanguage: string): Promise<string> {
    // Implementation for command translation
    // This would integrate with a translation service
    return command; // Placeholder
  }
}
```

## Configuration

### Environment Variables

```bash
# NLP Configuration
NLP_CONFIDENCE_THRESHOLD=0.5
NLP_MAX_SUGGESTIONS=5
NLP_UPDATE_INTERVAL=3600000  # 1 hour

# Venue Matching
VENUE_SEARCH_RADIUS=10  # miles
VENUE_MIN_RATING=4.0
VENUE_MAX_COST=100

# Time Parsing
TIME_ZONE=America/New_York
DEFAULT_EVENT_DURATION=120  # minutes
```

### Pattern Configuration

```typescript
const nlpConfig = {
  sportPatterns: {
    basketball: [/basketball|bball|hoops|5v5|3v3/i],
    soccer: [/soccer|football|futbol|11v11|7v7/i],
    tennis: [/tennis|singles|doubles/i],
  },
  timePatterns: [
    /(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
    /(\d{1,2})\s*(o'clock|oclock)/i,
    /today\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
  ],
  venuePatterns: [
    /at\s+([a-zA-Z\s]+(?:park|center|gym|field))/i,
    /in\s+([a-zA-Z\s]+(?:park|center|gym|field))/i,
  ],
};
```

## Performance Optimization

### 1. Command Caching

```typescript
class CommandCache {
  private cache = new Map<string, NLPParseResult>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getCachedResult(command: string): Promise<NLPParseResult | null> {
    const cached = this.cache.get(command);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    return null;
  }

  setCachedResult(command: string, result: NLPParseResult) {
    this.cache.set(command, {
      result,
      timestamp: Date.now(),
    });
  }
}
```

### 2. Batch Processing

```typescript
async function batchParseCommands(commands: NLPCommand[]) {
  const results = [];
  const batchSize = 5;
  
  for (let i = 0; i < commands.length; i += batchSize) {
    const batch = commands.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(cmd => eventNLPBuilder.parseCommand(cmd))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### 3. Real-time Suggestions

```typescript
// Provide real-time suggestions as user types
const suggestionEngine = {
  async getSuggestions(partialCommand: string): Promise<string[]> {
    if (partialCommand.length < 3) return [];
    
    // Return contextual suggestions based on partial command
    const suggestions = [];
    
    if (partialCommand.toLowerCase().includes('basket')) {
      suggestions.push('basketball', '5v5 basketball', '3v3 basketball');
    }
    
    if (partialCommand.toLowerCase().includes('saturday')) {
      suggestions.push('Saturday at 2 PM', 'Saturday evening', 'Saturday morning');
    }
    
    return suggestions.slice(0, 3);
  },
};
```

## Integration Examples

### Firebase Integration

```typescript
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

// Save parsed event to Firestore
async function saveParsedEvent(event: ParsedEvent) {
  await addDoc(collection(db, 'events'), {
    ...event,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  });
}

// Update event status
async function updateEventStatus(eventId: string, status: string) {
  await updateDoc(doc(db, 'events', eventId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}
```

### Calendar Integration

```typescript
import { addEventToCalendar } from '../calendar';

// Add event to user's calendar
async function addToCalendar(event: ParsedEvent, userId: string) {
  await addEventToCalendar({
    title: event.title,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.venueName,
    attendees: event.invites.map(invite => invite.email).filter(Boolean),
  });
}
```

## Best Practices

1. **User Feedback**: Collect feedback on parsing accuracy and improve patterns
2. **Context Awareness**: Use user location and preferences for better venue matching
3. **Error Handling**: Provide clear error messages and suggestions for failed parsing
4. **Progressive Enhancement**: Start with basic parsing and add advanced features
5. **Accessibility**: Ensure voice commands work with screen readers

## Troubleshooting

### Common Issues

1. **Low Parsing Accuracy**
   - Review and update pattern matching rules
   - Collect more training data
   - Implement fuzzy matching for typos

2. **Venue Matching Failures**
   - Expand venue database
   - Improve location-based search
   - Add venue aliases and common names

3. **Time Parsing Errors**
   - Handle multiple time zones
   - Support various date formats
   - Implement natural language date parsing

### Debug Mode

```typescript
// Enable debug logging
const debugConfig = {
  enableLogging: true,
  logLevel: 'verbose',
  saveParseResults: true,
  trackUserCommands: true,
};

eventNLPBuilder.setDebugMode(debugConfig);
```

## Future Enhancements

1. **Advanced NLP**: Integration with GPT or similar language models
2. **Voice Recognition**: Real-time speech-to-text processing
3. **Multi-modal Input**: Support for text, voice, and gesture commands
4. **Predictive Suggestions**: AI-powered event suggestions based on user history
5. **Automated Logistics**: Full event planning and coordination automation 