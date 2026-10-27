import { useState } from 'react';
import type { AuthResponse, MountContext } from './shell-contract';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OwnerSignUpPage } from './pages/OwnerSignUpPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { STYLES } from './pages/styles';
import { returnUrl } from './auth/return-url';

type View = 'login' | 'register' | 'register-owner' | 'verify' | 'forgot';

/**
 * /register-owner opens the barbershop sign-up, /register the client sign-up, /forgot-password the
 * password reset, anything else the login.
 */
export function initialView(initialPath: string): View {
  if (initialPath.startsWith('/register-owner')) return 'register-owner';
  if (initialPath.startsWith('/forgot-password')) return 'forgot';
  return initialPath.startsWith('/register') ? 'register' : 'login';
}

export function App({ context }: { context: MountContext }) {
  const [view, setView] = useState<View>(initialView(context.initialPath));
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  function signedIn(auth: AuthResponse) {
    context.session.signIn(auth);
    context.navigate(returnUrl(window.location.search));
  }

  const toLogin = () => {
    setNotice(null);
    setView('login');
  };
  const toVerify = (address: string) => {
    setEmail(address);
    setView('verify');
  };
  const toForgot = (address: string) => {
    setEmail(address);
    setNotice(null);
    setView('forgot');
  };
  const passwordChanged = (address: string) => {
    setEmail(address);
    setNotice('Tu contraseña quedó cambiada. Inicia sesión con la nueva.');
    setView('login');
  };
  return (
    <div className="ia-root">
      <style>{STYLES}</style>
      {view === 'login' && <LoginPage api={context.api} onSignedIn={signedIn} onUnverified={toVerify}
                                      onRegister={() => setView('register')}
                                      onRegisterBarbershop={() => setView('register-owner')}
                                      onForgotPassword={toForgot} notice={notice} initialEmail={email} />}
      {view === 'register' && <RegisterPage api={context.api} onCreated={toVerify} onLogin={toLogin} />}
      {view === 'register-owner' && <OwnerSignUpPage api={context.api} onCreated={toVerify} onLogin={toLogin} />}
      {view === 'verify' && <VerifyEmailPage api={context.api} email={email} onSignedIn={signedIn}
                                             onBack={toLogin} />}
      {view === 'forgot' && <ForgotPasswordPage api={context.api} initialEmail={email} onDone={passwordChanged}
                                                onBack={toLogin} />}
    </div>
  );
}
