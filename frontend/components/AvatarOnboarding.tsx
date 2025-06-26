import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import AvatarPreview from './AvatarPreview';
import { runOnboardingSurvey, mapAvatarPreset, OnboardingSurveyResult } from './onboardingSurvey';
// import { db } from '../lib/firebase'; // Uncomment and configure for real Firebase usage

// Simulated Lottie JSON for demo
const demoLottie = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Demo Avatar",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [180, 180] },
          nm: "Ellipse Path 1"
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.2, 0.6, 1, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          nm: "Fill 1"
        }
      ],
      ao: 0
    }
  ],
  markers: []
};

const AvatarOnboarding: React.FC = () => {
  const [survey, setSurvey] = useState<OnboardingSurveyResult | null>(null);
  const [avatarPreset, setAvatarPreset] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    runOnboardingSurvey().then(result => {
      setSurvey(result);
      setAvatarPreset(mapAvatarPreset(result));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!survey) return;
    setLoading(true);
    // await db.collection('userProfiles').doc('userId').set(survey); // Uncomment for real Firebase
    setTimeout(() => {
      setSaved(true);
      setLoading(false);
    }, 1000);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box maxWidth={400} mx="auto" mt={4} textAlign="center">
      <Typography variant="h5" mb={2}>Welcome! Let's set up your avatar</Typography>
      {avatarPreset && <AvatarPreview preset={avatarPreset} lottieJson={demoLottie} style={{ margin: '0 auto' }} />}
      {survey && (
        <Box mt={2}>
          <Typography variant="body1">Role: {survey.role}</Typography>
          <Typography variant="body1">Sport: {survey.sport}</Typography>
          <Typography variant="body1">Skill: {survey.skillLevel}</Typography>
        </Box>
      )}
      <Button variant="contained" sx={{ mt: 3 }} onClick={handleSave} disabled={loading || saved}>
        {saved ? 'Saved!' : 'Save Avatar'}
      </Button>
    </Box>
  );
};

export default AvatarOnboarding; 