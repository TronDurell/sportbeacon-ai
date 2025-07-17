import React from 'react';
import {
  Box,
  Grid,
  Fab,
  useTheme,
} from '@mui/material';
import { Share } from '@mui/icons-material';
import { VideoOverlay } from './VideoOverlay';
import { PlayerRecap } from './PlayerRecap';
import { PDFExport } from './PDFExport';
import { RadarChart } from './RadarChart';
import { VideoNotes } from './VideoNotes';
import { PDFHistory } from './PDFHistory';
import { ScoutPlayer } from '../../types/player';

interface ScoutPlayerViewProps {
  player: ScoutPlayer;
  isGeneratingPDF: boolean;
  currentVideoTime: number;
  videoNotes: VideoNote[];
  comparisonStats: Record<string, number> | null;
  comparisonType: 'team' | 'league' | 'none';
  onExportPDF: () => void;
  onVideoSeek: (time: number) => void;
  onAddVideoNote: (note: VideoNote) => void;
  onDeleteVideoNote: (noteId: string) => void;
  onComparisonChange: (type: 'team' | 'league' | 'none') => void;
  onShareReport?: () => void;
}

interface VideoNote {
  id: string;
  time: number;
  text: string;
  timestamp: Date;
}

export const ScoutPlayerView: React.FC<ScoutPlayerViewProps> = ({
  player,
  isGeneratingPDF,
  currentVideoTime,
  videoNotes,
  comparisonStats,
  comparisonType,
  onExportPDF,
  onVideoSeek,
  onAddVideoNote,
  onDeleteVideoNote,
  onComparisonChange,
  onShareReport,
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <VideoOverlay
          player={player}
          videoUrl={player.mediaUrls.highlightVideos[0]}
          markers={[]} // Add your markers here
          onMarkerAdd={() => {}} // Implement marker handling
          onMarkerClick={() => {}}
        />
      </Grid>

      <Grid item xs={12} md={8}>
        <PlayerRecap
          player={player}
          evaluation={undefined} // Add evaluation if available
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <Box sx={{ position: 'sticky', top: theme.spacing(3) }}>
          <PDFExport
            player={player}
            evaluation={undefined} // Add evaluation if available
            onExport={onExportPDF}
            isGenerating={isGeneratingPDF}
          />

          <Fab
            color="primary"
            variant="extended"
            sx={{ mt: 2 }}
            onClick={onShareReport}
          >
            <Share sx={{ mr: 1 }} />
            Share Report
          </Fab>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <RadarChart
          playerStats={player.stats}
          playerPercentiles={{}} // Add percentiles data
          comparisonStats={comparisonStats}
          comparisonType={comparisonType}
          onComparisonChange={onComparisonChange}
        />
      </Grid>

      <Grid item xs={12}>
        <VideoNotes
          currentTime={currentVideoTime}
          onSeek={onVideoSeek}
          onAddNote={onAddVideoNote}
          onDeleteNote={onDeleteVideoNote}
          notes={videoNotes}
        />
      </Grid>

      <Grid item xs={12}>
        <PDFHistory
          onPreview={(url) => {
            // Handle preview
          }}
          onDownload={(url, filename) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        />
      </Grid>
    </Grid>
  );
}; 