import React, { useState } from 'react';
import { CircularProgress, Alert, Snackbar, Button } from '@mui/material';

interface NewPostModalProps {
  onClose: () => void;
  generateAI: () => Promise<void>;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ onClose, generateAI }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await generateAI();
      setSuccess(true);
      onClose();
    } catch (err) {
      setError('AI breakdown failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Submit'}
      </Button>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </div>
  );
};

export default NewPostModal; 