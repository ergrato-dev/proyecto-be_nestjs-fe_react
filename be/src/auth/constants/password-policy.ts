/**
 * Archivo: auth/constants/password-policy.ts.
 * Descripción: Regla de fortaleza de contraseña compartida por todos los DTOs que la validan.
 * ¿Para qué? Cumplir el requisito no funcional: ≥8 caracteres, 1 mayúscula, 1 minúscula, 1 número.
 * ¿Impacto? Si esta regex cambia, cambia en un único lugar para register/change/reset-password.
 */

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.';
