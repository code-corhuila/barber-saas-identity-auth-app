import { FormEvent, useEffect, useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import { confirmEmail, resendCode } from '../auth/auth-api';
import { isApiError, type AuthResponse, type ApiClient } from '../shell-contract';
import { Field } from './Field';

interface VerifyEmailPageProps {
  api: ApiClient;
  email: string;
  onSignedIn(auth: AuthResponse): void;
  onBack(): void;
}

const RESEND_WAIT_SECONDS = 60;

/** The 6-digit code e-mailed at sign-up (ADR-018): confirming it verifies the account and signs it in. */
export function VerifyEmailPage({ api, email, onSignedIn, onBack }: VerifyEmailPageProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [wait, setWait] = useState(RESEND_WAIT_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFailure(null);
    setNotice(null);
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Escribe los 6 dígitos del código');
      return;
    }
    setError(undefined);
    if (pending) return;
    setPending(true);
    try {
      onSignedIn(await confirmEmail(api, email, trimmed));
    } catch (err) {
      setFailure(isApiError(err) && err.status === 422
        ? 'El código no es válido o ya venció. Revisa el correo o pide uno nuevo.'
        : isApiError(err) ? err.userMessage : 'No se pudo verificar el correo. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setFailure(null);
    try {
      await resendCode(api, email);
      setNotice('Te enviamos un código nuevo. Revisa también la carpeta de spam.');
      setWait(RESEND_WAIT_SECONDS);
    } catch (err) {
      setFailure(isApiError(err) ? err.userMessage : 'No se pudo reenviar el código.');
    }
  }

  return (
    <form className="ia-page" onSubmit={submit} noValidate>
      <div className="ia-logo" aria-hidden="true">✉️</div>
      <h1 className="ia-title">Verifica tu correo</h1>
      <p className="ia-subtitle">Te enviamos un código de 6 dígitos a <strong>{email}</strong>. Vence en 15 minutos.</p>
      <Field id="verify-code" label="Código de verificación" placeholder="123456" value={code} error={error}
             onChange={setCode} />
      {notice && <div className="ia-banner" role="status">{notice}</div>}
      {failure && <div className="ia-alert" role="alert"><span aria-hidden="true">⚠️</span>{failure}</div>}
      <IonButton className="ia-submit" expand="block" type="submit" disabled={pending}>
        {pending ? <IonSpinner name="crescent" aria-label="Verificando" /> : 'Verificar y entrar'}
      </IonButton>
      <button type="button" className="ia-link" onClick={resend} disabled={wait > 0}>
        {wait > 0 ? `Podrás pedir otro código en ${wait} s` : <>¿No te llegó? <strong>Reenviar código</strong></>}
      </button>
      <button type="button" className="ia-link" onClick={onBack}>
        Volver a <strong>iniciar sesión</strong>
      </button>
    </form>
  );
}
