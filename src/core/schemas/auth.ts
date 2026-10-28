/**
 * Schémas Zod — Authentification locale (Étape 6).
 * Partagés entre les formulaires (react-hook-form + zodResolver) et le service.
 */

import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, "L'adresse email est obligatoire.")
  .email('Adresse email invalide.');

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(72, 'Le mot de passe est trop long (72 caractères max).');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Le prénom doit contenir au moins 2 caractères.')
  .max(40, 'Le prénom est trop long (40 caractères max).');

/** Formulaire d'inscription. */
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirmation obligatoire.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

/** Formulaire de connexion. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
