import React, { useState } from 'react';
import { Button } from 'shadcn/ui/button';

const BroadcastTool: React.FC = () => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="w-full" role="region" aria-label="Broadcast tool" tabIndex={0}>
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Broadcast Tool</h2>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl">
          <label className="block font-medium mb-1">Announcement Message</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 p-2 mb-2"
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            aria-label="Announcement message"
          />
          <Button className="w-full" onClick={handleSend} disabled={!message.trim()}>
            Send Announcement
          </Button>
          {sent && <div className="text-green-600 mt-2">Announcement sent!</div>}
        </div>
      </div>
    </div>
  );
};

export default BroadcastTool; 