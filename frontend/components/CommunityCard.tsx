import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  IconButton,
} from '@mui/material';
import { ThumbUp, Comment, Share } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  stats?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface CommunityCardProps {
  item: FeedItem;
  onInteract: (type: 'like' | 'comment' | 'share') => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  item,
  onInteract,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-2" role="region" aria-label="Community card" tabIndex={0}>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Avatar
              src={item.author.avatar}
              alt={item.author.name}
              sx={{ width: 40, height: 40 }}
            />
            <Box flex={1}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle2">{item.author.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                  })}
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
                      <IconButton size="small" onClick={() => onInteract('like')}>
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
    </div>
  );
};
