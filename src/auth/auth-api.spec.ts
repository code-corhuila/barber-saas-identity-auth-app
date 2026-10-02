import { describe, expect, it } from 'vitest';
import type { ApiClient } from '../shell-contract';
import { login, register } from './auth-api';
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
