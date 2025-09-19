import { z } from 'zod';

export class BadRequest extends Error { 
  status = 400; 
}

export const validateBody = <T extends z.ZodTypeAny>(schema: T, data: unknown) => {
  const r = schema.safeParse(data);
  if (!r.success) throw new BadRequest(r.error.flatten().formErrors.join('; '));
  return r.data as z.infer<T>;
};
