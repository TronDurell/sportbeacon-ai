import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Rating,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Star,
  SportsSoccer,
  Psychology,
  Speed,
  EmojiEvents,
} from '@mui/icons-material';
import { ScoutPlayer, PlayerStats } from '../../types/player';
import { PlayerEvaluation } from '../../types/scout';

interface PlayerRecapProps {
  player: ScoutPlayer;
  evaluation?: PlayerEvaluation;
}

interface AIRecap {
  summary: string;
  strengths: string[];
  improvements: string[];
  roleRecommendations: {
    role: string;
    confidence: number;
    reasoning: string;
  }[];
  potentialScore: number;
  keyStats: {
    stat: keyof PlayerStats;
    value: number;
    trend: 'up' | 'down' | 'stable';
    significance: string;
  }[];
}

const generateAIRecap = async (
  player: ScoutPlayer,
  evaluation?: PlayerEvaluation
): Promise<AIRecap> => {
  // This would typically be an API call to your AI service
  // For now, we'll simulate a response
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        summary: `${player.firstName} ${player.lastName} is a ${player.primaryPosition} who demonstrates exceptional technical ability and tactical awareness. Based on recent performance data and scouting evaluations, the player shows significant potential for development in high-level competitive environments.`,
        strengths: [
          'Excellent ball control and first touch',
          'Strong tactical understanding of the game',
          'High work rate and stamina',
          'Natural leadership qualities',
        ],
        improvements: [
          'Could improve aerial ability',
          'Decision making under pressure',
          'Consistency in big matches',
        ],
        roleRecommendations: [
          {
            role: 'Advanced Playmaker',
            confidence: 0.85,
            reasoning:
              'Exceptional vision and passing ability combined with technical skills',
          },
          {
            role: 'Box-to-Box Midfielder',
            confidence: 0.75,
            reasoning: 'High stamina and good all-round attributes',
          },
        ],
        potentialScore: 8.5,
        keyStats: [
          {
            stat: 'passAccuracy',
            value: player.stats.passAccuracy,
            trend: 'up',
            significance: 'Above average for position',
          },
          {
            stat: 'distanceCovered',
            value: player.stats.distanceCovered,
            trend: 'stable',
            significance: 'Consistent high performance',
          },
        ],
      });
    }, 1500);
  });
};

export const PlayerRecap: React.FC<PlayerRecapProps> = ({
  player,
  evaluation,
}) => {
  const theme = useTheme();
  const [recap, setRecap] = useState<AIRecap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecap = async () => {
      setLoading(true);
      try {
        const aiRecap = await generateAIRecap(player, evaluation);
        setRecap(aiRecap);
      } catch (error) {
        console.error('Failed to generate recap:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecap();
  }, [player, evaluation]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" height={40} />
        <Skeleton variant="rectangular" height={120} />
        <Skeleton variant="text" height={30} />
        <Skeleton variant="text" height={30} />
      </Box>
    );
  }

  if (!recap) {
    return (
      <Typography color="error">
        Failed to generate player recap. Please try again.
      </Typography>
    );
  }

  return (
    <Card role="region" aria-label="Player recap card" tabIndex={0} sx={{ outline: 'none', ':focus': { boxShadow: 3 }, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI-Generated Player Analysis
        </Typography>

        <Typography variant="body1" paragraph>
          {recap.summary}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Key Strengths
        </Typography>
        <List dense>
          {recap.strengths.map((strength, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Star color="primary" />
              </ListItemIcon>
              <ListItemText primary={strength} />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle1" gutterBottom>
          Areas for Improvement
        </Typography>
        <List dense>
          {recap.improvements.map((improvement, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <TrendingUp color="secondary" />
              </ListItemIcon>
              <ListItemText primary={improvement} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Recommended Roles
        </Typography>
        {recap.roleRecommendations.map((role, index) => (
          <Box key={index} mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <SportsSoccer color="primary" />
              <Typography variant="subtitle2">{role.role}</Typography>
              <Rating
                value={role.confidence * 5}
                readOnly
                precision={0.5}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              {role.reasoning}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" gap={1} flexWrap="wrap">
          {recap.keyStats.map((stat, index) => (
            <Chip
              key={index}
              icon={
                stat.trend === 'up' ? (
                  <TrendingUp />
                ) : stat.trend === 'down' ? (
                  <Speed />
                ) : (
                  <Psychology />
                )
              }
              label={`${stat.stat}: ${stat.value}`}
              color={stat.trend === 'up' ? 'success' : 'default'}
              variant="outlined"
            />
          ))}
        </Box>

        <Box
          mt={2}
          p={2}
          bgcolor={theme.palette.background.default}
          borderRadius={1}
        >
          <Typography variant="subtitle2" gutterBottom>
            Overall Potential Score
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <EmojiEvents color="primary" />
            <Rating
              value={recap.potentialScore / 2}
              readOnly
              precision={0.5}
              size="large"
            />
            <Typography>{recap.potentialScore.toFixed(1)} / 10</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
