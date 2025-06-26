import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InfoIcon from '@mui/icons-material/Info';

interface InlineTooltipProps {
  title: string;
  children?: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const InlineTooltip: React.FC<InlineTooltipProps> = ({ title, children, placement = 'top' }) => (
  <Tooltip
    title={
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
        {children && <Typography variant="body2">{children}</Typography>}
      </Box>
    }
    placement={placement}
    arrow
  >
    <Box component="span" sx={{ cursor: 'help', display: 'inline-flex', alignItems: 'center' }}>
      <InfoIcon fontSize="small" color="action" />
    </Box>
  </Tooltip>
);

export default InlineTooltip; 