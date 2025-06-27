# CoachAssistantPanel

## Usage
```tsx
import CoachAssistantPanel from '../components/coach/CoachAssistantPanel';

<CoachAssistantPanel userId="user123" />
```

## Props
- `userId` (string): The user ID for chat context (default: 'demo').

## Features
- Real-time Firestore chat sync
- AI drill feedback and coaching suggestions
- ARIA roles, keyboard navigation, mobile polish

## Flows
1. User types a message and sends it.
2. Message is saved to Firestore and sent to AI endpoint.
3. AI response is saved to Firestore and rendered in chat.
4. Drill suggestions and feedback are displayed inline.

## Error Handling
- Fallback UI for Firestore/AI errors
- Typing indicator and loading states

## Accessibility
- ARIA roles for chat, input, and messages
- Keyboard navigation and focus management

--- 