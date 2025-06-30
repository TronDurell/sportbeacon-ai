import { LearningPath, LearningPathCourse, Course, DifficultyLevel } from './types';
import { analytics } from '../ai/shared/analytics';

export class LiberationLearningEngine {
  private courseDatabase: Course[] = [];

  constructor() {
    this.initializeCourseDatabase();
  }

  async generatePath(userId: string, skillLevel: string): Promise<LearningPath> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const recommendedCourses = this.recommendCourses(userProfile, skillLevel);
      const learningPath = this.createLearningPath(userId, recommendedCourses);

      await analytics.track('learning_path_generated', {
        userId,
        skillLevel,
        coursesCount: learningPath.courses.length,
        estimatedDuration: learningPath.estimatedDuration,
        timestamp: new Date().toISOString()
      });

      return learningPath;
    } catch (error) {
      await analytics.track('learning_path_generation_failed', {
        userId,
        skillLevel,
        error: error.message
      });
      throw error;
    }
  }

  private async getUserProfile(userId: string): Promise<any> {
    // In a real implementation, this would fetch from Firestore
    return {
      experience: 'intermediate',
      interests: ['coaching_fundamentals', 'youth_development'],
      completedCourses: ['course-001', 'course-002'],
      learningStyle: 'visual',
      timeAvailability: 'moderate'
    };
  }

  private recommendCourses(userProfile: any, skillLevel: string): Course[] {
    const difficultyMap: Record<string, DifficultyLevel[]> = {
      'beginner': ['beginner'],
      'intermediate': ['beginner', 'intermediate'],
      'advanced': ['beginner', 'intermediate', 'advanced'],
      'expert': ['intermediate', 'advanced', 'expert']
    };

    const allowedDifficulties = difficultyMap[skillLevel] || ['beginner'];
    
    return this.courseDatabase
      .filter(course => 
        allowedDifficulties.includes(course.difficulty) &&
        !userProfile.completedCourses.includes(course.id)
      )
      .sort((a, b) => {
        // Prioritize by user interests
        const aInterestScore = userProfile.interests.includes(a.category) ? 1 : 0;
        const bInterestScore = userProfile.interests.includes(b.category) ? 1 : 0;
        
        if (aInterestScore !== bInterestScore) {
          return bInterestScore - aInterestScore;
        }
        
        // Then by difficulty progression
        const difficultyOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
        return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
      })
      .slice(0, 5); // Top 5 recommendations
  }

  private createLearningPath(userId: string, courses: Course[]): LearningPath {
    const learningPathCourses: LearningPathCourse[] = courses.map((course, index) => ({
      courseId: course.id,
      order: index + 1,
      status: 'not_started',
      progress: 0
    }));

    const estimatedDuration = courses.reduce((total, course) => total + course.duration, 0);

    return {
      userId,
      courses: learningPathCourses,
      estimatedDuration,
      currentProgress: 0,
      nextCourse: courses[0]?.id,
      recommendations: this.generateRecommendations(courses)
    };
  }

  private generateRecommendations(courses: Course[]): string[] {
    const recommendations = [];
    
    if (courses.some(c => c.category === 'coaching_fundamentals')) {
      recommendations.push('Consider taking advanced coaching courses after fundamentals');
    }
    
    if (courses.some(c => c.category === 'youth_development')) {
      recommendations.push('Explore sports psychology for better youth engagement');
    }
    
    if (courses.some(c => c.category === 'performance_analysis')) {
      recommendations.push('Learn technology integration to enhance analysis skills');
    }

    return recommendations;
  }

  private initializeCourseDatabase(): void {
    this.courseDatabase = [
      {
        id: 'course-001',
        title: 'Coaching Fundamentals',
        description: 'Master the basics of effective sports coaching',
        category: 'coaching_fundamentals',
        difficulty: 'beginner',
        duration: 20,
        modules: [],
        prerequisites: [],
        learningObjectives: [
          'Understand coaching principles',
          'Develop communication skills',
          'Learn practice planning'
        ],
        certification: true,
        price: 99
      },
      {
        id: 'course-002',
        title: 'Youth Development Strategies',
        description: 'Specialized techniques for coaching young athletes',
        category: 'youth_development',
        difficulty: 'intermediate',
        duration: 25,
        modules: [],
        prerequisites: ['course-001'],
        learningObjectives: [
          'Age-appropriate training methods',
          'Motivation techniques',
          'Safety considerations'
        ],
        certification: true,
        price: 149
      },
      {
        id: 'course-003',
        title: 'Performance Analysis',
        description: 'Data-driven approaches to athlete improvement',
        category: 'performance_analysis',
        difficulty: 'advanced',
        duration: 30,
        modules: [],
        prerequisites: ['course-001'],
        learningObjectives: [
          'Data collection methods',
          'Analysis techniques',
          'Performance metrics'
        ],
        certification: true,
        price: 199
      },
      {
        id: 'course-004',
        title: 'Sports Psychology',
        description: 'Mental training for peak performance',
        category: 'sports_psychology',
        difficulty: 'intermediate',
        duration: 22,
        modules: [],
        prerequisites: [],
        learningObjectives: [
          'Mental preparation techniques',
          'Stress management',
          'Team dynamics'
        ],
        certification: true,
        price: 129
      },
      {
        id: 'course-005',
        title: 'Technology Integration',
        description: 'Modern tools for enhanced coaching',
        category: 'technology_integration',
        difficulty: 'advanced',
        duration: 28,
        modules: [],
        prerequisites: ['course-003'],
        learningObjectives: [
          'Video analysis tools',
          'Wearable technology',
          'Digital platforms'
        ],
        certification: true,
        price: 179
      }
    ];
  }

  async adaptPath(userId: string, performanceData: any): Promise<LearningPath> {
    // Adaptive learning based on performance
    const currentPath = await this.generatePath(userId, 'intermediate');
    
    // Adjust based on performance
    if (performanceData.averageScore < 70) {
      // Add remedial courses
      currentPath.courses.unshift({
        courseId: 'remedial-001',
        order: 1,
        status: 'not_started',
        progress: 0
      });
    } else if (performanceData.averageScore > 90) {
      // Add advanced courses
      currentPath.courses.push({
        courseId: 'advanced-001',
        order: currentPath.courses.length + 1,
        status: 'not_started',
        progress: 0
      });
    }

    await analytics.track('learning_path_adapted', {
      userId,
      performanceScore: performanceData.averageScore,
      adaptations: performanceData.averageScore < 70 ? 'remedial' : 'advanced',
      timestamp: new Date().toISOString()
    });

    return currentPath;
  }
} 