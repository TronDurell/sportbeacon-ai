// ParentChatInterface - Chat interface for parent interactions
import React from 'react';

export interface ParentChatInterfaceProps {
  parentId: string;
  onMessage: (message: string) => void;
}

export const ParentChatInterface: React.FC<ParentChatInterfaceProps> = ({ 
  parentId, 
  onMessage 
}) => {
  return (
    <div data-testid="parent-chat-interface">
      <h3>Parent Chat Interface</h3>
      <p>Parent ID: {parentId}</p>
      <button onClick={() => onMessage('Test message')}>
        Send Test Message
      </button>
    </div>
  );
};

export default ParentChatInterface;
