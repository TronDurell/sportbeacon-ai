// ChatSessionAnalytics - Analytics for chat sessions
import React from 'react';

export interface ChatSessionAnalyticsProps {
  sessionId: string;
  analytics: any;
  onExportAnalytics: () => void;
}

export const ChatSessionAnalytics: React.FC<ChatSessionAnalyticsProps> = ({ 
  sessionId, 
  analytics, 
  onExportAnalytics 
}) => {
  return (
    <div data-testid="chat-session-analytics">
      <h3>Chat Session Analytics</h3>
      <p>Session ID: {sessionId}</p>
      <p>Analytics: {JSON.stringify(analytics)}</p>
      <button onClick={onExportAnalytics}>
        Export Analytics
      </button>
    </div>
  );
};

export default ChatSessionAnalytics;
