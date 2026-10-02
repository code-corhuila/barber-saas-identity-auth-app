import type { ApiClient, AuthResponse } from '../shell-contract';
import type { LoginInput, RegisterInput } from './validation';

/** Typed calls to auth-service.yaml, always through the shell's client. */
export function login(api: ApiClient, input: LoginInput): Promise<AuthResponse> {
  return api.post<AuthResponse>('/api/v1/auth/login', {
    email: input.email.trim(),
    password: input.password,
  });
}

/**
 * Registration is a creation, so it carries an Idempotency-Key: the caller keeps the same key while
 * it retries the same data, and a retry returns the same account instead of creating another one.
 */
export function register(api: ApiClient, input: RegisterInput, idempotencyKey: string): Promise<AuthResponse> {
  const phone = input.phone.trim();
  return api.post<AuthResponse>('/api/v1/auth/register', {
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    password: input.password,
    ...(phone ? { phone } : {}),
  }, { idempotencyKey });
}
