import { onCall } from 'firebase-functions/v2/https';
import { voiceToken } from '../functions/src/index';
import { getFirestore } from 'firebase-admin/firestore';

jest.mock('firebase-admin/firestore');

describe('voiceToken', () => {
  let mockFirestore: jest.Mocked<ReturnType<typeof getFirestore>>;
  let context: any;

  beforeEach(() => {
    mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({ exists: false }),
    } as any;
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    context = { auth: { uid: 'testuid', token: { email: 'test@example.com' } } };
  });

  it('should fail if input is missing', async () => {
    const result = await voiceToken({}, context);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Invalid/);
  });

  it('should fail if required fields are missing', async () => {
    const result = await voiceToken({ sessionId: '' }, context);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/sessionId/);
  });

  it('should handle Firestore errors', async () => {
    mockFirestore.set.mockRejectedValueOnce(new Error('Firestore error'));
    const result = await voiceToken({ sessionId: 'abc123' }, context);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed/i);
  });

  it('should succeed with valid input', async () => {
    const result = await voiceToken({ sessionId: 'abc123' }, context);
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/token/i);
  });
}); 