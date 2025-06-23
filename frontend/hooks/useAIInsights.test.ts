import { renderHook, act } from '@testing-library/react-hooks';
import { useAIInsights } from '../hooks/useAIInsights';
import { mockPost, mockUser } from './__mocks__/mockData';
import * as firestore from 'firebase/firestore';
import * as openai from '../services/openaiClient';

jest.mock('firebase/firestore');
jest.mock('../services/openaiClient');

describe('useAIInsights', () => {
  it('returns structured summary from OpenAI', async () => {
    openai.generateAISummary.mockResolvedValue({ summary: 'AI summary' });
    firestore.getDoc.mockResolvedValueOnce({ exists: () => false });

    const { result, waitForNextUpdate } = renderHook(() =>
      useAIInsights({ post: mockPost, enableCache: false })
    );

    await waitForNextUpdate();
    expect(result.current.summary).toContain('AI summary');
  });

  it('uses Firestore cache if available', async () => {
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ summary: 'cached summary' }),
    });

    const { result } = renderHook(() =>
      useAIInsights({ post: mockPost, enableCache: true })
    );

    expect(result.current.summary).toEqual('cached summary');
  });

  it('handles OpenAI error gracefully', async () => {
    openai.generateAISummary.mockRejectedValueOnce(new Error('API failed'));
    firestore.getDoc.mockResolvedValueOnce({ exists: () => false });

    const { result, waitForNextUpdate } = renderHook(() =>
      useAIInsights({ post: mockPost })
    );

    await waitForNextUpdate();
    expect(result.current.error).toBeDefined();
  });
}); 