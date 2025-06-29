export interface CommunityTemplate {
  id: string;
  name: string;
  description: string;
  location: string;
  sports: Sport[];
  languages: string[];
  cultural: CulturalSettings;
  infrastructure: InfrastructureConfig;
  partnerships: Partnership[];
  aiModules: AIModuleConfig[];
  successMetrics: SuccessMetric[];
  fundingSources: FundingSource[];
}

export interface Sport {
  name: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  facilities: Facility[];
  coaches: Coach[];
  leagues: League[];
  youthPrograms: YouthProgram[];
}

export interface CulturalSettings {
  communicationStyle: 'direct' | 'indirect' | 'hierarchical';
  communityValues: string[];
  traditionalSports: string[];
  languagePreferences: string[];
  socialStructures: string[];
  economicContext: 'urban' | 'rural' | 'suburban' | 'mixed';
}

export interface InfrastructureConfig {
  venues: Venue[];
  equipment: Equipment[];
  connectivity: ConnectivityInfo;
  transportation: TransportationInfo;
  accessibility: AccessibilityInfo;
}

export interface AIModuleConfig {
  module: 'scoutEval' | 'coachAgent' | 'civicIndexer' | 'venuePredictor' | 'eventNLPBuilder' | 'suggestionEngine';
  enabled: boolean;
  priority: number;
  customizations: Record<string, any>;
  localTraining: boolean;
  dataRetention: 'local' | 'federated' | 'shared';
}

export interface SuccessMetric {
  name: string;
  description: string;
  measurement: 'count' | 'percentage' | 'score' | 'time';
  target: number;
  current: number;
  impact: 'individual' | 'community' | 'civic';
}

export interface FundingSource {
  type: 'government' | 'foundation' | 'corporate' | 'individual' | 'community';
  name: string;
  amount: number;
  duration: string;
  requirements: string[];
  status: 'active' | 'pending' | 'completed';
}

// Pre-built Community Templates

export const CARY_NC_TEMPLATE: CommunityTemplate = {
  id: 'cary-nc',
  name: 'Cary, North Carolina',
  description: 'Basketball-focused community with strong youth development programs',
  location: 'Cary, NC, USA',
  sports: [
    {
      name: 'Basketball',
      priority: 'primary',
      facilities: [
        { name: 'Cary Community Center', type: 'indoor', capacity: 200 },
        { name: 'Bond Park Courts', type: 'outdoor', capacity: 100 },
        { name: 'High School Gymnasiums', type: 'indoor', capacity: 500 }
      ],
      coaches: [
        { name: 'Coach Johnson', experience: 15, specialties: ['youth', 'fundamentals'] },
        { name: 'Coach Williams', experience: 8, specialties: ['advanced', 'competition'] }
      ],
      leagues: [
        { name: 'Cary Youth League', ageGroups: ['8-10', '11-13', '14-16'], season: 'winter' },
        { name: 'Adult Rec League', ageGroups: ['18+'], season: 'year-round' }
      ],
      youthPrograms: [
        { name: 'Skills Development', focus: 'fundamentals', ageRange: '8-16' },
        { name: 'Competition Prep', focus: 'advanced', ageRange: '14-18' }
      ]
    }
  ],
  languages: ['English'],
  cultural: {
    communicationStyle: 'direct',
    communityValues: ['excellence', 'inclusion', 'development', 'community'],
    traditionalSports: ['basketball', 'soccer', 'baseball'],
    languagePreferences: ['English'],
    socialStructures: ['family-oriented', 'education-focused'],
    economicContext: 'suburban'
  },
  infrastructure: {
    venues: [
      { name: 'Cary Community Center', type: 'multi-purpose', capacity: 500 },
      { name: 'Bond Park', type: 'outdoor', capacity: 1000 },
      { name: 'Local Schools', type: 'educational', capacity: 200 }
    ],
    equipment: [
      { name: 'Basketballs', quantity: 50, condition: 'good' },
      { name: 'Cones', quantity: 100, condition: 'good' },
      { name: 'Scoreboards', quantity: 5, condition: 'excellent' }
    ],
    connectivity: { internet: 'high-speed', mobile: 'excellent', wifi: 'available' },
    transportation: { public: 'good', parking: 'ample', accessibility: 'excellent' },
    accessibility: { wheelchair: true, hearing: true, vision: true }
  },
  partnerships: [
    { name: 'Cary Parks & Recreation', type: 'government', focus: 'facilities' },
    { name: 'Wake County Schools', type: 'education', focus: 'youth programs' },
    { name: 'Local Businesses', type: 'corporate', focus: 'sponsorship' }
  ],
  aiModules: [
    { module: 'scoutEval', enabled: true, priority: 1, customizations: { sport: 'basketball' }, localTraining: true, dataRetention: 'local' },
    { module: 'coachAgent', enabled: true, priority: 2, customizations: { focus: 'youth development' }, localTraining: true, dataRetention: 'federated' },
    { module: 'civicIndexer', enabled: true, priority: 3, customizations: { region: 'cary' }, localTraining: false, dataRetention: 'shared' },
    { module: 'venuePredictor', enabled: true, priority: 4, customizations: { sport: 'basketball' }, localTraining: true, dataRetention: 'local' },
    { module: 'eventNLPBuilder', enabled: true, priority: 5, customizations: { language: 'english' }, localTraining: true, dataRetention: 'federated' },
    { module: 'suggestionEngine', enabled: true, priority: 6, customizations: { community: 'cary' }, localTraining: true, dataRetention: 'shared' }
  ],
  successMetrics: [
    { name: 'Athletes Served', description: 'Number of athletes using ScoutEval', measurement: 'count', target: 500, current: 350, impact: 'individual' },
    { name: 'Coaches Trained', description: 'Community coaches using CoachAgent', measurement: 'count', target: 25, current: 18, impact: 'community' },
    { name: 'Events Planned', description: 'AI-assisted events organized', measurement: 'count', target: 50, current: 32, impact: 'community' },
    { name: 'Infrastructure Utilization', description: 'Venue usage optimization', measurement: 'percentage', target: 85, current: 72, impact: 'civic' }
  ],
  fundingSources: [
    { type: 'government', name: 'Cary Parks & Recreation', amount: 25000, duration: 'annual', requirements: ['youth focus', 'community access'], status: 'active' },
    { type: 'foundation', name: 'Local Sports Foundation', amount: 15000, duration: 'annual', requirements: ['measurable impact', 'sustainability'], status: 'active' },
    { type: 'corporate', name: 'Local Business Sponsors', amount: 10000, duration: 'annual', requirements: ['brand visibility', 'community engagement'], status: 'pending' }
  ]
};

export const CHICAGO_SOUTH_SIDE_TEMPLATE: CommunityTemplate = {
  id: 'chicago-south-side',
  name: 'Chicago South Side',
  description: 'Multi-sport community with focus on youth development and violence prevention',
  location: 'Chicago, IL, USA',
  sports: [
    {
      name: 'Basketball',
      priority: 'primary',
      facilities: [
        { name: 'Community Centers', type: 'indoor', capacity: 300 },
        { name: 'Park Courts', type: 'outdoor', capacity: 150 },
        { name: 'School Gyms', type: 'indoor', capacity: 400 }
      ],
      coaches: [
        { name: 'Community Coaches', experience: 10, specialties: ['youth', 'mentoring'] },
        { name: 'Former Players', experience: 5, specialties: ['advanced', 'life skills'] }
      ],
      leagues: [
        { name: 'Youth Development League', ageGroups: ['10-14', '15-18'], season: 'year-round' },
        { name: 'Community League', ageGroups: ['18+'], season: 'summer' }
      ],
      youthPrograms: [
        { name: 'Life Skills Through Sports', focus: 'holistic development', ageRange: '10-18' },
        { name: 'Mentorship Program', focus: 'guidance', ageRange: '12-18' }
      ]
    },
    {
      name: 'Soccer',
      priority: 'secondary',
      facilities: [
        { name: 'Park Fields', type: 'outdoor', capacity: 200 },
        { name: 'School Fields', type: 'outdoor', capacity: 150 }
      ],
      coaches: [
        { name: 'Soccer Coaches', experience: 8, specialties: ['youth', 'team building'] }
      ],
      leagues: [
        { name: 'Community Soccer League', ageGroups: ['8-12', '13-16'], season: 'spring/fall' }
      ],
      youthPrograms: [
        { name: 'Soccer for Peace', focus: 'community building', ageRange: '8-16' }
      ]
    }
  ],
  languages: ['English', 'Spanish'],
  cultural: {
    communicationStyle: 'direct',
    communityValues: ['resilience', 'community', 'opportunity', 'safety'],
    traditionalSports: ['basketball', 'soccer', 'baseball'],
    languagePreferences: ['English', 'Spanish'],
    socialStructures: ['community-focused', 'family-oriented'],
    economicContext: 'urban'
  },
  infrastructure: {
    venues: [
      { name: 'Community Centers', type: 'multi-purpose', capacity: 500 },
      { name: 'Public Parks', type: 'outdoor', capacity: 1000 },
      { name: 'Local Schools', type: 'educational', capacity: 300 }
    ],
    equipment: [
      { name: 'Basketballs', quantity: 100, condition: 'good' },
      { name: 'Soccer Balls', quantity: 50, condition: 'good' },
      { name: 'Cones', quantity: 200, condition: 'fair' }
    ],
    connectivity: { internet: 'variable', mobile: 'good', wifi: 'limited' },
    transportation: { public: 'good', parking: 'limited', accessibility: 'fair' },
    accessibility: { wheelchair: true, hearing: true, vision: true }
  },
  partnerships: [
    { name: 'Chicago Parks District', type: 'government', focus: 'facilities' },
    { name: 'Chicago Public Schools', type: 'education', focus: 'youth programs' },
    { name: 'Community Organizations', type: 'nonprofit', focus: 'violence prevention' },
    { name: 'Local Churches', type: 'community', focus: 'mentoring' }
  ],
  aiModules: [
    { module: 'scoutEval', enabled: true, priority: 1, customizations: { sports: ['basketball', 'soccer'] }, localTraining: true, dataRetention: 'local' },
    { module: 'coachAgent', enabled: true, priority: 1, customizations: { focus: 'violence prevention' }, localTraining: true, dataRetention: 'federated' },
    { module: 'civicIndexer', enabled: true, priority: 2, customizations: { region: 'south-side' }, localTraining: false, dataRetention: 'shared' },
    { module: 'venuePredictor', enabled: true, priority: 3, customizations: { safety: 'priority' }, localTraining: true, dataRetention: 'local' },
    { module: 'eventNLPBuilder', enabled: true, priority: 4, customizations: { languages: ['english', 'spanish'] }, localTraining: true, dataRetention: 'federated' },
    { module: 'suggestionEngine', enabled: true, priority: 5, customizations: { community: 'south-side' }, localTraining: true, dataRetention: 'shared' }
  ],
  successMetrics: [
    { name: 'Youth Served', description: 'Number of youth using the platform', measurement: 'count', target: 1000, current: 600, impact: 'individual' },
    { name: 'Violence Reduction', description: 'Reduction in youth violence incidents', measurement: 'percentage', target: 25, current: 15, impact: 'community' },
    { name: 'Community Engagement', description: 'Active community participation', measurement: 'percentage', target: 80, current: 65, impact: 'community' },
    { name: 'Economic Opportunity', description: 'Youth employment through sports', measurement: 'count', target: 50, current: 25, impact: 'civic' }
  ],
  fundingSources: [
    { type: 'government', name: 'Chicago Parks District', amount: 50000, duration: 'annual', requirements: ['youth focus', 'violence prevention'], status: 'active' },
    { type: 'foundation', name: 'Violence Prevention Foundation', amount: 30000, duration: 'annual', requirements: ['measurable impact', 'community engagement'], status: 'active' },
    { type: 'corporate', name: 'Local Businesses', amount: 20000, duration: 'annual', requirements: ['community development', 'youth opportunity'], status: 'pending' }
  ]
};

export const NAIROBI_TEMPLATE: CommunityTemplate = {
  id: 'nairobi',
  name: 'Nairobi, Kenya',
  description: 'Soccer-focused community with emphasis on talent development and international connections',
  location: 'Nairobi, Kenya',
  sports: [
    {
      name: 'Soccer',
      priority: 'primary',
      facilities: [
        { name: 'Community Fields', type: 'outdoor', capacity: 300 },
        { name: 'School Grounds', type: 'outdoor', capacity: 200 },
        { name: 'Training Centers', type: 'mixed', capacity: 150 }
      ],
      coaches: [
        { name: 'Local Coaches', experience: 12, specialties: ['youth', 'talent development'] },
        { name: 'Former Players', experience: 8, specialties: ['advanced', 'scouting'] }
      ],
      leagues: [
        { name: 'Youth Development League', ageGroups: ['8-12', '13-16', '17-19'], season: 'year-round' },
        { name: 'Community League', ageGroups: ['18+'], season: 'weekends' }
      ],
      youthPrograms: [
        { name: 'Talent Identification', focus: 'scouting', ageRange: '8-16' },
        { name: 'Life Skills Through Soccer', focus: 'holistic development', ageRange: '10-18' }
      ]
    }
  ],
  languages: ['English', 'Swahili'],
  cultural: {
    communicationStyle: 'hierarchical',
    communityValues: ['respect', 'community', 'opportunity', 'excellence'],
    traditionalSports: ['soccer', 'athletics', 'rugby'],
    languagePreferences: ['Swahili', 'English'],
    socialStructures: ['community-focused', 'respectful'],
    economicContext: 'urban'
  },
  infrastructure: {
    venues: [
      { name: 'Community Fields', type: 'outdoor', capacity: 500 },
      { name: 'Training Centers', type: 'mixed', capacity: 200 },
      { name: 'Local Schools', type: 'educational', capacity: 300 }
    ],
    equipment: [
      { name: 'Soccer Balls', quantity: 100, condition: 'good' },
      { name: 'Goals', quantity: 20, condition: 'fair' },
      { name: 'Training Equipment', quantity: 50, condition: 'good' }
    ],
    connectivity: { internet: 'variable', mobile: 'excellent', wifi: 'limited' },
    transportation: { public: 'good', parking: 'limited', accessibility: 'fair' },
    accessibility: { wheelchair: false, hearing: true, vision: true }
  },
  partnerships: [
    { name: 'Kenya Football Federation', type: 'government', focus: 'talent development' },
    { name: 'Local Schools', type: 'education', focus: 'youth programs' },
    { name: 'Community Organizations', type: 'nonprofit', focus: 'development' },
    { name: 'International Scouts', type: 'private', focus: 'talent identification' }
  ],
  aiModules: [
    { module: 'scoutEval', enabled: true, priority: 1, customizations: { sport: 'soccer' }, localTraining: true, dataRetention: 'local' },
    { module: 'coachAgent', enabled: true, priority: 2, customizations: { focus: 'talent development' }, localTraining: true, dataRetention: 'federated' },
    { module: 'civicIndexer', enabled: true, priority: 3, customizations: { region: 'nairobi' }, localTraining: false, dataRetention: 'shared' },
    { module: 'venuePredictor', enabled: true, priority: 4, customizations: { sport: 'soccer' }, localTraining: true, dataRetention: 'local' },
    { module: 'eventNLPBuilder', enabled: true, priority: 5, customizations: { languages: ['english', 'swahili'] }, localTraining: true, dataRetention: 'federated' },
    { module: 'suggestionEngine', enabled: true, priority: 6, customizations: { community: 'nairobi' }, localTraining: true, dataRetention: 'shared' }
  ],
  successMetrics: [
    { name: 'Youth Served', description: 'Number of youth using the platform', measurement: 'count', target: 2000, current: 1200, impact: 'individual' },
    { name: 'Talent Identified', description: 'Youth identified for advanced training', measurement: 'count', target: 100, current: 60, impact: 'individual' },
    { name: 'International Connections', description: 'Youth connected to international opportunities', measurement: 'count', target: 25, current: 12, impact: 'community' },
    { name: 'Community Development', description: 'Economic impact through sports', measurement: 'percentage', target: 30, current: 18, impact: 'civic' }
  ],
  fundingSources: [
    { type: 'government', name: 'Kenya Football Federation', amount: 40000, duration: 'annual', requirements: ['talent development', 'measurable impact'], status: 'active' },
    { type: 'foundation', name: 'Sports Development Foundation', amount: 25000, duration: 'annual', requirements: ['youth focus', 'sustainability'], status: 'active' },
    { type: 'corporate', name: 'Local Sponsors', amount: 15000, duration: 'annual', requirements: ['community engagement', 'talent identification'], status: 'pending' }
  ]
};

// Template Registry
export const COMMUNITY_TEMPLATES: Record<string, CommunityTemplate> = {
  'cary-nc': CARY_NC_TEMPLATE,
  'chicago-south-side': CHICAGO_SOUTH_SIDE_TEMPLATE,
  'nairobi': NAIROBI_TEMPLATE
};

// Template Management Functions
export function getTemplate(id: string): CommunityTemplate | undefined {
  return COMMUNITY_TEMPLATES[id];
}

export function listTemplates(): CommunityTemplate[] {
  return Object.values(COMMUNITY_TEMPLATES);
}

export function createCustomTemplate(baseId: string, customizations: Partial<CommunityTemplate>): CommunityTemplate {
  const baseTemplate = getTemplate(baseId);
  if (!baseTemplate) {
    throw new Error(`Template ${baseId} not found`);
  }
  
  return {
    ...baseTemplate,
    ...customizations,
    id: `${baseId}-custom-${Date.now()}`
  };
}

export function validateTemplate(template: CommunityTemplate): boolean {
  // Basic validation
  return !!(
    template.id &&
    template.name &&
    template.sports.length > 0 &&
    template.aiModules.length > 0 &&
    template.successMetrics.length > 0
  );
}

// Export types for use in other modules
export type { CommunityTemplate, Sport, CulturalSettings, InfrastructureConfig, AIModuleConfig, SuccessMetric, FundingSource }; 