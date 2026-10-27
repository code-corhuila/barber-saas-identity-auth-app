import { FormEvent, useEffect, useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import { confirmPasswordReset, requestPasswordReset } from '../auth/auth-api';
import { FieldErrors, hasErrors, validateReset, validateResetEmail } from '../auth/validation';
import { isApiError, type ApiClient } from '../shell-contract';
import { Field } from './Field';

interface ForgotPasswordPageProps {
  api: ApiClient;
  /** The e-mail typed in the login, if any. */
  initialEmail: string;
  /** The password changed: back to the login, which says so. */
  onDone(email: string): void;
  onBack(): void;
}

const RESEND_WAIT_SECONDS = 60;

/**
 * HU-AUTH-002: the 6-digit code e-mailed by notifications (15 minutes, single use) and a new password.
 * The request always succeeds (DEC-AUTH-03), so the screen never says whether the e-mail exists.
 */
export function ForgotPasswordPage({ api, initialEmail, onDone, onBack }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    const found = validateResetEmail(email);
    setErrors(found);
    setFailure(null);
    if (hasErrors(found) || pending) return;
    setPending(true);
    try {
      await requestPasswordReset(api, email);
      if (step === 'code') setNotice('Te enviamos un código nuevo. Revisa también la carpeta de spam.');
      setStep('code');
      setWait(RESEND_WAIT_SECONDS);
    } catch (err) {
      setFailure(isApiError(err) ? err.userMessage : 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  async function change(event: FormEvent) {
    event.preventDefault();
    const found = validateReset({ code, password, repeat });
    setErrors(found);
    setFailure(null);
    setNotice(null);
    if (hasErrors(found) || pending) return;
    setPending(true);
    try {
      await confirmPasswordReset(api, email, code, password);
      onDone(email.trim());
    } catch (err) {
      setFailure(isApiError(err) && err.status === 422
        ? 'El código no es válido o ya venció. Revisa el correo o pide uno nuevo.'
        : isApiError(err) ? err.userMessage : 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  const alert = failure && <div className="ia-alert" role="alert"><span aria-hidden="true">⚠️</span>{failure}</div>;
  const back = (
    <button type="button" className="ia-link" onClick={onBack}>
      Volver a <strong>iniciar sesión</strong>
    </button>
  );

  if (step === 'email') {
    return (
      <form className="ia-page" onSubmit={sendCode} noValidate>
        <div className="ia-logo" aria-hidden="true">🔑</div>
        <h1 className="ia-title">Recupera tu contraseña</h1>
        <p className="ia-subtitle">Escribe el correo de tu cuenta y te enviaremos un código de 6 dígitos.</p>
        <Field id="reset-email" label="Correo electrónico" type="email" autocomplete="email"
               placeholder="tucorreo@ejemplo.com" value={email} error={errors.email} onChange={setEmail} />
        {alert}
        <IonButton className="ia-submit" expand="block" type="submit" disabled={pending}>
          {pending ? <IonSpinner name="crescent" aria-label="Enviando" /> : 'Enviar código'}
        </IonButton>
        {back}
      </form>
    );
  }

  return (
    <form className="ia-page" onSubmit={change} noValidate>
      <div className="ia-logo" aria-hidden="true">✉️</div>
      <h1 className="ia-title">Crea una nueva contraseña</h1>
      <p className="ia-subtitle">Si <strong>{email.trim()}</strong> tiene una cuenta, le enviamos un código de 6 dígitos.
        Vence en 15 minutos.</p>
      <Field id="reset-code" label="Código" placeholder="123456" value={code} error={errors.code} onChange={setCode} />
      <Field id="reset-password" label="Nueva contraseña" type="password" autocomplete="new-password"
             placeholder="Mín. 8 caracteres, 1 mayúscula y 1 número" value={password} error={errors.password}
             onChange={setPassword} />
      <Field id="reset-repeat" label="Repite la nueva contraseña" type="password" autocomplete="new-password"
             placeholder="Repite la contraseña" value={repeat} error={errors.repeat} onChange={setRepeat} />
      {notice && <div className="ia-banner" role="status">{notice}</div>}
      {alert}
      <IonButton className="ia-submit" expand="block" type="submit" disabled={pending}>
        {pending ? <IonSpinner name="crescent" aria-label="Cambiando" /> : 'Cambiar contraseña'}
      </IonButton>
      <button type="button" className="ia-link" onClick={() => sendCode()} disabled={wait > 0 || pending}>
        {wait > 0 ? `Podrás pedir otro código en ${wait} s` : <>¿No te llegó? <strong>Reenviar código</strong></>}
      </button>
      {back}
    </form>
  );
}
