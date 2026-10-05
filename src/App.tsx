import { useState } from 'react';
import type { AuthResponse, MountContext } from './shell-contract';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OwnerSignUpPage } from './pages/OwnerSignUpPage';
import { STYLES } from './pages/styles';
import { returnUrl } from './auth/return-url';

type View = 'login' | 'register' | 'register-owner';

/** /register-owner opens the barbershop sign-up, /register the client sign-up, anything else the login. */
export function initialView(initialPath: string): View {
  if (initialPath.startsWith('/register-owner')) return 'register-owner';
  return initialPath.startsWith('/register') ? 'register' : 'login';
}

export function App({ context }: { context: MountContext }) {
  const [view, setView] = useState<View>(initialView(context.initialPath));

  function signedIn(auth: AuthResponse) {
    context.session.signIn(auth);
    context.navigate(returnUrl(window.location.search));
  }

  const toLogin = () => setView('login');
  return (
    <div className="ia-root">
      <style>{STYLES}</style>
      {view === 'login' && <LoginPage api={context.api} onSignedIn={signedIn} onRegister={() => setView('register')}
                                      onRegisterBarbershop={() => setView('register-owner')} />}
      {view === 'register' && <RegisterPage api={context.api} onSignedIn={signedIn} onLogin={toLogin} />}
      {view === 'register-owner' && <OwnerSignUpPage api={context.api} onSignedIn={signedIn} onLogin={toLogin} />}
    </div>
  );
}
