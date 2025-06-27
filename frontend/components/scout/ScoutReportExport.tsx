import React, { useState } from 'react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download,
  Share,
  FileCopy,
  Email,
  WhatsApp,
  LinkedIn,
} from '@mui/icons-material';
import { PDFTemplate } from './PDFTemplate';
import { ScoutPlayer } from '../../types/player';
import { Badge } from '../BadgeSystem';
import { AIAnalysis } from '../../services/PlayerAIService';

interface ScoutReportExportProps {
  player: ScoutPlayer;
  badges: Badge[];
  aiAnalysis: AIAnalysis;
  videoSnapshots: Array<{
    url: string;
    timestamp: number;
    description: string;
  }>;
  drillHistory: Array<{
    date: string;
    name: string;
    performance: number;
    notes: string;
  }>;
  organizationLogo: string;
}

export const ScoutReportExport: React.FC<ScoutReportExportProps> = ({
  player,
  badges,
  aiAnalysis,
  videoSnapshots,
  drillHistory,
  organizationLogo,
}) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      // Generate PDF blob
      const pdfDoc = (
        <PDFTemplate
          player={player}
          badges={badges}
          aiRecap={aiAnalysis}
          videoSnapshots={videoSnapshots}
          drillHistory={drillHistory}
          organizationLogo={organizationLogo}
        />
      );
      const blob = await pdf(pdfDoc).toBlob();

      // Upload to temporary storage and get shareable link
      const formData = new FormData();
      formData.append(
        'file',
        blob,
        `${player.firstName}_${player.lastName}_Scout_Report.pdf`
      );

      // Replace with your actual API endpoint
      const response = await fetch('/api/reports/share', {
        method: 'POST',
        body: formData,
      });

      const { url } = await response.json();
      setShareUrl(url);
      setShareDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate shareable report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  const handleEmailShare = () => {
    const subject = `Scout Report - ${player.firstName} ${player.lastName}`;
    const body = `Check out this scouting report:\n\n${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="w-full" role="region" aria-label="Scout report export" tabIndex={0}>
      <Box>
        <Stack direction="row" spacing={2}>
          <PDFDownloadLink
            document={
              <PDFTemplate
                player={player}
                badges={badges}
                aiRecap={aiAnalysis}
                videoSnapshots={videoSnapshots}
                drillHistory={drillHistory}
                organizationLogo={organizationLogo}
              />
            }
            fileName={`${player.firstName}_${player.lastName}_Scout_Report.pdf`}
          >
            {({ loading }) => (
              <Button
                variant="contained"
                startIcon={<Download />}
                disabled={loading}
              >
                {loading ? 'Preparing...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>

          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={handleShare}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Share Report'}
          </Button>
        </Stack>

        <Dialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Share Scout Report</DialogTitle>
          <DialogContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Report Link
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      bgcolor: 'grey.100',
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    {shareUrl}
                  </Typography>
                  <Tooltip title="Copy link">
                    <IconButton onClick={handleCopyLink} size="small">
                      <FileCopy />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Share via
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Email">
                    <IconButton onClick={handleEmailShare}>
                      <Email />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="WhatsApp">
                    <IconButton
                      onClick={() =>
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(
                            `Scout Report - ${player.firstName} ${player.lastName}\n${shareUrl}`
                          )}`
                        )
                      }
                    >
                      <WhatsApp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="LinkedIn">
                    <IconButton
                      onClick={() =>
                        window.open(
                          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                            shareUrl
                          )}`
                        )
                      }
                    >
                      <LinkedIn />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </div>
  );
};
