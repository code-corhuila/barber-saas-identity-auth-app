/** Field checks before calling the API, with the same limits as auth-service.yaml. Messages are on-screen text. */
export type FieldErrors = Partial<Record<'fullName' | 'email' | 'password' | 'phone', string>>;

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

export function validateRegister(input: RegisterInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.fullName.trim();
  if (!name) errors.fullName = 'Escribe tu nombre.';
  else if (name.length > 120) errors.fullName = 'El nombre tiene máximo 120 caracteres.';
  if (!input.email.trim()) errors.email = 'Escribe tu correo.';
  else if (!EMAIL.test(input.email.trim()) || input.email.length > 150) errors.email = 'El correo no es válido.';
  if (input.password.length < 8 || input.password.length > 100) {
    errors.password = 'La contraseña debe tener entre 8 y 100 caracteres.';
  } else if (!/[A-Z]/.test(input.password) || !/\d/.test(input.password)) {
    errors.password = 'La contraseña necesita al menos una mayúscula y un número.';
  }
  if (input.phone.trim().length > 20) errors.phone = 'El teléfono tiene máximo 20 caracteres.';
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
