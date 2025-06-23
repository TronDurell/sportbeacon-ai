import React, { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import TipModal from './TipModal';

interface TipButtonProps {
  recipientId: string;
  recipientName: string;
  recipientType: 'coach' | 'player';
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
}

const presetAmounts = [
  { value: 1, label: '$1' },
  { value: 3, label: '$3' },
  { value: 5, label: '$5' },
];

export default function TipButton({ 
  recipientId, 
  recipientName, 
  recipientType, 
  variant = 'contained',
  size = 'medium' 
}: TipButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleTipClick = (amount?: number) => {
    if (amount) {
      setSelectedAmount(amount);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAmount(null);
  };

  return (
    <Box>
      <Button
        variant={variant}
        size={size}
        onClick={() => handleTipClick()}
        sx={{ mr: 1, mb: 1 }}
      >
        Tip {recipientName}
      </Button>
      
      {/* Quick tip buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {presetAmounts.map((amount) => (
          <Button
            key={amount.value}
            variant="outlined"
            size="small"
            onClick={() => handleTipClick(amount.value)}
            sx={{ minWidth: '60px' }}
          >
            {amount.label}
          </Button>
        ))}
      </Box>

      <TipModal
        open={isModalOpen}
        onClose={handleCloseModal}
        recipientId={recipientId}
        recipientName={recipientName}
        recipientType={recipientType}
        presetAmount={selectedAmount}
      />
    </Box>
  );
} 