import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, Typography, Avatar, Box, IconButton } from '@mui/material';
import { ThumbUp, Comment, Share } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
export const CommunityCard = ({ item, onInteract }) => {
    // Handle author type safely
    const author = typeof item.author === 'string'
        ? { id: '', name: item.author, avatar: '' }
        : item.author;
    // Handle timestamp type safely
    const timestamp = typeof item.timestamp === 'string'
        ? new Date(item.timestamp)
        : item.timestamp;
    return (_jsx(Card, { variant: "outlined", sx: { mb: 2 }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", alignItems: "flex-start", gap: 2, children: [_jsx(Avatar, { src: author.avatar, alt: author.name, sx: { width: 40, height: 40 } }), _jsxs(Box, { flex: 1, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "subtitle2", children: author.name }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: formatDistanceToNow(timestamp, { addSuffix: true }) })] }), _jsx(Typography, { variant: "body2", sx: { mt: 1, mb: 2 }, children: item.content }), item.stats && (_jsx(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: 1, borderColor: "divider", pt: 1, children: _jsxs(Box, { display: "flex", gap: 2, children: [_jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(IconButton, { size: "small", onClick: () => onInteract('like'), children: _jsx(ThumbUp, { fontSize: "small" }) }), _jsx(Typography, { variant: "caption", sx: { ml: 0.5 }, children: item.stats.likes })] }), _jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(IconButton, { size: "small", onClick: () => onInteract('comment'), children: _jsx(Comment, { fontSize: "small" }) }), _jsx(Typography, { variant: "caption", sx: { ml: 0.5 }, children: item.stats.comments })] }), _jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(IconButton, { size: "small", onClick: () => onInteract('share'), children: _jsx(Share, { fontSize: "small" }) }), _jsx(Typography, { variant: "caption", sx: { ml: 0.5 }, children: item.stats.shares })] })] }) }))] })] }) }) }));
};
