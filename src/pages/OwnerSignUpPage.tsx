import { FormEvent, useEffect, useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import {
  BarbershopErrors, BarbershopStep, listPlans, monthlyPrice, OwnerStep, type PublicPlan, signUpOwner,
  validateBarbershopStep, validateOwnerStep,
} from '../auth/owner-onboarding';
import { hasErrors } from '../auth/validation';
import { isApiError, type ApiClient, type AuthResponse } from '../shell-contract';
import { Field } from './Field';

interface OwnerSignUpPageProps {
  api: ApiClient;
  onSignedIn(auth: AuthResponse): void;
  onLogin(): void;
}

type Step = 1 | 2 | 3;

const EMPTY_OWNER: OwnerStep = { fullName: '', email: '', phone: '', password: '', confirmPassword: '' };
const EMPTY_SHOP: BarbershopStep = { name: '', city: '', address: '', phone: '' };
const LABELS = ['Tu cuenta', 'Tu barbería', 'Tu plan'];

/**
 * The prototype's three-step owner wizard (register-owner step1..3). Nothing is sent until the
 * last step, where the owner picks one of the active plans and the owner-onboarding saga runs (DEC-WF-05).
 */
export function OwnerSignUpPage({ api, onSignedIn, onLogin }: OwnerSignUpPageProps) {
  const [step, setStep] = useState<Step>(1);
  const [owner, setOwner] = useState<OwnerStep>(EMPTY_OWNER);
  const [shop, setShop] = useState<BarbershopStep>(EMPTY_SHOP);
  const [ownerErrors, setOwnerErrors] = useState<ReturnType<typeof validateOwnerStep>>({});
  const [shopErrors, setShopErrors] = useState<BarbershopErrors>({});
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planLoads, setPlanLoads] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // One key per intention: kept while the same data is retried, renewed when the data changes or a
  // saga has ended without an owner (a new try is a new saga).
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  // The plans are read when the owner reaches the last step, and again after a plan was retired.
  useEffect(() => {
    if (step !== 3 || plans !== null) return;
    let current = true;
    listPlans(api)
      .then((found) => { if (current) setPlans(found); })
      .catch(() => {
        if (current) setFailure('No pudimos cargar los planes. Inténtalo de nuevo.');
      });
    return () => { current = false; };
  }, [api, step, plans, planLoads]);

  function choosePlan(id: string) {
    setPlanId(id);
    setFailure(null);
    setIdempotencyKey(crypto.randomUUID());
  }

  function changeOwner(field: keyof OwnerStep) {
    return (value: string) => {
      setOwner((current) => ({ ...current, [field]: value }));
      setIdempotencyKey(crypto.randomUUID());
    };
  }

  function changeShop(field: keyof BarbershopStep) {
    return (value: string) => {
      setShop((current) => ({ ...current, [field]: value }));
      setIdempotencyKey(crypto.randomUUID());
    };
  }

  function next(event: FormEvent) {
    event.preventDefault();
    setFailure(null);
    if (step === 1) {
      const found = validateOwnerStep(owner);
      setOwnerErrors(found);
      if (!hasErrors(found)) setStep(2);
    } else if (step === 2) {
      const found = validateBarbershopStep(shop);
      setShopErrors(found);
      if (!hasErrors(found)) setStep(3);
    } else if (plans === null) {
      setFailure(null);
      setPlanLoads((n) => n + 1);
    } else if (!planId) {
      setFailure('Selecciona un plan para continuar');
    } else {
      void create(planId);
    }
  }

  async function create(chosen: string) {
    if (pending) return;
    setPending(true);
    try {
      const outcome = await signUpOwner(api, owner, shop, chosen, idempotencyKey);
      if (outcome.kind === 'signed-in') {
        onSignedIn(outcome.auth);
        return;
      }
      setIdempotencyKey(crypto.randomUUID());
      if (outcome.kind === 'email-taken') {
        setOwnerErrors({ email: 'Ese correo ya está registrado. Inicia sesión o usa otro correo.' });
        setStep(1);
      } else if (outcome.kind === 'plan-unavailable') {
        setPlanId(null);
        setPlans(null);
        setFailure('Ese plan ya no está disponible. Elige otro.');
      } else {
        setFailure('No pudimos registrar tu barbería. Inténtalo de nuevo en unos minutos.');
      }
    } catch (err) {
      setFailure(isApiError(err) ? err.userMessage : 'No pudimos registrar tu barbería. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="ia-page" onSubmit={next} noValidate>
      <ol className="ia-steps" aria-label="Pasos del registro">
        {LABELS.map((label, index) => (
          <li key={label} className={index + 1 <= step ? 'ia-step ia-step-on' : 'ia-step'}
              aria-current={index + 1 === step ? 'step' : undefined}>
            <span className="ia-step-dot">{index + 1 < step ? '✓' : index + 1}</span>{label}
          </li>
        ))}
      </ol>

      {step === 1 && <>
        <h1 className="ia-title">Tu cuenta</h1>
        <p className="ia-subtitle">Serás el administrador de tu barbería</p>
        <Field id="owner-name" label="Nombre completo" autocomplete="name" placeholder="Tu nombre"
               value={owner.fullName} error={ownerErrors.fullName} onChange={changeOwner('fullName')} />
        <Field id="owner-email" label="Correo electrónico" type="email" autocomplete="email"
               placeholder="tucorreo@ejemplo.com" value={owner.email} error={ownerErrors.email}
               onChange={changeOwner('email')} />
        <Field id="owner-phone" label="Teléfono (opcional)" type="tel" autocomplete="tel"
               placeholder="+57 300 123 4567" value={owner.phone} error={ownerErrors.phone}
               onChange={changeOwner('phone')} />
        <Field id="owner-password" label="Contraseña" type="password" autocomplete="new-password"
               placeholder="Mín. 8 caracteres, 1 mayúscula y 1 número" value={owner.password}
               error={ownerErrors.password} onChange={changeOwner('password')} />
        <Field id="owner-confirm" label="Confirmar contraseña" type="password" autocomplete="new-password"
               placeholder="Repite la contraseña" value={owner.confirmPassword}
               error={ownerErrors.confirmPassword} onChange={changeOwner('confirmPassword')} />
      </>}

      {step === 2 && <>
        <h1 className="ia-title">Tu barbería</h1>
        <p className="ia-subtitle">Cuéntanos sobre tu negocio</p>
        <Field id="shop-name" label="Nombre del negocio" placeholder="El Clásico Barbershop"
               value={shop.name} error={shopErrors.name} onChange={changeShop('name')} />
        <Field id="shop-city" label="Ciudad" placeholder="Neiva" value={shop.city} error={shopErrors.city}
               onChange={changeShop('city')} />
        <Field id="shop-address" label="Dirección (opcional)" placeholder="Calle 10 # 5-20"
               value={shop.address} error={shopErrors.address} onChange={changeShop('address')} />
        <Field id="shop-phone" label="Teléfono de la barbería (opcional)" type="tel" placeholder="+57 300 123 4567"
               value={shop.phone} error={shopErrors.phone} onChange={changeShop('phone')} />
      </>}

      {step === 3 && <>
        <h1 className="ia-title">Elige tu plan</h1>
        <p className="ia-subtitle">
          Los primeros 2 meses son completamente gratis. Después, se cobrará la mensualidad del plan que elijas.
        </p>
        {plans === null && !failure && <IonSpinner name="crescent" aria-label="Cargando planes" />}
        {plans !== null && <div className="ia-plans" role="radiogroup" aria-label="Planes">
          {plans.map((plan) => (
            <button key={plan.id} type="button" role="radio" aria-checked={planId === plan.id}
                    className={planId === plan.id ? 'ia-plan ia-plan-on' : 'ia-plan'} disabled={pending}
                    onClick={() => choosePlan(plan.id)}>
              <span className="ia-plan-head">{plan.name}{planId === plan.id && <span aria-hidden="true">✓</span>}</span>
              <span className="ia-plan-price">{monthlyPrice(plan.priceCents)}</span>
              <span className="ia-plan-detail">Hasta {plan.maxBarbers} barberos</span>
            </button>
          ))}
        </div>}
        <div className="ia-banner">🎉 2 meses gratis para probar todas las funciones</div>
      </>}

      {failure && <div className="ia-alert" role="alert"><span aria-hidden="true">⚠️</span>{failure}</div>}

      <IonButton className="ia-submit" expand="block" type="submit" disabled={pending}>
        {pending ? <IonSpinner name="crescent" aria-label="Creando tu barbería" />
          : step === 3 ? (plans === null && failure ? 'Reintentar' : 'Crear mi barbería') : 'Continuar'}
      </IonButton>
      {step > 1
        ? <button type="button" className="ia-link" disabled={pending}
                  onClick={() => setStep((step - 1) as Step)}>Atrás</button>
        : <button type="button" className="ia-link" onClick={onLogin}>
            ¿Ya tienes cuenta? <strong>Inicia sesión</strong>
          </button>}
    </form>
  );
}
