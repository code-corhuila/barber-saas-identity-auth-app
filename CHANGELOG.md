# Changelog

All notable changes to `barber-saas-identity-auth-app` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-08

MVP 2 (corte 2): first release of this repository to `main`, promoted from `develop` through `qa`
with `git cherry-pick -x` (norm 10–11).

User stories: code-corhuila/barber-saas-docs#3, code-corhuila/barber-saas-docs#7, code-corhuila/barber-saas-docs#59.

### Added

- **contract:** copy the types of the mount contract with the shell
- **auth:** check the fields with the limits of the auth contract
- **auth:** call login and register only through the shell client
- **auth:** return only to internal addresses after sign-in
- **ui:** bring the dark and gold look of the prototype's auth screens
- **ui:** add a labelled field with its error tied by aria-describedby
- **ui:** add the login screen
- **ui:** add the registration screen with one idempotency key per intention
- **ui:** switch between login and registration and return after sign-in
- **federation:** mount the app in the element the shell provides
- **deploy:** serve the built remote for development and review
- **auth:** run the owner-onboarding saga from the app
- **ui:** add the three-step barbershop sign-up screen
- **owner:** pick an active plan in the last sign-up step

### Fixed

- **build:** let the federation adapter bring its own esbuild so npm ci works on linux
- **sign-up:** shorten the password hint so it fits on a phone
- **owner:** word the barber cap of a plan as platform-admin-app

### Documentation

- **readme:** explain the identity app, how to run it with the shell and how to test it
- **readme:** describe the barbershop sign-up
- **readme:** point the header to Barber Saas and barber-saas-docs

### Tests

- **auth:** cover the login and registration field checks
- **auth:** cover the api calls and the return address
- **ci:** install exactly what was tested and run the unit tests
- **ci:** check the types and build the remote on every pull request

### Maintenance

- **app:** ignore dependencies and builds
- **github:** add the pull request template
- **github:** track the story environment on the board
- **env:** state that the domain app holds no secrets
- **build:** pin ionic react 8, react 19 and native federation with a lock file
- **federation:** expose only the mount entry and share nothing
- **build:** build the remote with the shell's native federation
- use the new repository name barber-saas-infra-postgres

[2.0.0]: https://github.com/code-corhuila/barber-saas-identity-auth-app/releases/tag/v2.0.0
