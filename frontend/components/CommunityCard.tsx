import React from 'react';
import { Card, Typography, Box, Button } from '@mui/material';
import type { FeedItem as AppFeedItem } from '@/types';

interface FeedItem extends AppFeedItem {
	stats?: Record<string, number>;
	userInteraction?: Record<string, boolean>;
}

type CommunityCardProps = {
	item: FeedItem;
	onInteract: (type: 'like' | 'comment' | 'share') => void;
};

export function CommunityCard({ item, onInteract }: CommunityCardProps) {
	return (
		<Card sx={{ p: 2 }}>
			<Typography variant="subtitle2">{item.author.name}</Typography>
			<Typography variant="body1" sx={{ my: 1 }}>{item.content}</Typography>
			<Box display="flex" gap={1}>
				<Button size="small" onClick={() => onInteract('like')}>Like</Button>
				<Button size="small" onClick={() => onInteract('comment')}>Comment</Button>
				<Button size="small" onClick={() => onInteract('share')}>Share</Button>
			</Box>
		</Card>
	);
} 