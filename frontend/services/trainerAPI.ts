import { Player, Insight, FeedItem, Message } from '../types';

export class TrainerAPI {
  async getRoster(trainerId: string): Promise<{ players: Player[] }> {
    // Simulate API call
    return {
      players: [
        {
          id: '1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'player',
          age: 16,
          position: 'Forward',
          team: { id: '1', name: 'Team A' },
          skills: [{ name: 'Shooting', level: 8 }],
          scoutRating: 85,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };
  }

  async getAssistantHistory(): Promise<Message[]> {
    // Simulate API call
    return [
      {
        id: '1',
        content: 'Hello, how can I help you today?',
        role: 'assistant',
        timestamp: new Date().toISOString()
      }
    ];
  }

  async acknowledgeInsight(insightId: string): Promise<void> {
    // Simulate API call
    console.log('Acknowledging insight:', insightId);
  }

  async interactWithPost(postId: string, type: string): Promise<FeedItem> {
    // Simulate API call
    return {
      id: postId,
      content: 'Sample post',
      author: { id: '1', name: 'User', avatar: '/avatar.jpg' },
      timestamp: new Date().toISOString(),
      type: 'post'
    };
  }

  async askAssistant(question: string): Promise<Message> {
    // Simulate API call
    return {
      id: Date.now().toString(),
      content: `Response to: ${question}`,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
  }
} 