import React from 'react';
import { Card, Avatar, Typography } from '@mui/material';
import usePosts from '../hooks/usePosts';

export default function TimelineFeed() {
  const posts = usePosts();

  return (
    <div>
      {posts.map((post, index) => (
        <Card key={index} sx={{ mb: 2, p: 2 }}>
          <Avatar src={post.user.avatarUrl} sx={{ width: 56, height: 56, mb: 1 }} />
          <Typography>{post.text}</Typography>
          <Typography variant="caption">{new Date(post.createdAt).toLocaleString()}</Typography>
        </Card>
      ))}
    </div>
  );
} 