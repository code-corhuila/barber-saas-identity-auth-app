import { describe, expect, it } from 'vitest';
import type { ApiClient } from '../shell-contract';
import { initialView } from '../App';
import {
  barberCap, listPlans, monthlyPrice, onboardingBody, signUpOwner, validateBarbershopStep, validateOwnerStep,
  type BarbershopStep, type OwnerOnboardingSaga, type OwnerStep,
} from './owner-onboarding';

const OWNER: OwnerStep = {
  fullName: ' Andrés Rojas ', email: ' andres@example.com ', phone: '', password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
};
const SHOP: BarbershopStep = { name: ' El Clásico ', city: 'Neiva', address: '', phone: ' +573001234567 ' };
const PLAN = '7b0e2f4a-1c3d-4e5f-8a9b-000000000002';

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
    expect(JSON.parse(JSON.stringify(onboardingBody(OWNER, SHOP, PLAN)))).toEqual({
      owner: { fullName: 'Andrés Rojas', email: 'andres@example.com', password: 'SecurePass123' },
      barbershop: { name: 'El Clásico', city: 'Neiva', phone: '+573001234567' },
      planId: PLAN,
    });
  });

  it('never sends the confirmation', () => {
    expect(JSON.stringify(onboardingBody(OWNER, SHOP, PLAN))).not.toContain('confirmPassword');
  });
});

describe('signUpOwner', () => {
  it('runs the saga with the key and signs the new owner in when it completes', async () => {
    const calls: unknown[][] = [];

    const outcome = await signUpOwner(fakeApi({ status: 'COMPLETED' }, calls), OWNER, SHOP, PLAN, 'key-123456789');

    expect(calls[0][0]).toBe('/api/v1/sagas/owner-onboarding');
    expect(calls[0][2]).toEqual({ idempotencyKey: 'key-123456789' });
    expect(calls[1]).toEqual(['/api/v1/auth/login', { email: 'andres@example.com', password: 'SecurePass123' }]);
    expect(outcome.kind).toBe('signed-in');
  });

  it('reports an e-mail already registered and does not try to log in', async () => {
    const calls: unknown[][] = [];

    const outcome = await signUpOwner(fakeApi({ status: 'COMPENSATED', failedStep: 'create-owner',
      failureReason: 'EMAIL_ALREADY_REGISTERED' }, calls), OWNER, SHOP, PLAN, 'key-123456789');

    expect(outcome).toEqual({ kind: 'email-taken' });
    expect(calls).toHaveLength(1);
  });

  it('reports a plan retired meanwhile so another one can be picked', async () => {
    const outcome = await signUpOwner(fakeApi({ status: 'COMPENSATED', failedStep: 'assign-plan',
      failureReason: 'PLAN_NOT_AVAILABLE' }, []), OWNER, SHOP, PLAN, 'key-123456789');

    expect(outcome).toEqual({ kind: 'plan-unavailable' });
  });

  it('reports any other ending as a failure to retry', async () => {
    const outcome = await signUpOwner(fakeApi({ status: 'FAILED', failureReason: 'STEP_UNAVAILABLE' }, []),
      OWNER, SHOP, PLAN, 'key-123456789');

    expect(outcome).toEqual({ kind: 'failed' });
  });
});

describe('plans', () => {
  it('reads the active plans of the public list', async () => {
    const paths: string[] = [];
    const api = { get: (path: string) => {
      paths.push(path);
      return Promise.resolve({ data: [{ id: PLAN, name: 'Pro', priceCents: 9990000, maxBarbers: 5 }] } as never);
    } } as unknown as ApiClient;

    expect(await listPlans(api)).toEqual([{ id: PLAN, name: 'Pro', priceCents: 9990000, maxBarbers: 5 }]);
    expect(paths).toEqual(['/api/v1/plans?limit=100']);
  });

  it('words the barber cap as platform-admin-app', () => {
    expect(barberCap(1)).toBe('Hasta 1 barbero');
    expect(barberCap(6)).toBe('Hasta 6 barberos');
    expect(barberCap(999)).toBe('Barberos ilimitados');
  });

  it('shows the monthly price in pesos, as the prototype', () => {
    expect(monthlyPrice(9990000)).toBe('$99.900/mes');
    expect(monthlyPrice(17990000)).toBe('$179.900/mes');
  });
});

describe('initialView', () => {
  it('opens the barbershop sign-up, the client sign-up or the login', () => {
    expect(initialView('/register-owner')).toBe('register-owner');
    expect(initialView('/register')).toBe('register');
    expect(initialView('/')).toBe('login');
  });
});
