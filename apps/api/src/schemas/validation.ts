import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const createSongSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().optional(),
  defaultKey: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updateSongSchema = z.object({
  title: z.string().min(1).optional(),
  artist: z.string().optional(),
  defaultKey: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(['rascunho', 'pronta', 'arquivada']).optional(),
});

export const cueBlockSchema = z.object({
  label: z.string().min(1),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(0),
  chordproContent: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const createCueSheetSchema = z.object({
  referenceTrackUrl: z.string().url().optional(),
  totalDurationSeconds: z.number().min(0).optional(),
  blocks: z.array(cueBlockSchema).optional(),
});

export const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'operator', 'musician']).optional(),
  ministryId: z.string().optional(),
});

export const createScheduleSchema = z.object({
  date: z.string().or(z.date()),
});

export const assignMusicianSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});