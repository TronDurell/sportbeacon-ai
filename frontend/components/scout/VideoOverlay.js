import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, IconButton, Typography, Chip, Tooltip, Slider, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, } from '@mui/material';
import { PlayArrow, Pause, Star, Timeline, Assessment, ContentCut, Download, Add, Remove, } from '@mui/icons-material';
export const VideoOverlay = ({ player, videoUrl, markers, onMarkerAdd, onMarkerClick, onClipExport, }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [activeMarkers, setActiveMarkers] = useState([]);
    const [clipMode, setClipMode] = useState(false);
    const [selectedClip, setSelectedClip] = useState(null);
    const [clipDialogOpen, setClipDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [clipDescription, setClipDescription] = useState('');
    useEffect(() => {
        const video = videoRef.current;
        if (!video)
            return;
        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            const currentMarkers = markers.filter(marker => Math.abs(marker.timestamp - video.currentTime) < 0.5);
            setActiveMarkers(currentMarkers);
        };
        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [markers]);
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            }
            else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    const handleTimelineClick = (event) => {
        const video = videoRef.current;
        if (!video)
            return;
        const rect = event.currentTarget.getBoundingClientRect();
        const clickPosition = (event.clientX - rect.left) / rect.width;
        video.currentTime = clickPosition * video.duration;
    };
    const handleClipModeToggle = () => {
        if (clipMode && selectedClip) {
            setSelectedClip(null);
        }
        setClipMode(!clipMode);
    };
    const handleSetClipBoundary = (type) => {
        if (!videoRef.current)
            return;
        const currentTime = videoRef.current.currentTime;
        setSelectedClip((prev) => ({
            startTime: type === 'start' ? currentTime : prev?.startTime || currentTime,
            endTime: type === 'end' ? currentTime : prev?.endTime || currentTime,
            description: prev?.description || '',
        }));
    };
    const handleExportClip = async () => {
        if (!selectedClip || !onClipExport)
            return;
        setIsExporting(true);
        try {
            const clipUrl = await onClipExport({
                ...selectedClip,
                description: clipDescription,
            });
            // Create a temporary link to download the clip
            const link = document.createElement('a');
            link.href = clipUrl;
            link.download = `${player.firstName}_${player.lastName}_clip.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setClipDialogOpen(false);
            setSelectedClip(null);
            setClipMode(false);
        }
        catch (error) {
            console.error('Failed to export clip:', error);
        }
        finally {
            setIsExporting(false);
        }
    };
    const generateThumbnail = useCallback(async (time) => {
        const video = videoRef.current;
        if (!video)
            return '';
        video.currentTime = time;
        await new Promise((resolve) => {
            video.addEventListener('seeked', resolve, { once: true });
        });
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.7);
    }, []);
    return (_jsxs(Box, { sx: { position: 'relative', width: '100%', bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }, children: [_jsx("video", { ref: videoRef, src: videoUrl, style: { width: '100%', height: 'auto' } }), _jsx(Box, { sx: { position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0, 0, 0, 0.5)', p: 1 }, children: _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(IconButton, { onClick: handlePlayPause, color: "primary", children: isPlaying ? _jsx(Pause, {}) : _jsx(PlayArrow, {}) }), _jsxs(Box, { flex: 1, height: 40, position: "relative", onClick: handleTimelineClick, sx: { cursor: 'pointer' }, children: [_jsx(Slider, { value: currentTime, max: duration, onChange: (_, value) => {
                                        if (videoRef.current) {
                                            videoRef.current.currentTime = value;
                                        }
                                    }, sx: { position: 'absolute', bottom: 0, width: '100%' } }), markers.map((marker) => (_jsx(Tooltip, { title: `${marker.label} (${formatTimestamp(marker.timestamp)})`, children: _jsx(Chip, { icon: marker.type === 'highlight' ? (_jsx(Star, {})) : marker.type === 'skill' ? (_jsx(Assessment, {})) : (_jsx(Timeline, {})), label: marker.label, size: "small", color: activeMarkers.includes(marker) ? 'primary' : 'default', onClick: () => onMarkerClick?.(marker), sx: {
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: `${(marker.timestamp / duration) * 100}%`,
                                            transform: 'translateX(-50%)',
                                            mb: 1,
                                        } }) }, marker.id))), selectedClip && (_jsx(Box, { sx: {
                                        position: 'absolute',
                                        left: `${(selectedClip.startTime / duration) * 100}%`,
                                        width: `${((selectedClip.endTime - selectedClip.startTime) / duration) * 100}%`,
                                        height: '100%',
                                        bgcolor: 'primary.main',
                                        opacity: 0.3,
                                    } }))] }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(IconButton, { color: clipMode ? 'primary' : 'default', onClick: handleClipModeToggle, children: _jsx(ContentCut, {}) }), clipMode && (_jsxs(_Fragment, { children: [_jsx(IconButton, { onClick: () => handleSetClipBoundary('start'), disabled: !clipMode, children: _jsx(Add, {}) }), _jsx(IconButton, { onClick: () => handleSetClipBoundary('end'), disabled: !clipMode, children: _jsx(Remove, {}) }), selectedClip && (_jsx(Button, { variant: "contained", startIcon: _jsx(Download, {}), size: "small", onClick: () => setClipDialogOpen(true), children: "Export Clip" }))] }))] })] }) }), _jsxs(Dialog, { open: clipDialogOpen, onClose: () => setClipDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Export Video Clip" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { fullWidth: true, label: "Clip Description", multiline: true, rows: 2, value: clipDescription, onChange: (e) => setClipDescription(e.target.value) }), selectedClip && (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Duration: ", formatTimestamp(selectedClip.endTime - selectedClip.startTime)] }))] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setClipDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleExportClip, variant: "contained", disabled: isExporting, startIcon: isExporting ? _jsx(CircularProgress, { size: 20 }) : _jsx(Download, {}), children: isExporting ? 'Exporting...' : 'Export' })] })] })] }));
};
const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
