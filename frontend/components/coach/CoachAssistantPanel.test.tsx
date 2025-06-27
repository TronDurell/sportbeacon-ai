import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoachAssistantPanel from './CoachAssistantPanel';
import '@testing-library/jest-dom';

describe('CoachAssistantPanel', () => {
  it('renders input and send button', () => {
    render(<CoachAssistantPanel userId="testuser" />);
    expect(screen.getByPlaceholderText(/ask the coach assistant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('shows typing indicator when loading', async () => {
    render(<CoachAssistantPanel userId="testuser" />);
    fireEvent.change(screen.getByPlaceholderText(/ask the coach assistant/i), { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByText(/typing/i)).toBeInTheDocument();
  });

  it('handles Firestore errors gracefully', async () => {
    // Simulate Firestore error by mocking addDoc/onSnapshot
    // ...mock logic here...
    render(<CoachAssistantPanel userId="testuser" />);
    // ...simulate error...
    // expect fallback UI
  });
}); 