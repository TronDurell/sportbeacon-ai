// __tests__/ai.test.ts
// TODO: Test AI prompt builders in lib/ai
import { buildDrillSuggestionPrompt } from '../lib/ai/DrillSuggestionPrompts';
import { buildWorkoutPartnerPrompt, WORKOUT_PARTNER_SYSTEM_PROMPT } from '../lib/ai/WorkoutPartnerPrompts';
import { buildFormCoachPrompt, FORM_COACH_SYSTEM_PROMPT } from '../lib/ai/FormCoachPrompts';
import { buildVoiceSummaryPrompt, VOICE_SUMMARY_SYSTEM_PROMPT } from '../lib/ai/VoiceSummaryPrompts';
import * as logger from '../lib/log/agentLogger';

describe('AI prompt builders', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'logAgentInteraction').mockImplementation(() => {});
  });

  it('should build a drill suggestion prompt', () => {
    const prompt = buildDrillSuggestionPrompt('Alex', 'shooting', 'accuracy');
    expect(prompt).toContain('Player: Alex');
    expect(prompt).toContain('Skill: shooting');
    expect(prompt).toContain('Goal: accuracy');
  });

  it('should build a workout partner prompt', () => {
    const prompt = buildWorkoutPartnerPrompt('Jamie', 'build muscle');
    expect(prompt).toContain('User: Jamie');
    expect(prompt).toContain('Goal: build muscle');
    expect(WORKOUT_PARTNER_SYSTEM_PROMPT).toContain('motivational workout partner');
    logger.logAgentInteraction(prompt, 'response');
    expect(logger.logAgentInteraction).toHaveBeenCalledWith(prompt, 'response');
  });

  it('generates a valid workout routine prompt', () => {
    const prompt = buildWorkoutPartnerPrompt('Jamie', 'target muscle groups');
    expect(prompt).toContain('target muscle groups');
  });

  it('should build a form coach prompt', () => {
    const prompt = buildFormCoachPrompt('squat', 'knees cave in');
    expect(prompt).toContain('Activity: squat');
    expect(prompt).toContain('User Description: knees cave in');
    expect(FORM_COACH_SYSTEM_PROMPT).toContain('form coach');
    logger.logAgentInteraction(prompt, 'response');
    expect(logger.logAgentInteraction).toHaveBeenCalledWith(prompt, 'response');
  });

  it('should build a voice summary prompt', () => {
    const prompt = buildVoiceSummaryPrompt('Taylor', ['running', 'jumping']);
    expect(prompt).toContain('User: Taylor');
    expect(prompt).toContain('Activities: running, jumping');
    expect(VOICE_SUMMARY_SYSTEM_PROMPT).toContain('voice-enabled sports summary assistant');
    logger.logAgentInteraction(prompt, 'response');
    expect(logger.logAgentInteraction).toHaveBeenCalledWith(prompt, 'response');
  });
});

describe('Sanity', () => {
  it('should run tests', () => {
    expect(true).toBe(true);
  });
}); 