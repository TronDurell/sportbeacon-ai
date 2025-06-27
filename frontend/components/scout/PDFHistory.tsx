import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  TablePagination,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

interface PDFReport {
  id: string;
  playerId: string;
  playerName: string;
  timestamp: Date;
  url: string;
  stats: {
    goalsScored?: number;
    assists?: number;
    passAccuracy?: number;
    shotAccuracy?: number;
  };
  tags: string[];
}

interface PDFHistoryProps {
  onPreview: (url: string) => void;
  onDownload: (url: string, filename: string) => void;
}

export const PDFHistory: React.FC<PDFHistoryProps> = ({
  onPreview,
  onDownload,
}) => {
  const [reports, setReports] = useState<PDFReport[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/pdf-reports');
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data.reports);
      } catch (error) {
        console.error('Error fetching PDF reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter(
    report =>
      report.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleGenerateAudio = async () => {
    try {
      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          summary: selectedPlayer.summary,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate audio');
      const data = await response.json();
      setAudioUrl(data.url);
    } catch (error) {
      console.error('Error generating audio:', error);
    }
  };

  return (
    <div className="w-full" role="region" aria-label="PDF history" tabIndex={0}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">PDF Report History</Typography>
        <TextField
          size="small"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Key Stats</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(report => (
                <TableRow key={report.id}>
                  <TableCell>{report.playerName}</TableCell>
                  <TableCell>{formatDate(report.timestamp)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {report.stats.goalsScored !== undefined && (
                        <Chip
                          size="small"
                          label={`Goals: ${report.stats.goalsScored}`}
                        />
                      )}
                      {report.stats.assists !== undefined && (
                        <Chip
                          size="small"
                          label={`Assists: ${report.stats.assists}`}
                        />
                      )}
                      {report.stats.passAccuracy !== undefined && (
                        <Chip
                          size="small"
                          label={`Pass Acc: ${report.stats.passAccuracy}%`}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {report.tags.map(tag => (
                        <Chip
                          key={tag}
                          size="small"
                          label={tag}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => onPreview(report.url)}
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        onDownload(
                          report.url,
                          `${report.playerName}_Report_${new Date(report.timestamp).toISOString().split('T')[0]}.pdf`
                        )
                      }
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredReports.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {audioUrl && (
        <Box sx={{ mt: 2 }}>
          <audio controls src={audioUrl} />
        </Box>
      )}
    </div>
  );
};
