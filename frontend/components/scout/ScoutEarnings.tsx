import React from 'react';
import {
  Box,
  Typography,
  Skeleton,
} from '@mui/material';
import { CreatorInvoiceTable } from './CreatorInvoiceTable';
import { CreatorAnalytics } from '../earnings/CreatorAnalytics';

interface ScoutEarningsProps {
  profileId: string;
  isAnalyticsLoading: boolean;
}

export const ScoutEarnings: React.FC<ScoutEarningsProps> = ({
  profileId,
  isAnalyticsLoading,
}) => {
  return (
    <Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tip History
        </Typography>
        <CreatorInvoiceTable profileId={profileId} />
      </Box>

      {/* Creator Analytics */}
      {isAnalyticsLoading ? (
        <Skeleton variant="rounded" height={300} />
      ) : (
        <CreatorAnalytics profileId={profileId} />
      )}
    </Box>
  );
}; 