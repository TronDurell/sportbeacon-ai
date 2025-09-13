import { Player, Insight, FeedItem, Message } from '../src/types';

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
        senderId: 'ai',
        recipientId: 'user',
        content: 'Hello, how can I help you today?',
        type: 'text',
        status: 'sent',
        createdAt: new Date().toISOString(),
        role: 'ai',
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
      type: 'post',
      content: 'Sample post',
      author: 'User',
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0
      },
      userInteraction: {
        liked: false,
        shared: false,
        bookmarked: false
      }
    };
  }

  async askAssistant(question: string): Promise<Message> {
    // Simulate API call
    return {
      id: Date.now().toString(),
      senderId: 'ai',
      recipientId: 'user',
      content: `Response to: ${question}`,
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
      role: 'ai',
      timestamp: new Date().toISOString()
    };
  }
} 