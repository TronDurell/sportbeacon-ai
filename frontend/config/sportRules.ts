export interface SportRule {
  name: string;
  displayName: string;
  primaryStats: string[];
  secondaryStats: string[];
  scoringMetrics: string[];
  performanceIndicators: string[];
  drillCategories: string[];
  achievementTypes: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  icon: string;
  unitSystem: 'metric' | 'imperial' | 'mixed';
  timeFormat: 'seconds' | 'minutes' | 'periods';
  teamSize: number;
  hasPositions: boolean;
  positions?: string[];
  seasonType: 'continuous' | 'seasonal' | 'tournament';
}

export const sportRules: Record<string, SportRule> = {
  basketball: {
    name: 'basketball',
    displayName: 'Basketball',
    primaryStats: ['points', 'rebounds', 'assists', 'steals', 'blocks'],
    secondaryStats: ['field_goal_percentage', 'three_point_percentage', 'free_throw_percentage', 'turnovers'],
    scoringMetrics: ['points_per_game', 'efficiency_rating', 'plus_minus'],
    performanceIndicators: ['speed', 'agility', 'jump_height', 'endurance'],
    drillCategories: ['shooting', 'dribbling', 'defense', 'conditioning', 'team_play'],
    achievementTypes: ['scoring_milestone', 'defensive_excellence', 'playmaking', 'clutch_performance'],
    colorScheme: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      accent: '#ffd23f'
    },
    icon: '🏀',
    unitSystem: 'imperial',
    timeFormat: 'periods',
    teamSize: 5,
    hasPositions: true,
    positions: ['point_guard', 'shooting_guard', 'small_forward', 'power_forward', 'center'],
    seasonType: 'seasonal'
  },

  soccer: {
    name: 'soccer',
    displayName: 'Soccer',
    primaryStats: ['goals', 'assists', 'tackles', 'passes', 'shots'],
    secondaryStats: ['pass_accuracy', 'possession_percentage', 'distance_covered', 'fouls'],
    scoringMetrics: ['goals_per_game', 'assists_per_game', 'clean_sheets'],
    performanceIndicators: ['speed', 'stamina', 'ball_control', 'vision'],
    drillCategories: ['passing', 'shooting', 'dribbling', 'defense', 'fitness'],
    achievementTypes: ['goal_scorer', 'playmaker', 'defender', 'team_player'],
    colorScheme: {
      primary: '#2ecc71',
      secondary: '#27ae60',
      accent: '#f1c40f'
    },
    icon: '⚽',
    unitSystem: 'metric',
    timeFormat: 'minutes',
    teamSize: 11,
    hasPositions: true,
    positions: ['goalkeeper', 'defender', 'midfielder', 'forward'],
    seasonType: 'seasonal'
  },

  track: {
    name: 'track',
    displayName: 'Track & Field',
    primaryStats: ['time', 'distance', 'rank', 'personal_best'],
    secondaryStats: ['pace', 'splits', 'wind_speed', 'temperature'],
    scoringMetrics: ['time_improvement', 'rank_progression', 'season_best'],
    performanceIndicators: ['speed', 'endurance', 'technique', 'mental_focus'],
    drillCategories: ['sprinting', 'distance', 'hurdles', 'jumps', 'throws'],
    achievementTypes: ['personal_record', 'season_best', 'qualification', 'medal'],
    colorScheme: {
      primary: '#3498db',
      secondary: '#2980b9',
      accent: '#e74c3c'
    },
    icon: '🏃',
    unitSystem: 'metric',
    timeFormat: 'seconds',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'tournament'
  },

  boxing: {
    name: 'boxing',
    displayName: 'Boxing',
    primaryStats: ['rounds_won', 'strikes_landed', 'defense_rating', 'knockdowns'],
    secondaryStats: ['punch_accuracy', 'power_shots', 'blocked_shots', 'ring_generalship'],
    scoringMetrics: ['strike_ratio', 'defense_efficiency', 'round_control'],
    performanceIndicators: ['power', 'speed', 'endurance', 'technique'],
    drillCategories: ['punching', 'defense', 'footwork', 'conditioning', 'sparring'],
    achievementTypes: ['knockout', 'technical_victory', 'defensive_mastery', 'comeback'],
    colorScheme: {
      primary: '#e74c3c',
      secondary: '#c0392b',
      accent: '#f39c12'
    },
    icon: '🥊',
    unitSystem: 'imperial',
    timeFormat: 'periods',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'tournament'
  },

  tennis: {
    name: 'tennis',
    displayName: 'Tennis',
    primaryStats: ['aces', 'double_faults', 'win_ratio', 'break_points'],
    secondaryStats: ['first_serve_percentage', 'unforced_errors', 'net_points', 'baseline_points'],
    scoringMetrics: ['service_games_won', 'return_games_won', 'tiebreak_record'],
    performanceIndicators: ['serve_speed', 'accuracy', 'endurance', 'mental_strength'],
    drillCategories: ['serving', 'groundstrokes', 'volleys', 'footwork', 'match_play'],
    achievementTypes: ['ace_leader', 'clutch_player', 'consistency', 'comeback_king'],
    colorScheme: {
      primary: '#9b59b6',
      secondary: '#8e44ad',
      accent: '#2ecc71'
    },
    icon: '🎾',
    unitSystem: 'imperial',
    timeFormat: 'periods',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'tournament'
  },

  mma: {
    name: 'mma',
    displayName: 'Mixed Martial Arts',
    primaryStats: ['strikes_landed', 'takedowns', 'submission_attempts', 'control_time'],
    secondaryStats: ['strike_accuracy', 'takedown_accuracy', 'guard_passes', 'significant_strikes'],
    scoringMetrics: ['fight_control', 'damage_dealt', 'octagon_control'],
    performanceIndicators: ['power', 'speed', 'endurance', 'technique', 'fight_iq'],
    drillCategories: ['striking', 'grappling', 'wrestling', 'conditioning', 'sparring'],
    achievementTypes: ['knockout', 'submission', 'decision_victory', 'fight_bonus'],
    colorScheme: {
      primary: '#34495e',
      secondary: '#2c3e50',
      accent: '#e67e22'
    },
    icon: '🥋',
    unitSystem: 'imperial',
    timeFormat: 'periods',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'tournament'
  },

  swimming: {
    name: 'swimming',
    displayName: 'Swimming',
    primaryStats: ['time', 'distance', 'rank', 'personal_best'],
    secondaryStats: ['splits', 'stroke_rate', 'turn_time', 'underwater_time'],
    scoringMetrics: ['time_improvement', 'rank_progression', 'season_best'],
    performanceIndicators: ['speed', 'endurance', 'technique', 'breathing'],
    drillCategories: ['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'individual_medley'],
    achievementTypes: ['personal_record', 'qualification', 'medal', 'relay_contribution'],
    colorScheme: {
      primary: '#00bcd4',
      secondary: '#0097a7',
      accent: '#ff9800'
    },
    icon: '🏊',
    unitSystem: 'metric',
    timeFormat: 'seconds',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'tournament'
  },

  volleyball: {
    name: 'volleyball',
    displayName: 'Volleyball',
    primaryStats: ['kills', 'assists', 'blocks', 'digs', 'aces'],
    secondaryStats: ['attack_percentage', 'serve_percentage', 'pass_rating', 'set_assists'],
    scoringMetrics: ['points_per_set', 'efficiency_rating', 'plus_minus'],
    performanceIndicators: ['jump_height', 'speed', 'reaction_time', 'team_chemistry'],
    drillCategories: ['serving', 'passing', 'setting', 'attacking', 'blocking'],
    achievementTypes: ['ace_leader', 'block_leader', 'clutch_player', 'team_player'],
    colorScheme: {
      primary: '#ff5722',
      secondary: '#e64a19',
      accent: '#4caf50'
    },
    icon: '🏐',
    unitSystem: 'imperial',
    timeFormat: 'periods',
    teamSize: 6,
    hasPositions: true,
    positions: ['setter', 'outside_hitter', 'middle_blocker', 'opposite_hitter', 'libero'],
    seasonType: 'seasonal'
  },

  baseball: {
    name: 'baseball',
    displayName: 'Baseball',
    primaryStats: ['batting_average', 'home_runs', 'rbis', 'stolen_bases', 'era'],
    secondaryStats: ['on_base_percentage', 'slugging_percentage', 'wins', 'strikeouts'],
    scoringMetrics: ['ops', 'whip', 'war', 'saves'],
    performanceIndicators: ['bat_speed', 'throwing_velocity', 'fielding_range', 'base_running'],
    drillCategories: ['hitting', 'pitching', 'fielding', 'base_running', 'conditioning'],
    achievementTypes: ['home_run_leader', 'pitching_mastery', 'defensive_excellence', 'clutch_performance'],
    colorScheme: {
      primary: '#795548',
      secondary: '#5d4037',
      accent: '#ffc107'
    },
    icon: '⚾',
    unitSystem: 'imperial',
    timeFormat: 'periods',
    teamSize: 9,
    hasPositions: true,
    positions: ['pitcher', 'catcher', 'first_base', 'second_base', 'third_base', 'shortstop', 'left_field', 'center_field', 'right_field'],
    seasonType: 'seasonal'
  },

  football: {
    name: 'football',
    displayName: 'American Football',
    primaryStats: ['touchdowns', 'passing_yards', 'rushing_yards', 'tackles', 'interceptions'],
    secondaryStats: ['completion_percentage', 'yards_per_carry', 'sacks', 'field_goals'],
    scoringMetrics: ['passer_rating', 'yards_per_attempt', 'touchdown_to_interception_ratio'],
    performanceIndicators: ['speed', 'strength', 'agility', 'vision', 'leadership'],
    drillCategories: ['passing', 'rushing', 'receiving', 'blocking', 'tackling', 'kicking'],
    achievementTypes: ['touchdown_leader', 'defensive_player', 'clutch_kicker', 'team_captain'],
    colorScheme: {
      primary: '#8bc34a',
      secondary: '#689f38',
      accent: '#ff5722'
    },
    icon: '🏈',
    unitSystem: 'imperial',
    timeFormat: 'periods',
    teamSize: 11,
    hasPositions: true,
    positions: ['quarterback', 'running_back', 'wide_receiver', 'tight_end', 'offensive_line', 'defensive_line', 'linebacker', 'cornerback', 'safety', 'kicker', 'punter'],
    seasonType: 'seasonal'
  },

  esports: {
    name: 'esports',
    displayName: 'eSports',
    primaryStats: ['kills', 'assists', 'deaths', 'objectives', 'damage_dealt'],
    secondaryStats: ['kill_death_ratio', 'objective_participation', 'vision_score', 'gold_earned'],
    scoringMetrics: ['kda_ratio', 'objective_control', 'team_fight_participation'],
    performanceIndicators: ['reaction_time', 'decision_making', 'mechanical_skill', 'team_coordination'],
    drillCategories: ['mechanics', 'strategy', 'team_fighting', 'objective_control', 'vision_control'],
    achievementTypes: ['mvp_performance', 'clutch_play', 'team_captain', 'mechanical_mastery'],
    colorScheme: {
      primary: '#9c27b0',
      secondary: '#673ab7',
      accent: '#e91e63'
    },
    icon: '🎮',
    unitSystem: 'mixed',
    timeFormat: 'minutes',
    teamSize: 5,
    hasPositions: true,
    positions: ['top', 'jungle', 'mid', 'adc', 'support'],
    seasonType: 'seasonal'
  },

  adaptive_sports: {
    name: 'adaptive_sports',
    displayName: 'Adaptive Sports',
    primaryStats: ['participation_time', 'skill_level', 'adaptation_score', 'independence_level'],
    secondaryStats: ['assistance_required', 'equipment_usage', 'environmental_adaptation'],
    scoringMetrics: ['independence_ratio', 'skill_progression', 'participation_rate'],
    performanceIndicators: ['mobility', 'coordination', 'confidence', 'social_interaction'],
    drillCategories: ['mobility_training', 'skill_development', 'equipment_mastery', 'social_skills'],
    achievementTypes: ['independence_milestone', 'skill_breakthrough', 'social_achievement'],
    colorScheme: {
      primary: '#4caf50',
      secondary: '#8bc34a',
      accent: '#ff9800'
    },
    icon: '♿',
    unitSystem: 'metric',
    timeFormat: 'minutes',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'continuous'
  },

  training_camp: {
    name: 'training_camp',
    displayName: 'Training Camp',
    primaryStats: ['attendance_rate', 'skill_improvement', 'fitness_level', 'coach_rating'],
    secondaryStats: ['peer_evaluation', 'self_assessment', 'goal_achievement'],
    scoringMetrics: ['overall_progress', 'camp_performance', 'skill_gain'],
    performanceIndicators: ['work_ethic', 'learning_ability', 'teamwork', 'leadership'],
    drillCategories: ['skill_development', 'fitness_training', 'team_building', 'mental_toughness'],
    achievementTypes: ['perfect_attendance', 'most_improved', 'team_leader', 'camp_mvp'],
    colorScheme: {
      primary: '#ff5722',
      secondary: '#ff7043',
      accent: '#ffc107'
    },
    icon: '🏕️',
    unitSystem: 'mixed',
    timeFormat: 'days',
    teamSize: 20,
    hasPositions: false,
    seasonType: 'tournament'
  },

  crossfit: {
    name: 'crossfit',
    displayName: 'CrossFit',
    primaryStats: ['workout_time', 'reps_completed', 'weight_lifted', 'rounds_finished'],
    secondaryStats: ['intensity_score', 'recovery_rate', 'scaling_level'],
    scoringMetrics: ['workout_score', 'relative_intensity', 'progression_rate'],
    performanceIndicators: ['strength', 'endurance', 'flexibility', 'coordination'],
    drillCategories: ['strength_training', 'cardio', 'gymnastics', 'olympic_lifting'],
    achievementTypes: ['pr_achievement', 'workout_completion', 'scaling_progress'],
    colorScheme: {
      primary: '#d32f2f',
      secondary: '#f44336',
      accent: '#ff5722'
    },
    icon: '💪',
    unitSystem: 'imperial',
    timeFormat: 'minutes',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'continuous'
  },

  yoga_wellness: {
    name: 'yoga_wellness',
    displayName: 'Yoga & Wellness',
    primaryStats: ['session_duration', 'pose_hold_time', 'breathing_cycles', 'meditation_minutes'],
    secondaryStats: ['flexibility_score', 'balance_improvement', 'stress_reduction'],
    scoringMetrics: ['wellness_index', 'mindfulness_score', 'recovery_rate'],
    performanceIndicators: ['flexibility', 'balance', 'breathing', 'mental_clarity'],
    drillCategories: ['asanas', 'pranayama', 'meditation', 'mindfulness'],
    achievementTypes: ['pose_mastery', 'meditation_streak', 'wellness_milestone'],
    colorScheme: {
      primary: '#4caf50',
      secondary: '#8bc34a',
      accent: '#9c27b0'
    },
    icon: '🧘',
    unitSystem: 'metric',
    timeFormat: 'minutes',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'continuous'
  },

  precision_shooting: {
    name: 'precision_shooting',
    displayName: 'Precision Shooting',
    primaryStats: ['accuracy', 'group_size', 'consistency', 'sight_alignment'],
    secondaryStats: ['trigger_control', 'breathing_rhythm', 'stance_stability', 'follow_through'],
    scoringMetrics: ['bullseye_hits', 'group_precision', 'distance_accuracy'],
    performanceIndicators: ['steady_hands', 'focus', 'patience', 'technique'],
    drillCategories: ['stance', 'grip', 'sight_picture', 'trigger_control', 'breathing'],
    achievementTypes: ['bullseye_master', 'consistency_king', 'distance_shooter', 'precision_expert'],
    colorScheme: {
      primary: '#8e44ad',
      secondary: '#7d3c98',
      accent: '#e74c3c'
    },
    icon: '🎯',
    unitSystem: 'imperial',
    timeFormat: 'seconds',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'continuous'
  },

  trap_skeet: {
    name: 'trap_skeet',
    displayName: 'Trap & Skeet',
    primaryStats: ['hits', 'misses', 'mounting_speed', 'swing_smoothness'],
    secondaryStats: ['lead_calculation', 'follow_through', 'mental_focus', 'confidence'],
    scoringMetrics: ['hit_percentage', 'consecutive_hits', 'station_performance'],
    performanceIndicators: ['reaction_time', 'coordination', 'timing', 'mental_strength'],
    drillCategories: ['mounting', 'swinging', 'leading', 'follow_through', 'mental_game'],
    achievementTypes: ['perfect_round', 'speed_shooter', 'mental_master', 'consistency_king'],
    colorScheme: {
      primary: '#27ae60',
      secondary: '#229954',
      accent: '#f39c12'
    },
    icon: '🔫',
    unitSystem: 'imperial',
    timeFormat: 'seconds',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'tournament'
  },

  practical_pistol: {
    name: 'practical_pistol',
    displayName: 'Practical Pistol',
    primaryStats: ['draw_speed', 'reload_speed', 'target_transitions', 'accuracy'],
    secondaryStats: ['movement_efficiency', 'stage_planning', 'recoil_control', 'sight_picture'],
    scoringMetrics: ['hit_factor', 'stage_time', 'accuracy_percentage', 'power_factor'],
    performanceIndicators: ['speed', 'accuracy', 'efficiency', 'mental_focus'],
    drillCategories: ['drawing', 'reloading', 'movement', 'target_transitions', 'stage_planning'],
    achievementTypes: ['speed_demon', 'accuracy_master', 'stage_planner', 'all_around_shooter'],
    colorScheme: {
      primary: '#e67e22',
      secondary: '#d35400',
      accent: '#3498db'
    },
    icon: '🔫',
    unitSystem: 'imperial',
    timeFormat: 'seconds',
    teamSize: 1,
    hasPositions: false,
    seasonType: 'tournament'
  }
};

// Default fallback for unknown sports
export const defaultSportRule: SportRule = {
  name: 'default',
  displayName: 'Other Sport',
  primaryStats: ['points', 'score', 'rank'],
  secondaryStats: ['performance', 'efficiency', 'accuracy'],
  scoringMetrics: ['total_score', 'average_score', 'improvement'],
  performanceIndicators: ['speed', 'strength', 'endurance', 'technique'],
  drillCategories: ['training', 'conditioning', 'skills', 'competition'],
  achievementTypes: ['milestone', 'improvement', 'excellence', 'consistency'],
  colorScheme: {
    primary: '#607d8b',
    secondary: '#455a64',
    accent: '#ff9800'
  },
  icon: '🏆',
  unitSystem: 'metric',
  timeFormat: 'seconds',
  teamSize: 1,
  hasPositions: false,
  seasonType: 'continuous'
};

// Enhanced helper functions with edge case handling
export const getSportRule = (sportName: string): SportRule => {
  if (!sportName || typeof sportName !== 'string') {
    return defaultSportRule;
  }
  
  const normalizedSport = sportName.toLowerCase().trim();
  return sportRules[normalizedSport] || defaultSportRule;
};

export const getSportStats = (sportName: string): string[] => {
  if (!sportName) return defaultSportRule.primaryStats;
  
  const rule = getSportRule(sportName);
  return [...rule.primaryStats, ...rule.secondaryStats];
};

export const getSportScoringMetrics = (sportName: string): string[] => {
  if (!sportName) return defaultSportRule.scoringMetrics;
  
  const rule = getSportRule(sportName);
  return rule.scoringMetrics;
};

export const getSportDrillCategories = (sportName: string): string[] => {
  if (!sportName) return defaultSportRule.drillCategories;
  
  const rule = getSportRule(sportName);
  return rule.drillCategories;
};

export const getSportAchievementTypes = (sportName: string): string[] => {
  if (!sportName) return defaultSportRule.achievementTypes;
  
  const rule = getSportRule(sportName);
  return rule.achievementTypes;
};

export const getSportColorScheme = (sportName: string) => {
  if (!sportName) return defaultSportRule.colorScheme;
  
  const rule = getSportRule(sportName);
  return rule.colorScheme;
};

export const getSportIcon = (sportName: string): string => {
  if (!sportName) return defaultSportRule.icon;
  
  const rule = getSportRule(sportName);
  return rule.icon;
};

export const isTeamSport = (sportName: string): boolean => {
  if (!sportName) return false;
  
  const rule = getSportRule(sportName);
  return rule.teamSize > 1;
};

export const hasPositions = (sportName: string): boolean => {
  if (!sportName) return false;
  
  const rule = getSportRule(sportName);
  return rule.hasPositions;
};

export const getSportPositions = (sportName: string): string[] => {
  if (!sportName) return [];
  
  const rule = getSportRule(sportName);
  return rule.positions || [];
};

// New utility functions for expansion
export const getSportCategories = (): string[] => {
  return Object.keys(sportRules);
};

export const getSportsByCategory = (category: 'team' | 'individual' | 'esports' | 'adaptive' | 'wellness'): string[] => {
  const categoryMap = {
    team: ['basketball', 'soccer', 'volleyball', 'baseball', 'football'],
    individual: ['track', 'boxing', 'tennis', 'mma', 'swimming'],
    esports: ['esports'],
    adaptive: ['adaptive_sports'],
    wellness: ['yoga_wellness', 'crossfit', 'training_camp']
  };
  
  return categoryMap[category] || [];
};

export const validateSportData = (data: any, sportName: string): boolean => {
  if (!data || !sportName) return false;
  
  const rule = getSportRule(sportName);
  const requiredFields = [...rule.primaryStats, ...rule.secondaryStats];
  
  return requiredFields.every(field => 
    data.hasOwnProperty(field) && 
    (typeof data[field] === 'number' || data[field] === null || data[field] === undefined)
  );
};

// Enhanced formatSportStat with null/undefined handling
export const formatSportStat = (stat: string, value: number | null | undefined, sportName: string): string => {
  // Handle null/undefined values
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  const rule = getSportRule(sportName);
  
  // Format based on stat type and sport
  if (stat.includes('percentage') || stat.includes('ratio')) {
    return `${(value * 100).toFixed(1)}%`;
  }
  
  if (stat.includes('time') || stat.includes('duration')) {
    if (rule.timeFormat === 'seconds') {
      return `${value.toFixed(2)}s`;
    } else if (rule.timeFormat === 'minutes') {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  if (stat.includes('distance')) {
    if (rule.unitSystem === 'metric') {
      return `${value.toFixed(1)}m`;
    } else {
      return `${value.toFixed(1)}ft`;
    }
  }
  
  return value.toString();
};

// Enhanced validateSportStat with edge case handling
export const validateSportStat = (stat: string, sportName: string): boolean => {
  if (!stat || !sportName) return false;
  
  const rule = getSportRule(sportName);
  return [...rule.primaryStats, ...rule.secondaryStats, ...rule.scoringMetrics].includes(stat);
}; 