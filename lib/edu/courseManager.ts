import { Course, Assessment, UserProgress, Certificate } from './types';
import { analytics } from '../ai/shared/analytics';

export class CourseManager {
  private enrollments: Map<string, string[]> = new Map(); // courseId -> userIds
  private userProgress: Map<string, UserProgress> = new Map(); // userId-courseId -> progress
  private certificates: Map<string, Certificate[]> = new Map(); // userId -> certificates

  async enroll(userId: string, courseId: string): Promise<void> {
    try {
      if (!this.enrollments.has(courseId)) {
        this.enrollments.set(courseId, []);
      }

      const enrolledUsers = this.enrollments.get(courseId)!;
      if (!enrolledUsers.includes(userId)) {
        enrolledUsers.push(userId);
      }

      // Initialize progress tracking
      const progressKey = `${userId}-${courseId}`;
      const initialProgress: UserProgress = {
        userId,
        courseId,
        moduleProgress: [],
        overallProgress: 0,
        timeSpent: 0,
        lastAccessed: new Date(),
        certificates: []
      };

      this.userProgress.set(progressKey, initialProgress);

      await analytics.track('course_enrollment', {
        userId,
        courseId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('course_enrollment_failed', {
        userId,
        courseId,
        error: error.message
      });
      throw error;
    }
  }

  async getAssessments(courseId: string): Promise<Assessment[]> {
    // Mock assessments - in real implementation, this would come from course data
    const assessments: Assessment[] = [
      {
        id: 'assessment-001',
        title: 'Coaching Fundamentals Quiz',
        type: 'quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            question: 'What is the primary role of a coach?',
            options: [
              'To win at all costs',
              'To develop athletes holistically',
              'To manage team finances',
              'To organize social events'
            ],
            correctAnswer: 'To develop athletes holistically',
            points: 10
          },
          {
            id: 'q2',
            type: 'true_false',
            question: 'Effective communication is essential for coaching success.',
            correctAnswer: 'true',
            points: 5
          },
          {
            id: 'q3',
            type: 'essay',
            question: 'Describe your approach to motivating young athletes.',
            points: 20
          }
        ],
        passingScore: 70,
        timeLimit: 60
      },
      {
        id: 'assessment-002',
        title: 'Practice Planning Assignment',
        type: 'assignment',
        questions: [
          {
            id: 'q4',
            type: 'essay',
            question: 'Create a 90-minute practice plan for a youth team.',
            points: 50
          }
        ],
        passingScore: 80
      }
    ];

    await analytics.track('assessments_accessed', {
      courseId,
      assessmentsCount: assessments.length,
      timestamp: new Date().toISOString()
    });

    return assessments;
  }

  async submitAssessment(userId: string, courseId: string, assessmentId: string, answers: any): Promise<any> {
    try {
      const assessment = (await this.getAssessments(courseId))
        .find(a => a.id === assessmentId);

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      const result = this.gradeAssessment(assessment, answers);
      await this.updateProgress(userId, courseId, assessmentId, result);

      await analytics.track('assessment_submitted', {
        userId,
        courseId,
        assessmentId,
        score: result.score,
        passed: result.passed,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      await analytics.track('assessment_submission_failed', {
        userId,
        courseId,
        assessmentId,
        error: error.message
      });
      throw error;
    }
  }

  private gradeAssessment(assessment: Assessment, answers: any): any {
    let totalScore = 0;
    let maxScore = 0;

    for (const question of assessment.questions) {
      maxScore += question.points;
      
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        if (answers[question.id] === question.correctAnswer) {
          totalScore += question.points;
        }
      } else if (question.type === 'essay') {
        // Simple scoring for essays - in real implementation, this would use AI
        const answerLength = answers[question.id]?.length || 0;
        const score = Math.min(answerLength / 100, 1) * question.points;
        totalScore += score;
      }
    }

    const percentage = (totalScore / maxScore) * 100;
    const passed = percentage >= assessment.passingScore;

    return {
      score: Math.round(percentage),
      passed,
      totalScore,
      maxScore,
      feedback: this.generateFeedback(percentage, assessment)
    };
  }

  private generateFeedback(percentage: number, assessment: Assessment): string {
    if (percentage >= 90) {
      return 'Excellent work! You have mastered this material.';
    } else if (percentage >= 80) {
      return 'Good job! You have a solid understanding of the concepts.';
    } else if (percentage >= 70) {
      return 'Satisfactory work. Consider reviewing the material for better understanding.';
    } else {
      return 'You may need additional study. Consider retaking this assessment after review.';
    }
  }

  private async updateProgress(userId: string, courseId: string, assessmentId: string, result: any): Promise<void> {
    const progressKey = `${userId}-${courseId}`;
    const progress = this.userProgress.get(progressKey);

    if (progress) {
      const moduleProgress = progress.moduleProgress.find(mp => 
        mp.assessments.some(a => a.assessmentId === assessmentId)
      );

      if (moduleProgress) {
        const assessment = moduleProgress.assessments.find(a => a.assessmentId === assessmentId);
        if (assessment) {
          assessment.score = result.score;
          assessment.passed = result.passed;
          assessment.attempts += 1;
          assessment.lastAttempt = new Date();
        } else {
          moduleProgress.assessments.push({
            assessmentId,
            score: result.score,
            passed: result.passed,
            attempts: 1,
            lastAttempt: new Date()
          });
        }
      }

      // Update overall progress
      const completedAssessments = progress.moduleProgress
        .flatMap(mp => mp.assessments)
        .filter(a => a.passed).length;
      
      const totalAssessments = progress.moduleProgress
        .flatMap(mp => mp.assessments).length;
      
      progress.overallProgress = totalAssessments > 0 ? 
        (completedAssessments / totalAssessments) * 100 : 0;

      this.userProgress.set(progressKey, progress);
    }
  }

  async generateCertificate(userId: string, courseId: string): Promise<Certificate> {
    const certificate: Certificate = {
      id: `cert-${userId}-${courseId}-${Date.now()}`,
      courseId,
      issueDate: new Date(),
      credentialUrl: `https://sportbeacon.ai/certificates/${userId}/${courseId}`,
      verificationCode: this.generateVerificationCode()
    };

    if (!this.certificates.has(userId)) {
      this.certificates.set(userId, []);
    }

    this.certificates.get(userId)!.push(certificate);

    await analytics.track('certificate_generated', {
      userId,
      courseId,
      certificateId: certificate.id,
      timestamp: new Date().toISOString()
    });

    return certificate;
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async getEnrollmentStats(): Promise<any> {
    const stats = {
      totalEnrollments: 0,
      activeCourses: 0,
      completionRate: 0,
      averageProgress: 0
    };

    for (const [courseId, users] of this.enrollments) {
      stats.totalEnrollments += users.length;
      stats.activeCourses++;
    }

    let totalProgress = 0;
    let progressCount = 0;

    for (const progress of this.userProgress.values()) {
      totalProgress += progress.overallProgress;
      progressCount++;
    }

    stats.averageProgress = progressCount > 0 ? totalProgress / progressCount : 0;

    return stats;
  }
} 