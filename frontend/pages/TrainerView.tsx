import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Player, Insight, FeedItem, Message } from '../types';
import { TrainerAPI } from '../services/trainerAPI';
import { PlayerCard } from '../components/PlayerCard';
import { InsightCard } from '../components/InsightCard';
import { AIAssistantPanel } from '../components/AIAssistantPanel';
import { CommunityCard } from '../components/CommunityCard';
import { PlayerDetailsModal } from '../components/PlayerDetailsModal';

interface TrainerViewProps {
  trainerId: string;
}

export const TrainerView: React.FC<TrainerViewProps> = ({ trainerId }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const socket = useWebSocket('ws://localhost:3000');
  const trainerAPI = new TrainerAPI();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const rosterData = await trainerAPI.getRoster(trainerId);
        setPlayers(rosterData.players || []);
      } catch (error) {
        console.error('Failed to load roster:', error);
      }
    };

    loadInitialData();
  }, [trainerId]);

  useEffect(() => {
    const loadAssistantHistory = async () => {
      try {
        const history = await trainerAPI.getAssistantHistory();
        setMessages(history || []);
      } catch (error) {
        console.error('Failed to load assistant history:', error);
      }
    };

    loadAssistantHistory();
  }, []);

  useEffect(() => {
    if (socket.isConnected) {
      const unsubscribePlayer = socket.subscribe('player_update', (data: Player) => {
        setPlayers(prev => prev.map(p => p.id === data.id ? data : p));
      });

      const unsubscribeInsight = socket.subscribe('new_insight', (data: Insight) => {
        setInsights(prev => [data, ...prev]);
      });

      const unsubscribeFeed = socket.subscribe('feed_update', (data: FeedItem) => {
        setFeedItems(prev => [data, ...prev]);
      });

      return () => {
        unsubscribePlayer();
        unsubscribeInsight();
        unsubscribeFeed();
      };
    }
  }, [socket.isConnected]);

  const handlePlayerSelect = async (player: Player) => {
    try {
      setSelectedPlayer(player);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load player details:', error);
    }
  };

  const handleInsightAction = async (insightId: string) => {
    try {
      await trainerAPI.acknowledgeInsight(insightId);
      setInsights(prev => prev.filter(i => i.id !== insightId));
    } catch (error) {
      console.error('Failed to acknowledge insight:', error);
    }
  };

  const handleFeedInteraction = async (itemId: string, type: string) => {
    try {
      const updatedItem = await trainerAPI.interactWithPost(itemId, type);
      setFeedItems(prev => prev.map(f => 
        f.id === itemId ? {
          ...f,
          stats: {
            ...f.stats,
            [type + 's']: f.stats[type + 's' as keyof typeof f.stats] + 1
          },
          userInteraction: {
            ...f.userInteraction,
            [type]: true
          }
        } : f
      ));
    } catch (error) {
      console.error('Failed to interact with post:', error);
    }
  };

  const handleAskAssistant = async (question: string) => {
    try {
      const response = await trainerAPI.askAssistant(question);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Failed to ask assistant:', error);
    }
  };

  return (
    <div className="trainer-view">
      <div className="header">
        <h1>Trainer Dashboard</h1>
      </div>

      <div className="content">
        <div className="players-section">
          <h2>Roster</h2>
          <div className="players-grid">
            {players.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                onViewDetails={() => handlePlayerSelect(player)}
              />
            ))}
          </div>
        </div>

        <div className="insights-section">
          <h2>AI Insights</h2>
          <div className="insights-grid">
            {insights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={{
                  ...insight,
                  metric: insight.metric || 'performance',
                  timestamp: insight.timestamp || new Date()
                }}
                onAction={() => handleInsightAction(insight.id)}
              />
            ))}
          </div>
        </div>

        <div className="assistant-section">
          <h2>AI Assistant</h2>
          <AIAssistantPanel
            responses={messages.map(msg => ({
              ...msg,
              role: msg.role === 'user' ? 'trainer' : 'ai'
            }))}
            onAsk={handleAskAssistant}
          />
        </div>

        <div className="community-section">
          <h2>Community Feed</h2>
          <div className="feed-grid">
            {feedItems.map(item => (
              <CommunityCard
                key={item.id}
                item={{
                  ...item,
                  timestamp: new Date(item.timestamp)
                }}
                onInteract={(type) => handleFeedInteraction(item.id, type)}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedPlayer && (
        <PlayerDetailsModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          player={selectedPlayer}
          isMobile={false}
        />
      )}
    </div>
  );
}; 