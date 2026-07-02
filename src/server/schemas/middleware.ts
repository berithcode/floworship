import type { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return async (request: any, reply: any) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return reply.status(400).send({
        error: 'Validation failed',
        details,
      });
    }

    request.body = result.data;
  };
}