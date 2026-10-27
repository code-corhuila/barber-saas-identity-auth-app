/** Field checks before calling the API, with the same limits as auth-service.yaml. Messages are on-screen text. */
export type FieldErrors = Partial<Record<'fullName' | 'email' | 'password' | 'phone' | 'code' | 'repeat', string>>;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export function validateLogin(input: LoginInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.email.trim()) errors.email = 'Escribe tu correo.';
  else if (!EMAIL.test(input.email.trim())) errors.email = 'El correo no es válido.';
  if (!input.password) errors.password = 'Escribe tu contraseña.';
  return errors;
}

export interface ResetInput {
  code: string;
  password: string;
  repeat: string;
}

/** The password policy of the contract (Password schema): 8 to 100 characters, one capital, one number. */
function passwordError(password: string): string | undefined {
  if (password.length < 8 || password.length > 100) return 'La contraseña debe tener entre 8 y 100 caracteres.';
  if (!/[A-Z]/.test(password) || !/\d/.test(password)) return 'La contraseña necesita al menos una mayúscula y un número.';
  return undefined;
}

function emailError(email: string): string | undefined {
  if (!email.trim()) return 'Escribe tu correo.';
  if (!EMAIL.test(email.trim()) || email.length > 150) return 'El correo no es válido.';
  return undefined;
}

export function validateRegister(input: RegisterInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.fullName.trim();
  if (!name) errors.fullName = 'Escribe tu nombre.';
  else if (name.length > 120) errors.fullName = 'El nombre tiene máximo 120 caracteres.';
  const email = emailError(input.email);
  if (email) errors.email = email;
  const password = passwordError(input.password);
  if (password) errors.password = password;
  if (input.phone.trim().length > 20) errors.phone = 'El teléfono tiene máximo 20 caracteres.';
  return errors;
}

/** The first step of the password reset: only the e-mail. */
export function validateResetEmail(email: string): FieldErrors {
  const error = emailError(email);
  return error ? { email: error } : {};
}

/** The second step: the 6-digit code and the new password, written twice. */
export function validateReset(input: ResetInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!/^\d{6}$/.test(input.code.trim())) errors.code = 'Escribe los 6 dígitos del código.';
  const password = passwordError(input.password);
  if (password) errors.password = password;
  else if (input.password !== input.repeat) errors.repeat = 'Las contraseñas no coinciden.';
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
