import { UserProgress, ModuleProgress } from './types';
import { analytics } from '../ai/shared/analytics';

export class ProgressTracker {
  private progressData: Map<string, UserProgress> = new Map(); // userId-courseId -> progress

  async updateProgress(userId: string, courseId: string, progress: number): Promise<void> {
    try {
      const progressKey = `${userId}-${courseId}`;
      const currentProgress = this.progressData.get(progressKey);

      if (currentProgress) {
        currentProgress.overallProgress = progress;
        currentProgress.lastAccessed = new Date();
        this.progressData.set(progressKey, currentProgress);
      } else {
        // Create new progress entry
        const newProgress: UserProgress = {
          userId,
          courseId,
          moduleProgress: [],
          overallProgress: progress,
          timeSpent: 0,
          lastAccessed: new Date(),
          certificates: []
        };
        this.progressData.set(progressKey, newProgress);
      }

      await analytics.track('learning_progress_updated', {
        userId,
        courseId,
        progress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('progress_update_failed', {
        userId,
        courseId,
        error: error.message
      });
      throw error;
    }
  }

  async getProgress(userId: string, courseId: string): Promise<UserProgress | null> {
    const progressKey = `${userId}-${courseId}`;
    const progress = this.progressData.get(progressKey);

    if (progress) {
      await analytics.track('progress_accessed', {
        userId,
        courseId,
        progress: progress.overallProgress,
        timestamp: new Date().toISOString()
      });
    }

    return progress || null;
  }

  async updateModuleProgress(userId: string, courseId: string, moduleId: string, moduleProgress: Partial<ModuleProgress>): Promise<void> {
    try {
      const progressKey = `${userId}-${courseId}`;
      const progress = this.progressData.get(progressKey);

      if (progress) {
        let module = progress.moduleProgress.find(mp => mp.moduleId === moduleId);
        
        if (module) {
          // Update existing module progress
          Object.assign(module, moduleProgress);
        } else {
          // Create new module progress
          const newModuleProgress: ModuleProgress = {
            moduleId,
            completed: moduleProgress.completed || false,
            progress: moduleProgress.progress || 0,
            timeSpent: moduleProgress.timeSpent || 0,
            assessments: moduleProgress.assessments || []
          };
          progress.moduleProgress.push(newModuleProgress);
        }

        // Recalculate overall progress
        progress.overallProgress = this.calculateOverallProgress(progress.moduleProgress);
        progress.lastAccessed = new Date();

        this.progressData.set(progressKey, progress);

        await analytics.track('module_progress_updated', {
          userId,
          courseId,
          moduleId,
          progress: moduleProgress.progress,
          completed: moduleProgress.completed,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      await analytics.track('module_progress_update_failed', {
        userId,
        courseId,
        moduleId,
        error: error.message
      });
      throw error;
    }
  }

  private calculateOverallProgress(moduleProgress: ModuleProgress[]): number {
    if (moduleProgress.length === 0) return 0;

    const totalProgress = moduleProgress.reduce((sum, module) => sum + module.progress, 0);
    return Math.round(totalProgress / moduleProgress.length);
  }

  async getLearningAnalytics(userId: string): Promise<any> {
    const userProgresses = Array.from(this.progressData.values())
      .filter(progress => progress.userId === userId);

    const analytics = {
      totalCourses: userProgresses.length,
      completedCourses: userProgresses.filter(p => p.overallProgress >= 100).length,
      averageProgress: 0,
      totalTimeSpent: 0,
      learningStreak: 0,
      recentActivity: [] as any[]
    };

    if (userProgresses.length > 0) {
      analytics.averageProgress = userProgresses.reduce((sum, p) => sum + p.overallProgress, 0) / userProgresses.length;
      analytics.totalTimeSpent = userProgresses.reduce((sum, p) => sum + p.timeSpent, 0);
    }

    // Calculate learning streak (consecutive days with activity)
    const sortedProgresses = userProgresses
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
    
    if (sortedProgresses.length > 0) {
      analytics.learningStreak = this.calculateLearningStreak(sortedProgresses);
    }

    // Recent activity
    analytics.recentActivity = userProgresses
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
      .slice(0, 5)
      .map(p => ({
        courseId: p.courseId,
        progress: p.overallProgress,
        lastAccessed: p.lastAccessed
      }));

    return analytics;
  }

  private calculateLearningStreak(progresses: UserProgress[]): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasActivity = progresses.some(p => {
        const lastAccessed = new Date(p.lastAccessed);
        lastAccessed.setHours(0, 0, 0, 0);
        return lastAccessed.getTime() === checkDate.getTime();
      });

      if (hasActivity) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async getCourseAnalytics(courseId: string): Promise<any> {
    const courseProgresses = Array.from(this.progressData.values())
      .filter(progress => progress.courseId === courseId);

    const analytics = {
      totalEnrollments: courseProgresses.length,
      averageProgress: 0,
      completionRate: 0,
      averageTimeSpent: 0,
      progressDistribution: {
        '0-25%': 0,
        '26-50%': 0,
        '51-75%': 0,
        '76-99%': 0,
        '100%': 0
      }
    };

    if (courseProgresses.length > 0) {
      analytics.averageProgress = courseProgresses.reduce((sum, p) => sum + p.overallProgress, 0) / courseProgresses.length;
      analytics.completionRate = (courseProgresses.filter(p => p.overallProgress >= 100).length / courseProgresses.length) * 100;
      analytics.averageTimeSpent = courseProgresses.reduce((sum, p) => sum + p.timeSpent, 0) / courseProgresses.length;

      // Progress distribution
      for (const progress of courseProgresses) {
        if (progress.overallProgress <= 25) {
          analytics.progressDistribution['0-25%']++;
        } else if (progress.overallProgress <= 50) {
          analytics.progressDistribution['26-50%']++;
        } else if (progress.overallProgress <= 75) {
          analytics.progressDistribution['51-75%']++;
        } else if (progress.overallProgress < 100) {
          analytics.progressDistribution['76-99%']++;
        } else {
          analytics.progressDistribution['100%']++;
        }
      }
    }

    return analytics;
  }

  async exportProgressData(userId: string): Promise<any> {
    const userProgresses = Array.from(this.progressData.values())
      .filter(progress => progress.userId === userId);

    const exportData = {
      userId,
      exportDate: new Date().toISOString(),
      courses: userProgresses.map(progress => ({
        courseId: progress.courseId,
        overallProgress: progress.overallProgress,
        timeSpent: progress.timeSpent,
        lastAccessed: progress.lastAccessed,
        modules: progress.moduleProgress,
        certificates: progress.certificates
      }))
    };

    await analytics.track('progress_data_exported', {
      userId,
      coursesCount: userProgresses.length,
      timestamp: new Date().toISOString()
    });

    return exportData;
  }
} 