import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    IconButton,
    Typography,
    Chip,
    Paper,
    Tooltip,
    Slider,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    Flag,
    Star,
    Timeline,
    Assessment,
    ContentCut,
    Download,
    Add,
    Remove,
} from '@mui/icons-material';
import { ScoutPlayer } from '../../types/player';

interface TimelineMarker {
    id: string;
    timestamp: number;
    type: 'highlight' | 'skill' | 'stat';
    label: string;
    value?: string | number;
    badgeIcon?: string;
}

interface VideoClip {
    startTime: number;
    endTime: number;
    description: string;
}

interface VideoOverlayProps {
    player: ScoutPlayer;
    videoUrl: string;
    markers: TimelineMarker[];
    onMarkerAdd?: (marker: TimelineMarker) => void;
    onMarkerClick?: (marker: TimelineMarker) => void;
    onClipExport?: (clip: VideoClip) => Promise<string>;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({
    player,
    videoUrl,
    markers,
    onMarkerAdd,
    onMarkerClick,
    onClipExport,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [activeMarkers, setActiveMarkers] = useState<TimelineMarker[]>([]);
    const [clipMode, setClipMode] = useState(false);
    const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
    const [clipDialogOpen, setClipDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [clipDescription, setClipDescription] = useState('');

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            const currentMarkers = markers.filter(
                marker => Math.abs(marker.timestamp - video.currentTime) < 0.5
            );
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
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video) return;

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

    const handleSetClipBoundary = (type: 'start' | 'end') => {
        if (!videoRef.current) return;

        const currentTime = videoRef.current.currentTime;
        setSelectedClip((prev) => ({
            startTime: type === 'start' ? currentTime : prev?.startTime || currentTime,
            endTime: type === 'end' ? currentTime : prev?.endTime || currentTime,
            description: prev?.description || '',
        }));
    };

    const handleExportClip = async () => {
        if (!selectedClip || !onClipExport) return;

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
        } catch (error) {
            console.error('Failed to export clip:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const generateThumbnail = useCallback(async (time: number): Promise<string> => {
        const video = videoRef.current;
        if (!video) return '';

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

    return (
        <Box sx={{ position: 'relative', width: '100%', bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
            <video
                ref={videoRef}
                src={videoUrl}
                style={{ width: '100%', height: 'auto' }}
            />

            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0, 0, 0, 0.5)', p: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton onClick={handlePlayPause} color="primary">
                        {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>

                    <Box
                        flex={1}
                        height={40}
                        position="relative"
                        onClick={handleTimelineClick}
                        sx={{ cursor: 'pointer' }}
                    >
                        <Slider
                            value={currentTime}
                            max={duration}
                            onChange={(_, value) => {
                                if (videoRef.current) {
                                    videoRef.current.currentTime = value as number;
                                }
                            }}
                            sx={{ position: 'absolute', bottom: 0, width: '100%' }}
                        />
                        
                        {markers.map((marker) => (
                            <Tooltip
                                key={marker.id}
                                title={`${marker.label} (${formatTimestamp(marker.timestamp)})`}
                            >
                                <Chip
                                    icon={
                                        marker.type === 'highlight' ? (
                                            <Star />
                                        ) : marker.type === 'skill' ? (
                                            <Assessment />
                                        ) : (
                                            <Timeline />
                                        )
                                    }
                                    label={marker.label}
                                    size="small"
                                    color={activeMarkers.includes(marker) ? 'primary' : 'default'}
                                    onClick={() => onMarkerClick?.(marker)}
                                    sx={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: `${(marker.timestamp / duration) * 100}%`,
                                        transform: 'translateX(-50%)',
                                        mb: 1,
                                    }}
                                />
                            </Tooltip>
                        ))}

                        {selectedClip && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: `${(selectedClip.startTime / duration) * 100}%`,
                                    width: `${((selectedClip.endTime - selectedClip.startTime) / duration) * 100}%`,
                                    height: '100%',
                                    bgcolor: 'primary.main',
                                    opacity: 0.3,
                                }}
                            />
                        )}
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <IconButton
                            color={clipMode ? 'primary' : 'default'}
                            onClick={handleClipModeToggle}
                        >
                            <ContentCut />
                        </IconButton>
                        
                        {clipMode && (
                            <>
                                <IconButton
                                    onClick={() => handleSetClipBoundary('start')}
                                    disabled={!clipMode}
                                >
                                    <Add />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleSetClipBoundary('end')}
                                    disabled={!clipMode}
                                >
                                    <Remove />
                                </IconButton>
                                {selectedClip && (
                                    <Button
                                        variant="contained"
                                        startIcon={<Download />}
                                        size="small"
                                        onClick={() => setClipDialogOpen(true)}
                                    >
                                        Export Clip
                                    </Button>
                                )}
                            </>
                        )}
                    </Stack>
                </Stack>
            </Box>

            <Dialog
                open={clipDialogOpen}
                onClose={() => setClipDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Export Video Clip</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Clip Description"
                            multiline
                            rows={2}
                            value={clipDescription}
                            onChange={(e) => setClipDescription(e.target.value)}
                        />
                        {selectedClip && (
                            <Typography variant="body2" color="text.secondary">
                                Duration: {formatTimestamp(selectedClip.endTime - selectedClip.startTime)}
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClipDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleExportClip}
                        variant="contained"
                        disabled={isExporting}
                        startIcon={isExporting ? <CircularProgress size={20} /> : <Download />}
                    >
                        {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}; 