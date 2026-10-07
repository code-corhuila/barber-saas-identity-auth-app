import type { ApiClient, AuthResponse } from '../shell-contract';
import { login } from './auth-api';
import { FieldErrors, validateRegister } from './validation';

/**
 * Owner sign-up runs the owner-onboarding saga of barber-saas-workflow (workflow-service.yaml):
 * it creates the barbershop in TRIAL, assigns the plan the owner picked (DEC-WF-05) and then creates
 * its owner. Messages are on-screen text.
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

/** An active plan of GET /api/v1/plans (platform-admin, public): what the owner picks at sign-up. */
export interface PublicPlan {
  id: string;
  name: string;
  priceCents: number;
  maxBarbers: number;
}

export type BarbershopErrors = Partial<Record<keyof BarbershopStep, string>>;

/** The saga in its final status (DEC-WF-02): the outcome comes in the body, not in the status code. */
export interface OwnerOnboardingSaga {
  id: string;
  status: 'RUNNING' | 'COMPLETED' | 'COMPENSATED' | 'FAILED';
  failedStep?: 'create-barbershop' | 'assign-plan' | 'create-owner';
  failureReason?: 'EMAIL_ALREADY_REGISTERED' | 'STEP_UNAVAILABLE' | 'INTERRUPTED' | 'PLAN_NOT_AVAILABLE';
  barbershopId?: string;
  userId?: string;
}

export type SignUpOutcome =
  | { kind: 'signed-in'; auth: AuthResponse }
  | { kind: 'email-taken' }
  | { kind: 'plan-unavailable' }
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

/** Active plans, cheapest first (the order of the contract); every one fits in one page. */
export async function listPlans(api: ApiClient): Promise<PublicPlan[]> {
  const page = await api.get<{ data: PublicPlan[] }>('/api/v1/plans?limit=100');
  return page.data;
}

/** Monthly price in Colombian pesos, as the prototype shows it: 9990000 cents → '$99.900/mes'. */
export function monthlyPrice(priceCents: number): string {
  return `$${(priceCents / 100).toLocaleString('es-CO', { maximumFractionDigits: 0 })}/mes`;
}

/** The barber cap of a plan, worded as platform-admin-app shows it (999 means no real cap). */
export function barberCap(maxBarbers: number): string {
  if (maxBarbers >= 999) return 'Barberos ilimitados';
  return maxBarbers === 1 ? 'Hasta 1 barbero' : `Hasta ${maxBarbers} barberos`;
}

/** The body of POST /api/v1/sagas/owner-onboarding; empty optional fields are left out. */
export function onboardingBody(owner: OwnerStep, barbershop: BarbershopStep, planId: string) {
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
    planId,
  };
}

/**
 * Runs the saga with an Idempotency-Key (a retry of the same data returns the same saga) and, when
 * it completes, signs the new owner in with the password they just chose.
 */
export async function signUpOwner(api: ApiClient, owner: OwnerStep, barbershop: BarbershopStep, planId: string,
                                  idempotencyKey: string): Promise<SignUpOutcome> {
  const saga = await api.post<OwnerOnboardingSaga>('/api/v1/sagas/owner-onboarding',
    onboardingBody(owner, barbershop, planId), { idempotencyKey });
  if (saga.status === 'COMPLETED') {
    return { kind: 'signed-in', auth: await login(api, { email: owner.email, password: owner.password }) };
  }
  if (saga.failureReason === 'EMAIL_ALREADY_REGISTERED') {
    return { kind: 'email-taken' };
  }
  if (saga.failureReason === 'PLAN_NOT_AVAILABLE') {
    return { kind: 'plan-unavailable' };
  }
  return { kind: 'failed' };
}
