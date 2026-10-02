import { describe, expect, it } from 'vitest';
import { hasErrors, validateLogin, validateRegister } from './validation';

describe('validateLogin', () => {
  it('asks for the e-mail and the password', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Escribe tu correo.', password: 'Escribe tu contraseña.',
    });
  });

  it('refuses an e-mail without a domain', () => {
    expect(validateLogin({ email: 'maria@', password: 'x' }).email).toBe('El correo no es válido.');
  });
});

describe('validateRegister', () => {
  const valid = { fullName: 'María García', email: 'maria@example.com', password: 'SecurePass123', phone: '' };

  it('accepts the example of the contract', () => {
    expect(hasErrors(validateRegister(valid))).toBe(false);
  });

  it('applies the password policy of the contract', () => {
    expect(validateRegister({ ...valid, password: 'short1A' }).password).toContain('entre 8 y 100');
    expect(validateRegister({ ...valid, password: 'nouppercase1' }).password).toContain('mayúscula');
    expect(validateRegister({ ...valid, password: 'NoDigitsHere' }).password).toContain('número');
  });

  it('limits the name and the phone', () => {
    const errors = validateRegister({ ...valid, fullName: 'a'.repeat(121), phone: '1'.repeat(21) });
    expect(errors.fullName).toBeDefined();
    expect(errors.phone).toBeDefined();
  });
});
