import React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ConflictRationaleBannerProps {
  message: string;
  onClose?: () => void;
}

const ConflictRationaleBanner: React.FC<ConflictRationaleBannerProps> = ({ message, onClose }) => (
  <Alert
    severity="warning"
    icon={<ErrorOutlineIcon fontSize="inherit" />}
    onClose={onClose}
    sx={{ mb: 2 }}
  >
    <AlertTitle>Booking Conflict</AlertTitle>
    {message}
  </Alert>
);

export default ConflictRationaleBanner; 