import { useState } from 'react';
import type { AuthResponse, MountContext } from './shell-contract';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { STYLES } from './pages/styles';
import { returnUrl } from './auth/return-url';

type View = 'login' | 'register';

export function App({ context }: { context: MountContext }) {
  const [view, setView] = useState<View>(context.initialPath.startsWith('/register') ? 'register' : 'login');

  function signedIn(auth: AuthResponse) {
    context.session.signIn(auth);
    context.navigate(returnUrl(window.location.search));
  }

  return (
    <div className="ia-root">
      <style>{STYLES}</style>
      {view === 'login'
        ? <LoginPage api={context.api} onSignedIn={signedIn} onRegister={() => setView('register')} />
        : <RegisterPage api={context.api} onSignedIn={signedIn} onLogin={() => setView('login')} />}
    </div>
  );
}
