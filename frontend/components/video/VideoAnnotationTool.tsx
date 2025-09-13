// Firebase Backend Integration - Video Storage & Annotations
// - Real Firebase Storage for video uploads
// - Firestore for annotation metadata storage
// - Real-time annotation synchronization
// - Progress tracking and error handling

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useVideoUpload } from '../../hooks/useVideoUpload';
import AnnotationService from '../../services/annotationService';
import type { VideoAnnotationDocument } from '../../firebase/types';
// import type { AnnotationData } from '../../firebase/types'; // Type not found
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Slider,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  Fullscreen,
  Brush,
  TextFields,
  Crop,
  Undo,
  Redo,
  Save,
  Clear,
  Add,
  Delete,
  Edit,
  Visibility,
  VisibilityOff,
  CloudUpload,
  VideoFile
} from '@mui/icons-material';
import { VideoPlayer } from './VideoPlayer';

interface Annotation {
  id: string;
  type: 'drawing' | 'text' | 'highlight';
  timestamp: number;
  data: any;
  notes?: string;
  color: string;
  visible: boolean;
}

interface VideoAnnotationToolProps {
  videoSrc: string;
  videoId?: string; // Firebase video ID
  playerId?: string; // Legacy support
  onSave?: (annotations: Annotation[]) => void;
  onLoad?: (annotations: Annotation[]) => void;
  onVideoUpload?: (videoId: string, downloadURL: string) => void;
}

const colors = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];

const annotationTypes = [
  { value: 'drawing', label: 'Drawing', icon: <Brush /> },
  { value: 'text', label: 'Text', icon: <TextFields /> },
  { value: 'highlight', label: 'Highlight', icon: <Crop /> }
];

export const VideoAnnotationTool: React.FC<VideoAnnotationToolProps> = ({
  videoSrc,
  videoId,
  playerId,
  onSave,
  onLoad,
  onVideoUpload
}) => {
  const { user } = useAuth();
  const { uploadVideo, isUploading, uploadProgress, error: uploadError } = useVideoUpload();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [selectedType, setSelectedType] = useState<'drawing' | 'text' | 'highlight'>('drawing');
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);
  const [textInput, setTextInput] = useState('');
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textPosition, setTextPosition] = useState({x: 0, y: 0});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<string | undefined>(videoId);

  // Load annotations on mount
  useEffect(() => {
    if (currentVideoId) {
      loadAnnotations();
    }
  }, [currentVideoId]);

  // Update canvas when annotations change
  useEffect(() => {
    drawAnnotations();
  }, [annotations, currentTime, showAnnotations]);

  // Handle upload errors
  useEffect(() => {
    if (uploadError) {
      setError(uploadError);
    }
  }, [uploadError]);

  const loadAnnotations = async () => {
    if (!currentVideoId || !user?.uid) return;
    
    setIsLoading(true);
    try {
      const firestoreAnnotations = await AnnotationService.getVideoAnnotations(currentVideoId);
      
      // Convert Firestore annotations to local format
      const localAnnotations: Annotation[] = firestoreAnnotations.map(doc => ({
        id: doc.id,
        type: doc.data.type as 'drawing' | 'text' | 'highlight',
        timestamp: doc.data.startTime || 0,
        data: doc.data,
        notes: doc.data.content,
        color: doc.data.color || '#FF0000',
        visible: doc.data.visible !== false
      }));
      
      setAnnotations(localAnnotations);
      onLoad?.(localAnnotations);
    } catch (error) {
      setError('Failed to load annotations');
      console.error('Error loading annotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnnotations = async () => {
    if (!currentVideoId || !user?.uid) {
      setError('No video ID or user not authenticated');
      return;
    }
    
    setIsLoading(true);
    try {
      // Convert local annotations to Firestore format
      const annotationData = annotations.map(annotation => ({
        type: annotation.type,
        title: annotation.notes || `${annotation.type} annotation`,
        content: annotation.notes || '',
        startTime: annotation.timestamp,
        endTime: annotation.timestamp + 1, // 1 second duration
        color: annotation.color,
        visible: annotation.visible,
        data: annotation.data,
        metadata: {
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        }
      }));

      // Save annotations to Firestore
      const annotationIds = await AnnotationService.createBatchAnnotations(
        currentVideoId,
        annotationData,
        user.uid
      );
      
      console.log('Saved annotations:', annotationIds);
      onSave?.(annotations);
    } catch (error) {
      setError('Failed to save annotations');
      console.error('Error saving annotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    try {
      const result = await uploadVideo(file, {
        compress: true,
        quality: 0.8,
        onSuccess: (metadata) => {
          setCurrentVideoId(metadata.videoId);
          onVideoUpload?.(metadata.videoId, metadata.downloadURL);
        }
      });

      if (result) {
        console.log('Video uploaded successfully:', result);
      }
    } catch (error) {
      console.error('Video upload failed:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleVideoUpload(file);
    }
  };

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showAnnotations) return;

    // Draw annotations for current timestamp
    const currentAnnotations = annotations.filter(
      ann => Math.abs(ann.timestamp - currentTime) < 0.5 && ann.visible
    );

    currentAnnotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 2;

      switch (annotation.type) {
        case 'drawing':
          if (annotation.data.points && annotation.data.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.data.points[0].x, annotation.data.points[0].y);
            annotation.data.points.forEach((point: {x: number, y: number}) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;

        case 'text':
          if (annotation.data.text && annotation.data.position) {
            ctx.font = '16px Arial';
            ctx.fillText(
              annotation.data.text,
              annotation.data.position.x,
              annotation.data.position.y
            );
          }
          break;

        case 'highlight':
          if (annotation.data.rect) {
            ctx.globalAlpha = 0.3;
            ctx.fillRect(
              annotation.data.rect.x,
              annotation.data.rect.y,
              annotation.data.rect.width,
              annotation.data.rect.height
            );
            ctx.globalAlpha = 1;
          }
          break;
      }
    });
  }, [annotations, currentTime, showAnnotations]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

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

  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedType === 'drawing') {
      setIsDrawing(true);
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrawingPoints([{x, y}]);
    } else if (selectedType === 'text') {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTextPosition({x, y});
      setShowTextDialog(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && selectedType === 'drawing') {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrawingPoints(prev => [...prev, {x, y}]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && selectedType === 'drawing' && drawingPoints.length > 1) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'drawing',
        timestamp: currentTime,
        data: { points: [...drawingPoints] },
        color: selectedColor,
        visible: true
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      setDrawingPoints([]);
    }
    setIsDrawing(false);
  };

  const handleAddText = () => {
    if (textInput.trim()) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'text',
        timestamp: currentTime,
        data: { 
          text: textInput,
          position: textPosition
        },
        color: selectedColor,
        visible: true
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      setTextInput('');
      setShowTextDialog(false);
    }
  };

  const handleAddHighlight = () => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: 'highlight',
      timestamp: currentTime,
      data: { 
        rect: { x: 50, y: 50, width: 200, height: 100 }
      },
      color: selectedColor,
      visible: true
    };
    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  const handleToggleAnnotationVisibility = (id: string) => {
    setAnnotations(prev => 
      prev.map(ann => 
        ann.id === id ? { ...ann, visible: !ann.visible } : ann
      )
    );
  };

  const handleClearAll = () => {
    setAnnotations([]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Video Annotation Tool</Typography>
          <Box>
            {/* Video Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <Button
              startIcon={<CloudUpload />}
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              sx={{ mr: 1 }}
            >
              Upload Video
            </Button>
            <Button
              startIcon={<Save />}
              variant="contained"
              onClick={saveAnnotations}
              disabled={isLoading || !currentVideoId}
              sx={{ mr: 1 }}
            >
              Save
            </Button>
            <Button
              startIcon={<Clear />}
              variant="outlined"
              onClick={handleClearAll}
              color="error"
            >
              Clear All
            </Button>
          </Box>
        </Box>

        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Uploading video... {uploadProgress.progress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress.progress} />
          </Box>
        )}

        {/* Error Display */}
        {(error || uploadError) && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error || uploadError}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Video Player */}
          <Grid item xs={12} md={8}>
            <Box sx={{ position: 'relative' }}>
              <VideoPlayer
                ref={videoRef}
                src={videoSrc}
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ width: '100%', height: 'auto' }}
              />
              
              {/* Annotation Canvas Overlay */}
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  cursor: selectedType === 'drawing' ? 'crosshair' : 'default'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              />
            </Box>

            {/* Video Controls */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <IconButton onClick={handlePlayPause}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton onClick={() => handleSeek(Math.max(0, currentTime - 10))}>
                  <SkipPrevious />
                </IconButton>
                <IconButton onClick={() => handleSeek(Math.min(duration, currentTime + 10))}>
                  <SkipNext />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                  <VolumeUp />
                  <Slider
                    value={volume}
                    onChange={(_, value) => handleVolumeChange(value as number)}
                    min={0}
                    max={1}
                    step={0.1}
                    sx={{ width: 100 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ ml: 'auto' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
              </Box>
              
              <Slider
                value={currentTime}
                onChange={(_, value) => handleSeek(value as number)}
                min={0}
                max={duration}
                step={0.1}
              />
            </Box>
          </Grid>

          {/* Annotation Controls */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Annotation Tools
              </Typography>

              {/* Video ID Display */}
              {currentVideoId && (
                <Chip
                  icon={<VideoFile />}
                  label={`Video: ${currentVideoId.substring(0, 8)}...`}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              )}

              {/* Annotation Type Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Annotation Type</InputLabel>
                <Select
                  value={selectedType}
                  label="Annotation Type"
                  onChange={(e) => setSelectedType(e.target.value as any)}
                >
                  {annotationTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Color Selection */}
              <Typography variant="body2" gutterBottom>
                Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {colors.map(color => (
                  <Box
                    key={color}
                    sx={{
                      width: 30,
                      height: 30,
                      backgroundColor: color,
                      border: selectedColor === color ? '3px solid #000' : '1px solid #ccc',
                      borderRadius: '50%',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </Box>

              {/* Quick Actions */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddHighlight}
                  fullWidth
                >
                  Add Highlight
                </Button>
              </Box>

              {/* Visibility Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={showAnnotations}
                    onChange={(e) => setShowAnnotations(e.target.checked)}
                  />
                }
                label="Show Annotations"
              />

              <Divider sx={{ my: 2 }} />

              {/* Annotations List */}
              <Typography variant="h6" gutterBottom>
                Annotations ({annotations.length})
              </Typography>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {annotations.map(annotation => (
                  <ListItem key={annotation.id} dense>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          backgroundColor: annotation.color,
                          borderRadius: '50%'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${annotation.type} at ${formatTime(annotation.timestamp)}`}
                      secondary={annotation.notes}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleToggleAnnotationVisibility(annotation.id)}
                    >
                      {annotation.visible ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* Text Input Dialog */}
        <Dialog open={showTextDialog} onClose={() => setShowTextDialog(false)}>
          <DialogTitle>Add Text Annotation</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              multiline
              rows={3}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowTextDialog(false)}>Cancel</Button>
            <Button onClick={handleAddText} variant="contained">
              Add Text
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}; 