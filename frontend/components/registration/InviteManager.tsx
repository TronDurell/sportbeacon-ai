import React, { useState } from 'react';
import { Button } from 'shadcn/ui/button';

const invites = [
  { id: '1', league: 'Spring Soccer', status: 'pending' },
];

const InviteManager: React.FC = () => {
  const [inviteStatus, setInviteStatus] = useState(invites);

  const handleAction = (id: string, action: 'accept' | 'decline' | 'resend') => {
    setInviteStatus(inviteStatus.map(invite =>
      invite.id === id
        ? { ...invite, status: action === 'resend' ? 'pending' : action }
        : invite
    ));
  };

  return (
    <div className="w-full" role="region" aria-label="Invite manager" tabIndex={0}>
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Your Invites</h2>
        <ul className="divide-y">
          {inviteStatus.map(invite => (
            <li key={invite.id} className="py-2 flex justify-between items-center">
              <span>{invite.league} ({invite.status})</span>
              <div className="space-x-2">
                <Button size="sm" onClick={() => handleAction(invite.id, 'accept')} disabled={invite.status !== 'pending'}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={() => handleAction(invite.id, 'decline')} disabled={invite.status !== 'pending'}>Decline</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAction(invite.id, 'resend')}>Resend</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InviteManager; 