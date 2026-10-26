import { useState } from 'react';
import type { AuthResponse, MountContext } from './shell-contract';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OwnerSignUpPage } from './pages/OwnerSignUpPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { STYLES } from './pages/styles';
import { returnUrl } from './auth/return-url';

type View = 'login' | 'register' | 'register-owner' | 'verify';

/** /register-owner opens the barbershop sign-up, /register the client sign-up, anything else the login. */
export function initialView(initialPath: string): View {
  if (initialPath.startsWith('/register-owner')) return 'register-owner';
  return initialPath.startsWith('/register') ? 'register' : 'login';
}

export function App({ context }: { context: MountContext }) {
  const [view, setView] = useState<View>(initialView(context.initialPath));
  const [email, setEmail] = useState('');

  function signedIn(auth: AuthResponse) {
    context.session.signIn(auth);
    context.navigate(returnUrl(window.location.search));
  }

  const toLogin = () => setView('login');
  const toVerify = (address: string) => {
    setEmail(address);
    setView('verify');
  };
  return (
    <div className="ia-root">
      <style>{STYLES}</style>
      {view === 'login' && <LoginPage api={context.api} onSignedIn={signedIn} onUnverified={toVerify}
                                      onRegister={() => setView('register')}
                                      onRegisterBarbershop={() => setView('register-owner')} />}
      {view === 'register' && <RegisterPage api={context.api} onCreated={toVerify} onLogin={toLogin} />}
      {view === 'register-owner' && <OwnerSignUpPage api={context.api} onCreated={toVerify} onLogin={toLogin} />}
      {view === 'verify' && <VerifyEmailPage api={context.api} email={email} onSignedIn={signedIn}
                                             onBack={toLogin} />}
    </div>
  );
}
