import React from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import { PictureAsPdf, Download } from '@mui/icons-material';
import { ScoutPlayer, PlayerStats } from '../../types/player';
import { PlayerEvaluation } from '../../types/scout';

interface PDFExportProps {
  player: ScoutPlayer;
  evaluation?: PlayerEvaluation;
  onExport: () => void;
  isGenerating: boolean;
}

interface ExportOptions {
  includeStats: boolean;
  includeEvaluation: boolean;
  includeHistory: boolean;
  includeMedia: boolean;
  includeAchievements: boolean;
}

export const PDFExport: React.FC<PDFExportProps> = ({
  player,
  evaluation,
  onExport,
  isGenerating,
}) => {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ExportOptions>({
    includeStats: true,
    includeEvaluation: true,
    includeHistory: true,
    includeMedia: true,
    includeAchievements: true,
  });

  const handleOptionChange = (option: keyof ExportOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleExport = async () => {
    try {
      await onExport();
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="w-full" role="region" aria-label="PDF export" tabIndex={0}>
      <Button
        variant="contained"
        startIcon={<PictureAsPdf />}
        onClick={() => setOpen(true)}
      >
        Generate Report
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Player Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Select the sections to include in the PDF report for{' '}
            {player.firstName} {player.lastName}
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeStats}
                  onChange={() => handleOptionChange('includeStats')}
                />
              }
              label="Performance Statistics"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeEvaluation}
                  onChange={() => handleOptionChange('includeEvaluation')}
                />
              }
              label="Scout Evaluation"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeHistory}
                  onChange={() => handleOptionChange('includeHistory')}
                />
              }
              label="Career History"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeMedia}
                  onChange={() => handleOptionChange('includeMedia')}
                />
              }
              label="Media & Highlights"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeAchievements}
                  onChange={() => handleOptionChange('includeAchievements')}
                />
              }
              label="Achievements & Badges"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={
              isGenerating ? <CircularProgress size={20} /> : <Download />
            }
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Export PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
