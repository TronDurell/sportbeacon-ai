import { EduSystem } from '../lib/edu';

describe('EduSystem', () => {
  let eduSystem: EduSystem;

  beforeEach(() => {
    eduSystem = new EduSystem();
  });

  describe('getLearningPath', () => {
    it('should generate learning path for user', async () => {
      const userId = 'test-user';
      const skillLevel = 'intermediate';
      
      const learningPath = await eduSystem.getLearningPath(userId, skillLevel);
      
      expect(learningPath).toBeDefined();
      expect(learningPath.userId).toBe(userId);
      expect(learningPath.courses).toBeDefined();
      expect(Array.isArray(learningPath.courses)).toBe(true);
      expect(learningPath.estimatedDuration).toBeGreaterThan(0);
      expect(learningPath.currentProgress).toBe(0);
    });

    it('should include recommendations in learning path', async () => {
      const userId = 'test-user';
      const skillLevel = 'beginner';
      
      const learningPath = await eduSystem.getLearningPath(userId, skillLevel);
      
      expect(learningPath.recommendations).toBeDefined();
      expect(Array.isArray(learningPath.recommendations)).toBe(true);
    });
  });

  describe('enrollInCourse', () => {
    it('should enroll user in course', async () => {
      const userId = 'test-user';
      const courseId = 'course-001';
      
      await expect(eduSystem.enrollInCourse(userId, courseId))
        .resolves.not.toThrow();
    });
  });

  describe('trackProgress', () => {
    it('should track user progress', async () => {
      const userId = 'test-user';
      const courseId = 'course-001';
      const progress = 75;
      
      await expect(eduSystem.trackProgress(userId, courseId, progress))
        .resolves.not.toThrow();
    });
  });

  describe('getAssessments', () => {
    it('should return course assessments', async () => {
      const courseId = 'course-001';
      
      const assessments = await eduSystem.getAssessments(courseId);
      
      expect(Array.isArray(assessments)).toBe(true);
      expect(assessments.length).toBeGreaterThan(0);
      
      const assessment = assessments[0];
      expect(assessment.id).toBeDefined();
      expect(assessment.title).toBeDefined();
      expect(assessment.type).toBeDefined();
      expect(assessment.questions).toBeDefined();
      expect(Array.isArray(assessment.questions)).toBe(true);
    });
  });
}); 