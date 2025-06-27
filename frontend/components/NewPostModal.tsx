import { CircularProgress, Alert, Snackbar, Modal, Box } from '@mui/material';
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

return (
  <Modal open={open} onClose={onClose} aria-labelledby="new-post-title" aria-describedby="new-post-desc" aria-modal="true" role="dialog">
    <Box ref={modalRef} tabIndex={-1} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 500, bgcolor: 'background.paper', boxShadow: 24, p: 4, maxHeight: '90vh', overflow: 'auto', outline: 'none' }} role="document" aria-label="New post modal">
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Submit'}
      </Button>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  </Modal>
); 