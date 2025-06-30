/**
 * @fileoverview Liberation Learning Engine
 * Expands CoachAgent with educational modules for skill development
 * 
 * Executive Leadership Clause: This module maintains founder vision
 * for democratizing sports education while ensuring quality standards.
 */

import { LiberationLearningEngine } from './liberationLearning';
import { CourseManager } from './courseManager';
import { ProgressTracker } from './progressTracker';
import { EduConfig, Course, LearningPath, Assessment } from './types';

export class EduSystem {
  private learningEngine: LiberationLearningEngine;
  private courseManager: CourseManager;
  private progressTracker: ProgressTracker;

  constructor() {
    this.learningEngine = new LiberationLearningEngine();
    this.courseManager = new CourseManager();
    this.progressTracker = new ProgressTracker();
  }

  async getLearningPath(userId: string, skillLevel: string): Promise<LearningPath> {
    return this.learningEngine.generatePath(userId, skillLevel);
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    await this.courseManager.enroll(userId, courseId);
  }

  async trackProgress(userId: string, courseId: string, progress: number): Promise<void> {
    await this.progressTracker.updateProgress(userId, courseId, progress);
  }

  async getAssessments(courseId: string): Promise<Assessment[]> {
    return this.courseManager.getAssessments(courseId);
  }
}

export * from './types';
export * from './liberationLearning';
export * from './courseManager';
export * from './progressTracker'; 