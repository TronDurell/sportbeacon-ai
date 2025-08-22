import React, { useState } from 'react';
import { Box, TextField, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import type { Message as AppMessage } from '@/types';

export interface Message {
	id: string;
	content: string;
	role: 'user' | 'assistant' | 'ai' | 'trainer';
	timestamp: string;
}

interface AIAssistantPanelProps {
	responses: AppMessage[] | Message[];
	isLoading: boolean;
	onSendMessage: (message: string) => void;
	onStartRecording: () => void;
	onStopRecording: () => void;
	isRecording: boolean;
	quickReplies?: string[];
}

export function AIAssistantPanel({ responses, isLoading, onSendMessage, quickReplies = [] }: AIAssistantPanelProps) {
	const [input, setInput] = useState('');
	return (
		<Box>
			<Typography variant="subtitle1">Assistant</Typography>
			<List sx={{ maxHeight: 240, overflow: 'auto' }}>
				{responses.map((m) => (
					<ListItem key={m.id}>
						<ListItemText primary={m.content} secondary={m.timestamp} />
					</ListItem>
				))}
			</List>
			<Box display="flex" gap={1}>
				<TextField size="small" fullWidth value={input} onChange={(e) => setInput(e.target.value)} />
				<IconButton onClick={() => input && onSendMessage(input)}>
					<SendIcon />
				</IconButton>
			</Box>
		</Box>
	);
} 