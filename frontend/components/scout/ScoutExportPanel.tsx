import React from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Download,
  WhatsApp,
  LinkedIn,
  Email,
} from '@mui/icons-material';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PlayerReportPDF } from '@/components/pdf/PlayerReportPDF';
import { ScoutPlayer } from '../../types/player';

interface ScoutExportPanelProps {
  player: ScoutPlayer;
  isExpanded: boolean;
  isGeneratingPreview: boolean;
  isUploadingPDF: boolean;
  pdfUrl: string | null;
  shareableUrl: ShareableURL | null;
  canExport: boolean;
  onToggleExpanded: () => void;
  onShare: (platform: 'whatsapp' | 'linkedin' | 'email') => void;
}

interface ShareableURL {
  url: string;
  expiresAt: Date;
}

export const ScoutExportPanel: React.FC<ScoutExportPanelProps> = ({
  player,
  isExpanded,
  isGeneratingPreview,
  isUploadingPDF,
  pdfUrl,
  shareableUrl,
  canExport,
  onToggleExpanded,
  onShare,
}) => {
  return (
    <Box sx={{ mt: 3 }}>
      <Accordion
        expanded={isExpanded}
        onChange={onToggleExpanded}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Export Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {canExport ? (
              <PDFDownloadLink
                document={
                  <PlayerReportPDF
                    player={player}
                    analysis={undefined}
                    timestamp={new Date()}
                  />
                }
                fileName={`sportbeacon-${player.firstName.toLowerCase().replace(/\s+/g, '-')}-${player.id}.pdf`}
              >
                {({ loading, error }) => (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Download />}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading
                      ? 'Generating Report...'
                      : 'Export Player Report'}
                  </Button>
                )}
              </PDFDownloadLink>
            ) : (
              <Tooltip title="Only coaches and scouts can export reports">
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Download />}
                    disabled
                    sx={{ mt: 2 }}
                  >
                    Export Player Report
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>

          {isGeneratingPreview && !pdfUrl && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height={600}
              sx={{ borderRadius: 1 }}
            />
          )}

          {pdfUrl && (
            <>
              <Box
                sx={{
                  mt: 2,
                  height: 600,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                {/* XSS Mitigation: Only allow blob: or trusted domain URLs */}
                {/^blob:|^https:\/\/(trusted-domain\.com|localhost)/.test(pdfUrl) ? (
                  <iframe
                    src={pdfUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    title="PDF Preview"
                  />
                ) : (
                  <Typography color="error">
                    Invalid or untrusted PDF URL.
                  </Typography>
                )}
              </Box>

              {isUploadingPDF ? (
                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Skeleton variant="circular" width={20} height={20} />
                  <Typography>Preparing sharing options...</Typography>
                </Box>
              ) : (
                shareableUrl && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Share Report
                    </Typography>
                    <ButtonGroup variant="outlined" size="small">
                      <IconButton onClick={() => onShare('whatsapp')}>
                        <WhatsApp />
                      </IconButton>
                      <IconButton onClick={() => onShare('linkedin')}>
                        <LinkedIn />
                      </IconButton>
                      <IconButton onClick={() => onShare('email')}>
                        <Email />
                      </IconButton>
                    </ButtonGroup>
                  </Box>
                )
              )}
            </>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}; 