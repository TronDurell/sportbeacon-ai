import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSportRule, getSportStats, formatSportStat, getSportColorScheme, isTeamSport } from '../config/sportRules';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Tooltip,
  Fade,
  Zoom,
  Badge
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Refresh,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Star,
  EmojiEvents,
  Whatshot,
  Bolt
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// AR-specific animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(74, 144, 226, 0.5); }
  50% { box-shadow: 0 0 20px rgba(74, 144, 226, 0.8); }
`;

const ARContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 9999,
  overflow: 'hidden',
}));

const StatCard = styled(Card)(({ theme, sport, isHighlighted }: { theme: any; sport: string; isHighlighted?: boolean }) => {
  const colors = getSportColorScheme(sport);
  return {
    position: 'absolute',
    minWidth: 280,
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: `2px solid ${colors.primary}`,
    animation: `${float} 3s ease-in-out infinite`,
    transform: 'translateZ(0)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px) scale(1.02)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
    },
    ...(isHighlighted && {
      animation: `${pulse} 2s ease-in-out infinite, ${glow} 3s ease-in-out infinite`,
    }),
  };
});

const StatValue = styled(Typography)(({ theme, color }: { theme: any; color: string }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: color,
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  lineHeight: 1,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: '500',
}));

const ProgressBar = styled(LinearProgress)(({ theme, color }: { theme: any; color: string }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  '& .MuiLinearProgress-bar': {
    backgroundColor: color,
    borderRadius: 3,
  },
}));

interface ARStat {
  id: string;
  name: string;
  value: number;
  maxValue?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: 'primary' | 'secondary' | 'performance';
  position: { x: number; y: number };
  sport: string;
  timestamp: number;
  isHighlighted?: boolean;
}

interface ARStatOverlayProps {
  playerId?: string;
  sport: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onStatClick?: (stat: ARStat) => void;
}

const ARStatOverlay: React.FC<ARStatOverlayProps> = ({
  playerId,
  sport,
  isVisible,
  onToggleVisibility,
  onStatClick
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ARStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const animationRef = useRef<number>();
  const sportRule = getSportRule(sport);
  const sportColors = getSportColorScheme(sport);

  // Generate mock AR stats based on sport
  const generateMockStats = (): ARStat[] => {
    const primaryStats = sportRule.primaryStats;
    const secondaryStats = sportRule.secondaryStats;
    const performanceIndicators = sportRule.performanceIndicators;

    const allStats = [
      ...primaryStats.map((stat, index) => ({
        id: `primary_${stat}`,
        name: stat.replace('_', ' ').toUpperCase(),
        value: Math.floor(Math.random() * 100) + 20,
        maxValue: 100,
        unit: stat.includes('percentage') ? '%' : '',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        category: 'primary' as const,
        position: {
          x: 20 + (index * 300),
          y: 100 + (Math.random() * 200)
        },
        sport,
        timestamp: Date.now(),
        isHighlighted: Math.random() > 0.7
      })),
      ...secondaryStats.slice(0, 3).map((stat, index) => ({
        id: `secondary_${stat}`,
        name: stat.replace('_', ' ').toUpperCase(),
        value: Math.floor(Math.random() * 100),
        maxValue: 100,
        unit: stat.includes('percentage') ? '%' : '',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        category: 'secondary' as const,
        position: {
          x: 20 + (index * 300),
          y: 350 + (Math.random() * 200)
        },
        sport,
        timestamp: Date.now(),
        isHighlighted: false
      })),
      ...performanceIndicators.slice(0, 2).map((indicator, index) => ({
        id: `performance_${indicator}`,
        name: indicator.replace('_', ' ').toUpperCase(),
        value: Math.floor(Math.random() * 100) + 50,
        maxValue: 100,
        unit: '',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        category: 'performance' as const,
        position: {
          x: 20 + (index * 300),
          y: 550 + (Math.random() * 100)
        },
        sport,
        timestamp: Date.now(),
        isHighlighted: Math.random() > 0.8
      }))
    ];

    return allStats;
  };

  // Update stats periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      setStats(generateMockStats());
      setLastUpdate(new Date());
    };

    // Initial load
    updateStats();

    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [isVisible, sport]);

  // Animate stats
  useEffect(() => {
    if (!isVisible) return;

    const animate = () => {
      setStats(prevStats => 
        prevStats.map(stat => ({
          ...stat,
          position: {
            x: stat.position.x + (Math.random() - 0.5) * 2,
            y: stat.position.y + (Math.random() - 0.5) * 2
          }
        }))
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible]);

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" fontSize="small" />;
      case 'down':
        return <TrendingDown color="error" fontSize="small" />;
      case 'stable':
        return <TrendingFlat color="warning" fontSize="small" />;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'primary':
        return sportColors.primary;
      case 'secondary':
        return sportColors.secondary;
      case 'performance':
        return sportColors.accent;
      default:
        return '#666';
    }
  };

  // Format stat value
  const formatStatValue = (stat: ARStat) => {
    const formatted = formatSportStat(stat.name.toLowerCase(), stat.value, sport);
    return `${formatted}${stat.unit}`;
  };

  // Handle stat click
  const handleStatClick = (stat: ARStat) => {
    if (onStatClick) {
      onStatClick(stat);
    }
  };

  // Control panel
  const ControlPanel = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 2,
        padding: 1,
        display: 'flex',
        gap: 1,
        zIndex: 10000,
        pointerEvents: 'auto',
      }}
    >
      <Tooltip title="Toggle AR Stats">
        <IconButton
          onClick={onToggleVisibility}
          sx={{ color: 'white' }}
        >
          {isVisible ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </Tooltip>
      
      {isVisible && (
        <>
          <Tooltip title="Refresh Stats">
            <IconButton
              onClick={() => setStats(generateMockStats())}
              sx={{ color: 'white' }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Chip
            label={sportRule.displayName}
            icon={<span>{sportRule.icon}</span>}
            size="small"
            sx={{
              backgroundColor: sportColors.primary,
              color: 'white',
              fontSize: '0.75rem',
            }}
          />
        </>
      )}
    </Box>
  );

  if (!isVisible) {
    return <ControlPanel />;
  }

  // Viral highlight detection
  const viralHighlights = highlights.filter(h => h.viral_indicators.is_viral);

  // Cross-team leaderboards
  const globalLeaderboard = await fetchGlobalLeaderboard({ sortBy: 'beacon' });

  return (
    <ARContainer>
      <ControlPanel />
      
      {/* Stats overlay */}
      {stats.map((stat) => (
        <Fade key={stat.id} in={true} timeout={500}>
          <StatCard
            sport={sport}
            isHighlighted={stat.isHighlighted}
            sx={{
              left: stat.position.x,
              top: stat.position.y,
            }}
            onClick={() => handleStatClick(stat)}
          >
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <StatLabel>{stat.name}</StatLabel>
              <Box display="flex" alignItems="center" gap={0.5}>
                {getTrendIcon(stat.trend)}
                {stat.isHighlighted && (
                  <Badge badgeContent={<Star sx={{ fontSize: 12 }} />} color="warning" />
                )}
              </Box>
            </Box>

            {/* Value */}
            <StatValue color={getCategoryColor(stat.category)}>
              {formatStatValue(stat)}
            </StatValue>

            {/* Progress bar */}
            {stat.maxValue && (
              <Box mt={1}>
                <ProgressBar
                  variant="determinate"
                  value={(stat.value / stat.maxValue) * 100}
                  color="primary"
                  sx={{
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getCategoryColor(stat.category),
                    },
                  }}
                />
              </Box>
            )}

            {/* Category indicator */}
            <Box mt={1} display="flex" alignItems="center" gap={1}>
              <Chip
                label={stat.category}
                size="small"
                sx={{
                  backgroundColor: getCategoryColor(stat.category),
                  color: 'white',
                  fontSize: '0.625rem',
                  height: 20,
                }}
              />
              
              {stat.isHighlighted && (
                <Chip
                  icon={<Whatshot />}
                  label="HOT"
                  size="small"
                  color="warning"
                  sx={{ fontSize: '0.625rem', height: 20 }}
                />
              )}
            </Box>

            {/* Timestamp */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {new Date(stat.timestamp).toLocaleTimeString()}
            </Typography>
          </StatCard>
        </Fade>
      ))}

      {/* Performance summary */}
      <Zoom in={true} timeout={1000}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: 2,
            padding: 2,
            color: 'white',
            pointerEvents: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            {sportRule.icon} {sportRule.displayName} Performance
          </Typography>
          
          <Box display="flex" gap={2}>
            <Box>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                Primary Stats
              </Typography>
              <Typography variant="body2">
                {stats.filter(s => s.category === 'primary').length} active
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                Last Update
              </Typography>
              <Typography variant="body2">
                {lastUpdate.toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Zoom>

      {/* Loading indicator */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 2,
            padding: 2,
            color: 'white',
          }}
        >
          <Typography>Updating AR Stats...</Typography>
        </Box>
      )}
    </ARContainer>
  );
};

export default ARStatOverlay; 