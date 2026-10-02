/** The look of the prototype's auth screens: dark background, gold accent. Scoped to .ia-root. */
export const STYLES = `
.ia-root { min-height: 100%; background: #121212; color: #fff; display: flex; justify-content: center; }
.ia-page { width: 100%; max-width: 26rem; padding: 2rem 1.5rem; }
.ia-logo { width: 72px; height: 72px; border-radius: 50%; background: #1e1e1e; border: 2px solid #d4af37;
  display: grid; place-items: center; font-size: 32px; margin: 1.5rem auto 1rem; }
.ia-title { text-align: center; font-size: 1.5rem; font-weight: 700; margin: 0; }
.ia-subtitle { text-align: center; color: #888; font-size: .875rem; margin: .4rem 0 2rem; }
.ia-field { margin-bottom: 1rem; }
.ia-field ion-input { --background: #1e1e1e; --color: #fff; --placeholder-color: #666; --border-radius: 10px;
  --padding-start: 12px; --highlight-color-focused: #d4af37; }
.ia-error { color: #ff6b6b; font-size: .8rem; margin-top: .3rem; }
.ia-alert { display: flex; gap: .5rem; background: #2a1414; border: 1px solid #ff6b6b; color: #ffb3b3;
  border-radius: 10px; padding: .75rem; margin: .5rem 0 1rem; font-size: .875rem; }
.ia-submit { --background: #d4af37; --color: #121212; --border-radius: 10px; font-weight: 700; margin-top: .5rem; }
.ia-link { display: block; width: 100%; background: none; border: 0; color: #888; text-align: center;
  margin-top: 1.25rem; font-size: .875rem; cursor: pointer; }
.ia-link strong { color: #d4af37; }
`;
