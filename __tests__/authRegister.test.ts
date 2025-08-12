import { onCall } from 'firebase-functions/v2/https';
import { authRegister } from '../functions/src/index';
import { getFirestore } from 'firebase-admin/firestore';

jest.mock('firebase-admin/firestore');

describe('authRegister', () => {
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
    const result = await authRegister({}, context);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Invalid/);
  });

  it('should fail if email is invalid', async () => {
    const result = await authRegister({ email: 'bad' }, context);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/email/);
  });

  it('should handle Firestore errors', async () => {
    mockFirestore.set.mockRejectedValueOnce(new Error('Firestore error'));
    const result = await authRegister({ email: 'user@example.com', password: 'pass1234' }, context);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed/i);
  });

  it('should succeed with valid input', async () => {
    const result = await authRegister({ email: 'user@example.com', password: 'pass1234' }, context);
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/registered/i);
  });
}); 