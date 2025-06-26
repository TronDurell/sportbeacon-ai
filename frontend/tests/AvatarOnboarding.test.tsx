import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AvatarOnboarding from '../components/AvatarOnboarding';

test('renders avatar onboarding and shows avatar preview', async () => {
  render(<AvatarOnboarding />);
  expect(await screen.findByText(/Welcome! Let's set up your avatar/i)).toBeInTheDocument();
  expect(await screen.findByText(/Avatar:/i)).toBeInTheDocument();
}); 