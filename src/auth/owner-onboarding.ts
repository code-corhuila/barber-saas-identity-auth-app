import type { ApiClient, AuthResponse } from '../shell-contract';
import { login } from './auth-api';
import { FieldErrors, validateRegister } from './validation';

/**
 * Owner sign-up runs the owner-onboarding saga of barber-saas-workflow (workflow-service.yaml):
 * it creates the barbershop in TRIAL and then its owner. Messages are on-screen text.
 */
export interface OwnerStep {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface BarbershopStep {
  name: string;
  city: string;
  address: string;
  phone: string;
}

export type BarbershopErrors = Partial<Record<keyof BarbershopStep, string>>;

/** The saga in its final status (DEC-WF-02): the outcome comes in the body, not in the status code. */
export interface OwnerOnboardingSaga {
  id: string;
  status: 'RUNNING' | 'COMPLETED' | 'COMPENSATED' | 'FAILED';
  failedStep?: 'create-barbershop' | 'create-owner';
  failureReason?: 'EMAIL_ALREADY_REGISTERED' | 'STEP_UNAVAILABLE' | 'INTERRUPTED';
  barbershopId?: string;
  userId?: string;
}

export type SignUpOutcome =
  | { kind: 'signed-in'; auth: AuthResponse }
  | { kind: 'email-taken' }
  | { kind: 'failed' };

/** Same rules as the client sign-up, which are those of the contract, plus the confirmation. */
export function validateOwnerStep(input: OwnerStep): FieldErrors & { confirmPassword?: string } {
  const errors: FieldErrors & { confirmPassword?: string } = validateRegister(input);
  if (!errors.password && input.confirmPassword !== input.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }
  return errors;
}

export function validateBarbershopStep(input: BarbershopStep): BarbershopErrors {
  const errors: BarbershopErrors = {};
  const name = input.name.trim();
  const city = input.city.trim();
  if (!name) errors.name = 'Escribe el nombre de tu barbería.';
  else if (name.length > 120) errors.name = 'El nombre tiene máximo 120 caracteres.';
  if (!city) errors.city = 'Escribe la ciudad.';
  else if (city.length > 80) errors.city = 'La ciudad tiene máximo 80 caracteres.';
  if (input.address.trim().length > 255) errors.address = 'La dirección tiene máximo 255 caracteres.';
  if (input.phone.trim().length > 20) errors.phone = 'El teléfono tiene máximo 20 caracteres.';
  return errors;
}

/** The body of POST /api/v1/sagas/owner-onboarding; empty optional fields are left out. */
export function onboardingBody(owner: OwnerStep, barbershop: BarbershopStep) {
  const optional = (value: string) => (value.trim() ? value.trim() : undefined);
  return {
    owner: {
      fullName: owner.fullName.trim(),
      email: owner.email.trim(),
      password: owner.password,
      phone: optional(owner.phone),
    },
    barbershop: {
      name: barbershop.name.trim(),
      city: barbershop.city.trim(),
      address: optional(barbershop.address),
      phone: optional(barbershop.phone),
    },
  };
}

/**
 * Runs the saga with an Idempotency-Key (a retry of the same data returns the same saga) and, when
 * it completes, signs the new owner in with the password they just chose.
 */
export async function signUpOwner(api: ApiClient, owner: OwnerStep, barbershop: BarbershopStep,
                                  idempotencyKey: string): Promise<SignUpOutcome> {
  const saga = await api.post<OwnerOnboardingSaga>('/api/v1/sagas/owner-onboarding',
    onboardingBody(owner, barbershop), { idempotencyKey });
  if (saga.status === 'COMPLETED') {
    return { kind: 'signed-in', auth: await login(api, { email: owner.email, password: owner.password }) };
  }
  if (saga.failureReason === 'EMAIL_ALREADY_REGISTERED') {
    return { kind: 'email-taken' };
  }
  return { kind: 'failed' };
}
