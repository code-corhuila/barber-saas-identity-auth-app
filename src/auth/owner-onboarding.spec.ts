import { describe, expect, it } from 'vitest';
import type { ApiClient } from '../shell-contract';
import { initialView } from '../App';
import {
  onboardingBody, signUpOwner, validateBarbershopStep, validateOwnerStep,
  type BarbershopStep, type OwnerOnboardingSaga, type OwnerStep,
} from './owner-onboarding';

const OWNER: OwnerStep = {
  fullName: ' Andrés Rojas ', email: ' andres@example.com ', phone: '', password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
};
const SHOP: BarbershopStep = { name: ' El Clásico ', city: 'Neiva', address: '', phone: ' +573001234567 ' };

/** Answers the saga with the given body and the login with a session; records every call. */
function fakeApi(saga: Partial<OwnerOnboardingSaga>, calls: unknown[][]): ApiClient {
  const post = (...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve((args[0] === '/api/v1/auth/login' ? { accessToken: 'token' } : saga) as never);
  };
  const unused = () => Promise.reject(new Error('not used'));
  return { get: unused, post, put: unused, patch: unused, delete: unused } as ApiClient;
}

describe('validateOwnerStep', () => {
  it('accepts a complete owner', () => {
    expect(validateOwnerStep(OWNER)).toEqual({});
  });

  it('applies the password policy and asks for the same password twice', () => {
    expect(validateOwnerStep({ ...OWNER, password: 'weak', confirmPassword: 'weak' }).password).toBeDefined();
    expect(validateOwnerStep({ ...OWNER, confirmPassword: 'SecurePass124' }).confirmPassword)
      .toBe('Las contraseñas no coinciden.');
  });
});

describe('validateBarbershopStep', () => {
  it('asks for the name and the city, and nothing else', () => {
    expect(validateBarbershopStep({ name: ' ', city: '', address: '', phone: '' })).toEqual({
      name: 'Escribe el nombre de tu barbería.', city: 'Escribe la ciudad.',
    });
  });

  it('limits the lengths of the contract', () => {
    const errors = validateBarbershopStep({ name: 'a'.repeat(121), city: 'b'.repeat(81), address: 'c'.repeat(256),
      phone: '1'.repeat(21) });
    expect(Object.keys(errors).sort()).toEqual(['address', 'city', 'name', 'phone']);
  });
});

describe('onboardingBody', () => {
  it('trims the fields and leaves the empty optional ones out', () => {
    expect(JSON.parse(JSON.stringify(onboardingBody(OWNER, SHOP)))).toEqual({
      owner: { fullName: 'Andrés Rojas', email: 'andres@example.com', password: 'SecurePass123' },
      barbershop: { name: 'El Clásico', city: 'Neiva', phone: '+573001234567' },
    });
  });

  it('never sends the confirmation', () => {
    expect(JSON.stringify(onboardingBody(OWNER, SHOP))).not.toContain('confirmPassword');
  });
});

describe('signUpOwner', () => {
  it('runs the saga with the key and signs the new owner in when it completes', async () => {
    const calls: unknown[][] = [];

    const outcome = await signUpOwner(fakeApi({ status: 'COMPLETED' }, calls), OWNER, SHOP, 'key-123456789');

    expect(calls[0][0]).toBe('/api/v1/sagas/owner-onboarding');
    expect(calls[0][2]).toEqual({ idempotencyKey: 'key-123456789' });
    expect(calls[1]).toEqual(['/api/v1/auth/login', { email: 'andres@example.com', password: 'SecurePass123' }]);
    expect(outcome.kind).toBe('signed-in');
  });

  it('reports an e-mail already registered and does not try to log in', async () => {
    const calls: unknown[][] = [];

    const outcome = await signUpOwner(fakeApi({ status: 'COMPENSATED', failedStep: 'create-owner',
      failureReason: 'EMAIL_ALREADY_REGISTERED' }, calls), OWNER, SHOP, 'key-123456789');

    expect(outcome).toEqual({ kind: 'email-taken' });
    expect(calls).toHaveLength(1);
  });

  it('reports any other ending as a failure to retry', async () => {
    const outcome = await signUpOwner(fakeApi({ status: 'FAILED', failureReason: 'STEP_UNAVAILABLE' }, []),
      OWNER, SHOP, 'key-123456789');

    expect(outcome).toEqual({ kind: 'failed' });
  });
});

describe('initialView', () => {
  it('opens the barbershop sign-up, the client sign-up or the login', () => {
    expect(initialView('/register-owner')).toBe('register-owner');
    expect(initialView('/register')).toBe('register');
    expect(initialView('/')).toBe('login');
  });
});
