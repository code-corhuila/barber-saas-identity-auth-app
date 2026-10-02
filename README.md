# barber-saas-identity-auth-app

> identity-auth bounded context: mobile UI (remote)

Part of the **LMS Library** distributed system — team `lms-library`, Grupo 2.
Governance and documentation live in [`library-docs`](https://github.com/code-corhuila/library-docs).

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

Full policy: `00-governance/branching-policy.md` in `library-docs`.

---

## BarberSaaS — what this repository is

The sign-in and registration screens of BarberSaaS: an **Ionic React** domain app (ADR-013)
mounted by the Angular shell (`barber-saas-front`) at `/sign-in`. It exposes only `./mount`
through Native Federation and shares nothing: it receives the shell's HTTP client and session in
the mount context, so it never creates a client or stores a token itself (norm 5.4.1).
Screens ported from the prototype (`(auth)/login`, `(auth)/register`): same look, Ionic components.

```
src/mount.tsx            ./mount(element, context) — what the shell calls
src/shell-contract.ts    the types of the contract with the shell (copied, never imported)
src/auth/auth-api.ts     login and register, through context.api only (Idempotency-Key on register)
src/auth/validation.ts   field checks with the limits of auth-service.yaml
src/pages/               LoginPage, RegisterPage
```

### How to start it

```bash
npm ci
npm start      # builds and serves dist/identity-auth at http://localhost:4301 (CORS on)
```

Then start the shell (`npm start` in `barber-saas-front`, http://localhost:4200) and the platform
(`./scripts/up.sh dev` in `barber-saas-infra`), and open http://localhost:4200/sign-in.

### Where the data is

Nowhere in this app: accounts live in `identity_auth` (identity-auth-api), the session in the shell.

### How it is tested

`npm test` (Vitest): validation, the calls to the API and the return address after sign-in.
CI also checks the types and builds the remote.

### What is missing

Password recovery (HU-AUTH-002) and owner self-registration (HU-AUTH-003).
