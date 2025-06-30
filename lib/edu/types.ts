export interface EduConfig {
  adaptiveLearning: boolean;
  personalizedPaths: boolean;
  assessmentFrequency: number;
  certificationEnabled: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  difficulty: DifficultyLevel;
  duration: number; // in hours
  modules: CourseModule[];
  prerequisites: string[];
  learningObjectives: string[];
  certification: boolean;
  price: number;
}

export type CourseCategory = 
  | 'coaching_fundamentals'
  | 'sports_psychology'
  | 'performance_analysis'
  | 'team_management'
  | 'youth_development'
  | 'sports_medicine'
  | 'technology_integration'
  | 'leadership_skills';

export type DifficultyLevel = 
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export interface CourseModule {
  id: string;
  title: string;
  content: ModuleContent[];
  duration: number; // in minutes
  assessments: Assessment[];
  resources: Resource[];
}

export interface ModuleContent {
  type: 'video' | 'text' | 'interactive' | 'quiz';
  title: string;
  content: string;
  duration?: number;
  order: number;
}

export interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'assignment' | 'project' | 'presentation';
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // in minutes
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'essay' | 'matching';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'tool';
  url: string;
  description: string;
}

export interface LearningPath {
  userId: string;
  courses: LearningPathCourse[];
  estimatedDuration: number;
  currentProgress: number;
  nextCourse?: string;
  recommendations: string[];
}

export interface LearningPathCourse {
  courseId: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  progress: number;
  startDate?: Date;
  completionDate?: Date;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  moduleProgress: ModuleProgress[];
  overallProgress: number;
  timeSpent: number;
  lastAccessed: Date;
  certificates: Certificate[];
}

export interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  progress: number;
  timeSpent: number;
  assessments: AssessmentResult[];
}

export interface AssessmentResult {
  assessmentId: string;
  score: number;
  passed: boolean;
  attempts: number;
  lastAttempt: Date;
}

export interface Certificate {
  id: string;
  courseId: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialUrl: string;
  verificationCode: string;
} 