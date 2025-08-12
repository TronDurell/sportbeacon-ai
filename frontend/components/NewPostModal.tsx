import { CircularProgress, Alert, Snackbar } from '@mui/material';
import { useState } from 'react';

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

<Button onClick={handleSubmit} disabled={loading}>
  {loading ? <CircularProgress size={24} /> : 'Submit'}
</Button>

<Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
  <Alert severity="error">{error}</Alert>
</Snackbar> 