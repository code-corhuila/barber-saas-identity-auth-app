# barber-saas-identity-auth-app

> identity-auth bounded context: mobile UI (remote)

Part of the **Barber Saas** distributed system — team `barber-saas`, Grupo 2.
Governance and documentation live in [`barber-saas-docs`](https://github.com/code-corhuila/barber-saas-docs).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `barber-saas-docs`.

---

## BarberSaaS — what this repository is

The sign-in and registration screens of BarberSaaS: an **Ionic React** domain app (ADR-013)
mounted by the Angular shell (`barber-saas-front`) at `/sign-in`. It exposes only `./mount`
through Native Federation and shares nothing: it receives the shell's HTTP client and session in
the mount context, so it never creates a client or stores a token itself (norm 5.4.1).
Screens ported from the prototype (`(auth)/login`, `(auth)/register`, `(auth)/register-owner`): same
look, Ionic components. The barbershop sign-up runs the owner-onboarding saga of
`barber-saas-workflow` (HU-AUTH-003); its plan step is a confirmation, since plans live in
platform-admin.

```
src/mount.tsx            ./mount(element, context) — what the shell calls
src/shell-contract.ts    the types of the contract with the shell (copied, never imported)
src/auth/auth-api.ts     login and register, through context.api only (Idempotency-Key on register)
src/auth/validation.ts   field checks with the limits of auth-service.yaml
src/auth/owner-onboarding.ts  the owner sign-up: step checks, the saga call and its outcome
src/pages/               LoginPage, RegisterPage, OwnerSignUpPage
```

### How to start it

```bash
npm ci
npm start      # builds and serves dist/identity-auth at http://localhost:4301 (CORS on)
```

Then start the shell (`npm start` in `barber-saas-front`, http://localhost:4200) and the platform
(`./scripts/up.sh dev` in `barber-saas-infra-postgres`), and open http://localhost:4200/sign-in
(http://localhost:4200/sign-in/register-owner for the barbershop sign-up).

### Where the data is

Nowhere in this app: accounts live in `identity_auth` (identity-auth-api), the session in the shell.

### How it is tested

`npm test` (Vitest): validation, the calls to the API, the outcomes of the owner-onboarding saga
and the return address after sign-in.
CI also checks the types and builds the remote.

### What is missing

Password recovery (HU-AUTH-002).
