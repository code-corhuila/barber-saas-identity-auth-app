import { FormEvent, useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import { login } from '../auth/auth-api';
import { FieldErrors, hasErrors, validateLogin } from '../auth/validation';
import { isApiError, type AuthResponse, type ApiClient } from '../shell-contract';
import { Field } from './Field';

interface LoginPageProps {
  api: ApiClient;
  onSignedIn(auth: AuthResponse): void;
  onRegister(): void;
}

export function LoginPage({ api, onSignedIn, onRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateLogin({ email, password });
    setErrors(found);
    setFailure(null);
    if (hasErrors(found) || pending) return;
    setPending(true);
    try {
      onSignedIn(await login(api, { email, password }));
    } catch (err) {
      setFailure(isApiError(err) ? err.userMessage : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="ia-page" onSubmit={submit} noValidate>
      <div className="ia-logo" aria-hidden="true">💈</div>
      <h1 className="ia-title">Bienvenido de vuelta</h1>
      <p className="ia-subtitle">Inicia sesión para continuar</p>
      <Field id="login-email" label="Correo electrónico" type="email" autocomplete="email"
             placeholder="tucorreo@ejemplo.com" value={email} error={errors.email} onChange={setEmail} />
      <Field id="login-password" label="Contraseña" type="password" autocomplete="current-password"
             placeholder="Tu contraseña" value={password} error={errors.password} onChange={setPassword} />
      {failure && <div className="ia-alert" role="alert"><span aria-hidden="true">⚠️</span>{failure}</div>}
      <IonButton className="ia-submit" expand="block" type="submit" disabled={pending}>
        {pending ? <IonSpinner name="crescent" aria-label="Iniciando sesión" /> : 'Iniciar sesión'}
      </IonButton>
      <button type="button" className="ia-link" onClick={onRegister}>
        ¿No tienes cuenta? <strong>Regístrate</strong>
      </button>
    </form>
  );
}
