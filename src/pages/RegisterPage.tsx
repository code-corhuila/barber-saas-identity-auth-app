import { FormEvent, useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import { register } from '../auth/auth-api';
import { FieldErrors, hasErrors, RegisterInput, validateRegister } from '../auth/validation';
import { isApiError, type AuthResponse, type ApiClient } from '../shell-contract';
import { Field } from './Field';

interface RegisterPageProps {
  api: ApiClient;
  onSignedIn(auth: AuthResponse): void;
  onLogin(): void;
}

const EMPTY: RegisterInput = { fullName: '', email: '', password: '', phone: '' };

/** Self-registration creates a client account (DEC-AUTH-01) and signs it in. */
export function RegisterPage({ api, onSignedIn, onLogin }: RegisterPageProps) {
  const [input, setInput] = useState<RegisterInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // One key per intention: kept while the same data is retried, renewed when the data changes.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function change(field: keyof RegisterInput) {
    return (value: string) => {
      setInput((current) => ({ ...current, [field]: value }));
      setIdempotencyKey(crypto.randomUUID());
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateRegister(input);
    setErrors(found);
    setFailure(null);
    if (hasErrors(found) || pending) return;
    setPending(true);
    try {
      onSignedIn(await register(api, input, idempotencyKey));
    } catch (err) {
      setFailure(isApiError(err) ? err.userMessage : 'No se pudo crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="ia-page" onSubmit={submit} noValidate>
      <div className="ia-logo" aria-hidden="true">💈</div>
      <h1 className="ia-title">Crea tu cuenta</h1>
      <p className="ia-subtitle">Reserva tus citas en minutos</p>
      <Field id="register-name" label="Nombre completo" autocomplete="name" placeholder="Tu nombre"
             value={input.fullName} error={errors.fullName} onChange={change('fullName')} />
      <Field id="register-email" label="Correo electrónico" type="email" autocomplete="email"
             placeholder="tucorreo@ejemplo.com" value={input.email} error={errors.email} onChange={change('email')} />
      <Field id="register-password" label="Contraseña" type="password" autocomplete="new-password"
             placeholder="Mínimo 8 caracteres, una mayúscula y un número" value={input.password}
             error={errors.password} onChange={change('password')} />
      <Field id="register-phone" label="Teléfono (opcional)" type="tel" autocomplete="tel"
             placeholder="+57 300 123 4567" value={input.phone} error={errors.phone} onChange={change('phone')} />
      {failure && <div className="ia-alert" role="alert"><span aria-hidden="true">⚠️</span>{failure}</div>}
      <IonButton className="ia-submit" expand="block" type="submit" disabled={pending}>
        {pending ? <IonSpinner name="crescent" aria-label="Creando la cuenta" /> : 'Crear cuenta'}
      </IonButton>
      <button type="button" className="ia-link" onClick={onLogin}>
        ¿Ya tienes cuenta? <strong>Inicia sesión</strong>
      </button>
    </form>
  );
}
