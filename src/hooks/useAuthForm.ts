/**
 * Hook de formulaire d'authentification partagé Login/Register (Étape 6).
 *
 * - react-hook-form + zodResolver : validation déclarative.
 * - onSubmit appelle le authService (login ou register), puis `signIn` du
 *   contexte → l'AuthGuard redirige automatiquement vers le dashboard.
 * - Erreurs métier (DomainError) remontées sous forme de message global ;
 *   erreurs réseau/DB inattendues journalisées et affichées sobrement.
 */

import { useRef, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DomainError } from '@/core/rules/businessRules';
import { loginSchema, registerSchema } from '@/core/schemas/auth';
import type { LoginFormValues, RegisterFormValues } from '@/core/schemas/auth';
import { useAuthContext } from '@/hooks/useAuthContext';
import { authService } from '@/services';

type Mode = 'login' | 'register';

/** Champs communs aux deux modes ; `name`/`confirmPassword` optionnels au typage. */
type AuthFormValues = LoginFormValues & Partial<Pick<RegisterFormValues, 'name' | 'confirmPassword'>>;

export interface UseAuthFormResult {
  form: UseFormReturn<AuthFormValues>;
  submitting: boolean;
  globalError: string | null;
  onSubmit: () => Promise<void>;
}

export function useAuthForm(mode: Mode): UseAuthFormResult {
  const { signIn } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  // Anti double-submit pendant le re-render (le state est asynchrone).
  const busyRef = useRef(false);

  const defaultValues: AuthFormValues =
    mode === 'login'
      ? { email: '', password: '' }
      : { name: '', email: '', password: '', confirmPassword: '' };

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const onSubmit = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setGlobalError(null);

    await form.handleSubmit(async (values) => {
      try {
        const user =
          mode === 'login'
            ? await authService.login(values.email, values.password)
            : await authService.register({
                name: values.name ?? '',
                email: values.email,
                password: values.password,
              });
        await signIn(user);
      } catch (error) {
        if (error instanceof DomainError) {
          setGlobalError(error.message);
        } else {
          console.error(`[auth:${mode}]`, error);
          setGlobalError('Une erreur inattendue est survenue. Réessayez.');
        }
      }
    })();

    busyRef.current = false;
    setSubmitting(false);
  };

  return { form, submitting, globalError, onSubmit };
}
