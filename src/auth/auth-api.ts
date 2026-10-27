import { isApiError, type ApiClient, type AuthResponse, type SessionUser } from '../shell-contract';
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
export function register(api: ApiClient, input: RegisterInput, idempotencyKey: string): Promise<SessionUser> {
  const phone = input.phone.trim();
  return api.post<SessionUser>('/api/v1/auth/register', {
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    password: input.password,
    ...(phone ? { phone } : {}),
  }, { idempotencyKey });
}

/** The code e-mailed at sign-up (DEC-AUTH-09): verifies the account and signs it in, like login. */
export function confirmEmail(api: ApiClient, email: string, code: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/api/v1/auth/email-verification/confirm', { email: email.trim(), code });
}

/** Always 202: a new code only for an unverified account, at most one per minute. */
export function resendCode(api: ApiClient, email: string): Promise<void> {
  return api.post<void>('/api/v1/auth/email-verification/resend', { email: email.trim() });
}

/** Always 202 (DEC-AUTH-03): the code is e-mailed only if the account exists. */
export function requestPasswordReset(api: ApiClient, email: string): Promise<void> {
  return api.post<void>('/api/v1/auth/password-reset', { email: email.trim() });
}

/** 204 with the right code; it closes every session of the user. 422 when the code is wrong or expired. */
export function confirmPasswordReset(api: ApiClient, email: string, code: string, newPassword: string): Promise<void> {
  return api.post<void>('/api/v1/auth/password-reset/confirm', { email: email.trim(), code: code.trim(), newPassword });
}

/** Login answers 403 when the password is right but the e-mail was never verified. */
export function isUnverified(err: unknown): boolean {
  return isApiError(err) && err.status === 403;
}
