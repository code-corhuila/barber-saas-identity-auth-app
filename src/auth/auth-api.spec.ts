import { describe, expect, it } from 'vitest';
import type { ApiClient } from '../shell-contract';
import {
  confirmEmail, confirmPasswordReset, isUnverified, login, register, requestPasswordReset, resendCode,
} from './auth-api';
import { returnUrl } from './return-url';

function recordingApi(calls: unknown[][]): ApiClient {
  const record = (...args: unknown[]) => { calls.push(args); return Promise.resolve({} as never); };
  return { get: record, post: record, put: record, patch: record, delete: record } as ApiClient;
}

describe('auth-api', () => {
  it('logs in through the shell client with a trimmed e-mail', async () => {
    const calls: unknown[][] = [];
    await login(recordingApi(calls), { email: '  maria@example.com ', password: 'SecurePass123' });

    expect(calls[0]).toEqual(['/api/v1/auth/login', { email: 'maria@example.com', password: 'SecurePass123' }]);
  });

  it('registers with an idempotency key and leaves out an empty phone', async () => {
    const calls: unknown[][] = [];
    await register(recordingApi(calls), { fullName: ' María ', email: 'maria@example.com', password: 'SecurePass123', phone: ' ' }, 'key-123456789');

    expect(calls[0]).toEqual(['/api/v1/auth/register',
      { fullName: 'María', email: 'maria@example.com', password: 'SecurePass123' },
      { idempotencyKey: 'key-123456789' }]);
  });

  it('confirms the e-mailed code and asks for a new one', async () => {
    const calls: unknown[][] = [];
    await confirmEmail(recordingApi(calls), ' maria@example.com ', '123456');
    await resendCode(recordingApi(calls), 'maria@example.com ');

    expect(calls[0]).toEqual(['/api/v1/auth/email-verification/confirm', { email: 'maria@example.com', code: '123456' }]);
    expect(calls[1]).toEqual(['/api/v1/auth/email-verification/resend', { email: 'maria@example.com' }]);
  });

  it('asks for a reset code and sets the new password with it', async () => {
    const calls: unknown[][] = [];
    await requestPasswordReset(recordingApi(calls), ' maria@example.com ');
    await confirmPasswordReset(recordingApi(calls), 'maria@example.com', ' 123456 ', 'NewPass123');

    expect(calls[0]).toEqual(['/api/v1/auth/password-reset', { email: 'maria@example.com' }]);
    expect(calls[1]).toEqual(['/api/v1/auth/password-reset/confirm',
      { email: 'maria@example.com', code: '123456', newPassword: 'NewPass123' }]);
  });

  it('tells an unverified account from a wrong password', () => {
    const error = (status: number) => ({ status, code: 'X', message: '', details: [], traceId: 't', userMessage: 'm' });
    expect(isUnverified(error(403))).toBe(true);
    expect(isUnverified(error(401))).toBe(false);
    expect(isUnverified(new Error('network'))).toBe(false);
  });
});

describe('returnUrl', () => {
  it('goes back where the shell sent the user from', () => {
    expect(returnUrl('?returnUrl=%2Fappointments')).toBe('/appointments');
  });

  it('never leaves the app', () => {
    expect(returnUrl('?returnUrl=https://evil.example')).toBe('/');
    expect(returnUrl('?returnUrl=//evil.example')).toBe('/');
    expect(returnUrl('')).toBe('/');
  });
});
