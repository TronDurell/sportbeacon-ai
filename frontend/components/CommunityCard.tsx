import React from 'react';
import { Card, CardContent, Typography, Avatar, Box, IconButton } from '@mui/material';
import { ThumbUp, Comment, Share } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Import consolidated FeedItem interface
import type { FeedItem } from '../types';

interface CommunityCardProps {
    item: FeedItem;
    onInteract: (type: 'like' | 'comment' | 'share') => void;
    compact?: boolean;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ item, onInteract }) => {
    // Handle author type safely
    const author = typeof item.author === 'string' 
        ? { id: '', name: item.author, avatar: '' }
        : item.author;
    
    // Handle timestamp type safely
    const timestamp = typeof item.timestamp === 'string' 
        ? new Date(item.timestamp)
        : item.timestamp;

    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Box display="flex" alignItems="flex-start" gap={2}>
                    <Avatar
                        src={author.avatar}
                        alt={author.name}
                        sx={{ width: 40, height: 40 }}
                    />
                    <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2">
                                {author.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(timestamp, { addSuffix: true })}
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                            {item.content}
                        </Typography>
                        {item.stats && (
                            <Box 
                                display="flex" 
                                justifyContent="space-between"
                                alignItems="center"
                                borderTop={1}
                                borderColor="divider"
                                pt={1}
                            >
                                <Box display="flex" gap={2}>
                                    <Box display="flex" alignItems="center">
                                        <IconButton 
                                            size="small"
                                            onClick={() => onInteract('like')}
                                        >
                                            <ThumbUp fontSize="small" />
                                        </IconButton>
                                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                                            {item.stats.likes}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center">
                                        <IconButton 
                                            size="small"
                                            onClick={() => onInteract('comment')}
                                        >
                                            <Comment fontSize="small" />
                                        </IconButton>
                                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                                            {item.stats.comments}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center">
                                        <IconButton 
                                            size="small"
                                            onClick={() => onInteract('share')}
                                        >
                                            <Share fontSize="small" />
                                        </IconButton>
                                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                                            {item.stats.shares}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}; 